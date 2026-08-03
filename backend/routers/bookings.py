import random
import string
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from database import get_db
from models import Booking, Provider, Slot, User
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
    return {"hospital": "HC", "aadhaar": "AK", "bank": "SB"}.get(provider_type, "HC")


async def generate_token(provider_type: str, db: AsyncSession) -> str:
    prefix = token_prefix(provider_type)
    for _ in range(100):
        token = f"{prefix}-{random.randint(10000, 99999)}"
        if not (await db.execute(select(Booking.id).where(Booking.token == token))).scalar_one_or_none():
            return token
    # Fallback to avoid infinite loop under high load
    timestamp_suffix = int(datetime.now().timestamp() * 1000) % 100000
    return f"{prefix}-{timestamp_suffix}"


def booking_dto(booking: Booking) -> BookingResponse:
    slot, provider, user = booking.slot, booking.slot.provider, booking.user
    return BookingResponse(
        id=booking.id, providerId=provider.id, providerName=provider.name,
        providerType=provider.type, slot=display_time(slot.start_time), token=booking.token,
        name=user.name, phone=user.phone, desk=booking.desk, notes=booking.notes,
        status=booking.status, createdBy=booking.created_by,
        date=booking.created_at.isoformat() if booking.created_at else datetime.now().isoformat(),
    )


async def get_booking(booking_id: str, db: AsyncSession) -> Booking | None:
    result = await db.execute(
        select(Booking).options(joinedload(Booking.slot).joinedload(Slot.provider), joinedload(Booking.user))
        .where(Booking.id == booking_id)
    )
    return result.unique().scalar_one_or_none()


@router.get("/providers/{provider_id}/slots", response_model=list[SlotResponse])
async def get_slots(provider_id: str, date: date, db: AsyncSession = Depends(get_db)):
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    await generate_slots(provider_id, date, db)
    slots = (await db.execute(select(Slot).where(Slot.provider_id == provider_id, Slot.date == date))).scalars().all()
    return [SlotResponse(id=s.id, providerId=s.provider_id, date=s.date, startTime=display_time(s.start_time), endTime=display_time(s.end_time), isBooked=s.is_booked) for s in slots]


@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(payload: BookingCreate, db: AsyncSession = Depends(get_db)):
    provider = (await db.execute(select(Provider).where(Provider.id == payload.providerId))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    target_date = payload.date or date.today()
    slot_time = canonical_time(payload.slot)
    
    # Ensure slots are generated for target date
    await generate_slots(provider.id, target_date, db)

    # Use row-level locking (with_for_update) on the target slot query
    stmt = (
        select(Slot)
        .where(Slot.provider_id == provider.id, Slot.date == target_date)
        .with_for_update()
    )
    slots = (await db.execute(stmt)).scalars().all()
    slot = next((item for item in slots if item.start_time.strftime("%H:%M") == slot_time), None)
    
    if not slot:
        raise HTTPException(status_code=404, detail="Requested slot not found")
    if slot.is_booked:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slot has already been booked by another user")

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
        id=booking_id, user_id=user.id, slot_id=slot.id, token=await generate_token(provider.type, db),
        status="waiting", reason=payload.reason,
        desk=payload.desk, notes=payload.notes, created_by=payload.createdBy
    )
    db.add(booking)
    slot.is_booked = True
    
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking collision detected, please choose another slot") from e

    stored = await get_booking(booking_id, db)
    return booking_dto(stored)



@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(booking_id: str, db: AsyncSession = Depends(get_db)):
    booking = await get_booking(booking_id, db)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "cancelled"
    booking.slot.is_booked = False
    await db.commit()


@router.patch("/bookings/{booking_id}/no-show", response_model=BookingResponse)
async def mark_no_show(booking_id: str, db: AsyncSession = Depends(get_db)):
    booking = await get_booking(booking_id, db)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "no-show"
    await db.commit()
    stored = await get_booking(booking_id, db)
    return booking_dto(stored)


@router.patch("/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking_status(booking_id: str, payload: BookingStatusUpdate, db: AsyncSession = Depends(get_db)):
    booking = await get_booking(booking_id, db)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = payload.status
    await db.commit()
    stored = await get_booking(booking_id, db)
    return booking_dto(stored)
