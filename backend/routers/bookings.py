import random
import string
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from database import get_db
from models import Booking, BookingStatusEnum, BusinessService, Provider, Slot, User
from schemas import BookingCreate, BookingResponse, BookingStatusUpdate, SlotResponse
from services.slot_engine import generate_slots

router = APIRouter(tags=["Bookings"])


def display_time(value) -> str:
    return value.strftime("%I:%M %p")


def canonical_time(value: str) -> str:
    for pattern in ("%I:%M %p", "%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(value.strip(), pattern).strftime("%H:%M")
        except ValueError:
            pass
    raise HTTPException(status_code=422, detail="slot must be HH:MM AM/PM or HH:MM")


def token_prefix(provider_type: str) -> str:
    return {"hospital": "HC", "aadhaar": "AK", "bank": "SB", "salon": "SL"}.get(provider_type, "BK")


async def generate_token(provider_type: str, db: AsyncSession) -> str:
    prefix = token_prefix(provider_type)
    for _ in range(100):
        token = f"{prefix}-{random.randint(1000, 9999)}"
        if not (await db.execute(select(Booking.id).where(Booking.token == token))).scalar_one_or_none():
            return token
    timestamp_suffix = int(datetime.now().timestamp() * 1000) % 100000
    return f"{prefix}-{timestamp_suffix}"


def booking_dto(booking: Booking, queue_position: int | None = None, serving_token: str | None = None) -> BookingResponse:
    slot, provider, user = booking.slot, booking.slot.provider, booking.user
    return BookingResponse(
        id=booking.id,
        providerId=provider.id,
        providerName=provider.name,
        providerType=provider.type,
        serviceId=booking.service_id,
        serviceName=booking.service_name or (booking.service.name if booking.service else None),
        slot=display_time(slot.start_time),
        token=booking.token,
        name=user.name,
        phone=user.phone,
        desk=booking.desk or provider.active_counter or "Counter 1",
        notes=booking.notes,
        status=booking.status,
        createdBy=booking.created_by,
        date=booking.created_at.isoformat() if booking.created_at else datetime.now().isoformat(),
        queuePosition=queue_position,
        currentlyServingToken=serving_token,
    )


async def get_booking(booking_id: str, db: AsyncSession) -> Booking | None:
    result = await db.execute(
        select(Booking)
        .options(
            joinedload(Booking.slot).joinedload(Slot.provider),
            joinedload(Booking.user),
            joinedload(Booking.service),
        )
        .where(Booking.id == booking_id)
    )
    return result.unique().scalar_one_or_none()


async def enrich_booking_dto(booking: Booking, db: AsyncSession) -> BookingResponse:
    # Calculate queue position for today
    day = booking.slot.date
    provider_id = booking.slot.provider_id

    result = await db.execute(
        select(Booking)
        .join(Slot)
        .where(Slot.provider_id == provider_id, Slot.date == day)
        .order_by(Slot.start_time)
    )
    all_day_bookings = result.scalars().all()

    in_progress = next((b for b in all_day_bookings if b.status == BookingStatusEnum.in_progress.value), None)
    serving_token = in_progress.token if in_progress else None

    # Calculate how many waiting bookings are before this one
    waiting_ahead = 0
    if booking.status in (BookingStatusEnum.waiting.value, "confirmed"):
        for b in all_day_bookings:
            if b.id == booking.id:
                break
            if b.status in (BookingStatusEnum.waiting.value, "confirmed"):
                waiting_ahead += 1
    queue_pos = waiting_ahead + 1 if booking.status in (BookingStatusEnum.waiting.value, "confirmed") else 0

    return booking_dto(booking, queue_position=queue_pos, serving_token=serving_token)


@router.get("/providers/{provider_id}/slots", response_model=list[SlotResponse])
async def get_slots(provider_id: str, date: date, db: AsyncSession = Depends(get_db)):
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    await generate_slots(provider_id, date, db)
    slots = (
        await db.execute(
            select(Slot).where(Slot.provider_id == provider_id, Slot.date == date).order_by(Slot.start_time)
        )
    ).scalars().all()
    return [
        SlotResponse(
            id=s.id,
            providerId=s.provider_id,
            serviceId=s.service_id,
            date=s.date,
            startTime=s.start_time.strftime("%H:%M"),
            endTime=s.end_time.strftime("%H:%M"),
            isBooked=s.is_booked,
            isBlocked=s.is_blocked,
        )
        for s in slots
    ]


@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(payload: BookingCreate, db: AsyncSession = Depends(get_db)):
    provider = (await db.execute(select(Provider).where(Provider.id == payload.providerId))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    target_date = payload.date or date.today()
    slot_time = canonical_time(payload.slot)

    await generate_slots(provider.id, target_date, db)

    stmt = select(Slot).where(Slot.provider_id == provider.id, Slot.date == target_date).with_for_update()
    slots = (await db.execute(stmt)).scalars().all()
    slot = next((item for item in slots if item.start_time.strftime("%H:%M") == slot_time), None)

    if not slot:
        raise HTTPException(status_code=404, detail="Requested slot not found")
    if slot.is_booked or slot.is_blocked:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slot has already been booked or is blocked")

    service_name = payload.serviceName
    if payload.serviceId and not service_name:
        svc = (await db.execute(select(BusinessService).where(BusinessService.id == payload.serviceId))).scalar_one_or_none()
        if svc:
            service_name = svc.name

    phone = payload.phone or f"guest-{random.randint(1000000000, 9999999999)}"
    user = (await db.execute(select(User).where(User.phone == phone))).scalar_one_or_none()
    if user:
        user.name = payload.name or "Guest User"
    else:
        user = User(name=payload.name or "Guest User", phone=phone)
        db.add(user)
        await db.flush()

    booking_id = "".join(random.choices(string.ascii_lowercase + string.digits, k=9))
    while (await db.execute(select(Booking.id).where(Booking.id == booking_id))).scalar_one_or_none():
        booking_id = "".join(random.choices(string.ascii_lowercase + string.digits, k=9))

    booking = Booking(
        id=booking_id,
        user_id=user.id,
        slot_id=slot.id,
        service_id=payload.serviceId,
        service_name=service_name,
        token=await generate_token(provider.type, db),
        status="waiting",
        reason=payload.reason,
        desk=payload.desk or provider.active_counter or "Counter 1",
        notes=payload.notes,
        created_by=payload.createdBy,
    )
    db.add(booking)
    slot.is_booked = True

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Booking collision detected, please choose another slot"
        ) from e

    stored = await get_booking(booking_id, db)
    return await enrich_booking_dto(stored, db)


@router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking_by_id(booking_id: str, db: AsyncSession = Depends(get_db)):
    booking = await get_booking(booking_id, db)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return await enrich_booking_dto(booking, db)


@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(booking_id: str, db: AsyncSession = Depends(get_db)):
    booking = await get_booking(booking_id, db)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "cancelled"
    booking.slot.is_booked = False
    await db.commit()


@router.patch("/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking_status(
    booking_id: str,
    payload: BookingStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    booking = await get_booking(booking_id, db)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = payload.status
    if payload.desk:
        booking.desk = payload.desk
    if payload.status in ("cancelled", "no-show"):
        booking.slot.is_booked = False
    await db.commit()
    return await enrich_booking_dto(booking, db)
