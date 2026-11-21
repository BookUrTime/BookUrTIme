import datetime as dt
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from database import get_db
from models import Booking, BookingStatusEnum, BusinessService, Provider, Slot, User
from routers.bookings import booking_dto
from schemas import (
    BookingResponse,
    DashboardMetricsResponse,
    ProviderProfileUpdate,
    ProviderResponse,
    QueueLiveStateResponse,
    ScheduleGenerateRequest,
    ServiceCreate,
    ServiceResponse,
    SlotResponse,
)

router = APIRouter(prefix="/business", tags=["Business Portal"])


def time_str(t: dt.time | None) -> str:
    return t.strftime("%H:%M") if t else "09:00"


def service_dto(s: BusinessService) -> ServiceResponse:
    return ServiceResponse(
        id=s.id,
        providerId=s.provider_id,
        name=s.name,
        durationMinutes=s.duration_minutes,
        price=s.price,
        description=s.description,
        isActive=s.is_active,
    )


@router.get("/{provider_id}/profile", response_model=ProviderResponse)
async def get_business_profile(provider_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Provider).options(joinedload(Provider.services)).where(Provider.id == provider_id)
    )
    provider = result.unique().scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Business not found")

    services = [service_dto(s) for s in provider.services if s.is_active]
    return ProviderResponse(
        id=provider.id,
        name=provider.name,
        type=provider.type,
        address=provider.address,
        phone=provider.phone,
        email=provider.email,
        distanceKm=provider.distance_km,
        waitMinutes=provider.wait_minutes,
        workingHoursStart=time_str(provider.working_hours_start),
        workingHoursEnd=time_str(provider.working_hours_end),
        slotDurationMinutes=provider.slot_duration_minutes,
        activeCounter=provider.active_counter or "Counter 1",
        services=services,
    )


@router.put("/{provider_id}/profile", response_model=ProviderResponse)
async def update_business_profile(
    provider_id: str,
    payload: ProviderProfileUpdate,
    db: AsyncSession = Depends(get_db),
):
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Business not found")

    if payload.name is not None:
        provider.name = payload.name
    if payload.type is not None:
        provider.type = payload.type
    if payload.address is not None:
        provider.address = payload.address
    if payload.phone is not None:
        provider.phone = payload.phone
    if payload.email is not None:
        provider.email = payload.email
    if payload.waitMinutes is not None:
        provider.wait_minutes = payload.waitMinutes
    if payload.activeCounter is not None:
        provider.active_counter = payload.activeCounter
    if payload.slotDurationMinutes is not None:
        provider.slot_duration_minutes = payload.slotDurationMinutes
    if payload.workingHoursStart is not None:
        try:
            provider.working_hours_start = dt.time.fromisoformat(payload.workingHoursStart)
        except ValueError:
            pass
    if payload.workingHoursEnd is not None:
        try:
            provider.working_hours_end = dt.time.fromisoformat(payload.workingHoursEnd)
        except ValueError:
            pass

    await db.commit()
    await db.refresh(provider)
    return await get_business_profile(provider_id, db)


# --- Services Management ---

@router.get("/{provider_id}/services", response_model=list[ServiceResponse])
async def list_services(provider_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BusinessService)
        .where(BusinessService.provider_id == provider_id, BusinessService.is_active.is_(True))
        .order_by(BusinessService.id)
    )
    return [service_dto(s) for s in result.scalars().all()]


@router.post("/{provider_id}/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(provider_id: str, payload: ServiceCreate, db: AsyncSession = Depends(get_db)):
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Business not found")

    new_service = BusinessService(
        provider_id=provider_id,
        name=payload.name,
        duration_minutes=payload.durationMinutes,
        price=payload.price,
        description=payload.description,
        is_active=True,
    )
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)
    return service_dto(new_service)


@router.delete("/{provider_id}/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(provider_id: str, service_id: int, db: AsyncSession = Depends(get_db)):
    service = (
        await db.execute(
            select(BusinessService).where(
                BusinessService.id == service_id, BusinessService.provider_id == provider_id
            )
        )
    ).scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    service.is_active = False
    await db.commit()
    return None


# --- Schedule & Slot Generator ---

@router.post("/{provider_id}/schedule/generate", response_model=list[SlotResponse])
async def generate_business_schedule(
    provider_id: str,
    payload: ScheduleGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Business not found")

    target_date = payload.date
    start_time = dt.time(payload.startHour, 0)
    end_time = dt.time(payload.endHour, 0)
    interval = dt.timedelta(minutes=payload.intervalMinutes)

    # Delete existing non-booked slots for this date to regenerate clean schedule
    existing_slots = (
        await db.execute(
            select(Slot).where(
                Slot.provider_id == provider_id,
                Slot.date == target_date,
            )
        )
    ).scalars().all()

    existing_booked_times = {s.start_time for s in existing_slots if s.is_booked}

    # Delete unbooked slots to avoid duplicate conflicts
    for s in existing_slots:
        if not s.is_booked:
            await db.delete(s)
    await db.commit()

    current_dt = dt.datetime.combine(target_date, start_time)
    end_dt = dt.datetime.combine(target_date, end_time)

    new_slots = []
    while current_dt + interval <= end_dt:
        slot_start = current_dt.time()
        slot_end = (current_dt + interval).time()
        if slot_start not in existing_booked_times:
            new_slot = Slot(
                provider_id=provider_id,
                date=target_date,
                start_time=slot_start,
                end_time=slot_end,
                is_booked=False,
                is_blocked=False,
            )
            db.add(new_slot)
            new_slots.append(new_slot)
        current_dt += interval

    await db.commit()

    # Fetch full refreshed slots for this date
    all_slots = (
        await db.execute(
            select(Slot)
            .where(Slot.provider_id == provider_id, Slot.date == target_date)
            .order_by(Slot.start_time)
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
        for s in all_slots
    ]


@router.patch("/{provider_id}/slots/{slot_id}/toggle", response_model=SlotResponse)
async def toggle_slot_blocked(provider_id: str, slot_id: int, db: AsyncSession = Depends(get_db)):
    slot = (
        await db.execute(select(Slot).where(Slot.id == slot_id, Slot.provider_id == provider_id))
    ).scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    slot.is_blocked = not slot.is_blocked
    await db.commit()
    await db.refresh(slot)
    return SlotResponse(
        id=slot.id,
        providerId=slot.provider_id,
        date=slot.date,
        startTime=slot.start_time.strftime("%H:%M"),
        endTime=slot.end_time.strftime("%H:%M"),
        isBooked=slot.is_booked,
        isBlocked=slot.is_blocked,
    )


# --- Live Counter & Queue Station ---

@router.get("/{provider_id}/queue/live", response_model=QueueLiveStateResponse)
async def get_live_queue(
    provider_id: str,
    date: dt.date = Query(default_factory=dt.date.today),
    db: AsyncSession = Depends(get_db),
):
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Business not found")

    result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.slot).joinedload(Slot.provider), joinedload(Booking.user))
        .join(Slot)
        .where(Slot.provider_id == provider_id, Slot.date == date)
        .order_by(Slot.start_time)
    )
    bookings = result.unique().scalars().all()

    in_progress = next((b for b in bookings if b.status == BookingStatusEnum.in_progress.value), None)
    waiting_list = [b for b in bookings if b.status in (BookingStatusEnum.waiting.value, "confirmed")]
    completed_count = sum(1 for b in bookings if b.status == BookingStatusEnum.completed.value)

    return QueueLiveStateResponse(
        providerId=provider.id,
        providerName=provider.name,
        activeCounter=provider.active_counter or "Counter 1",
        currentlyServing=booking_dto(in_progress) if in_progress else None,
        waitingCount=len(waiting_list),
        waitingList=[booking_dto(b) for b in waiting_list],
        completedCount=completed_count,
    )


@router.post("/{provider_id}/queue/call-next", response_model=QueueLiveStateResponse)
async def call_next_token(
    provider_id: str,
    date: dt.date = Query(default_factory=dt.date.today),
    desk: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Business not found")

    desk_name = desk or provider.active_counter or "Counter 1"

    # Fetch today's bookings
    result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.slot).joinedload(Slot.provider), joinedload(Booking.user))
        .join(Slot)
        .where(Slot.provider_id == provider_id, Slot.date == date)
        .order_by(Slot.start_time)
    )
    bookings = result.unique().scalars().all()

    # Automatically complete any booking currently in-progress at this counter
    current_in_progress = [b for b in bookings if b.status == BookingStatusEnum.in_progress.value]
    for b in current_in_progress:
        b.status = BookingStatusEnum.completed.value

    # Find the first waiting customer
    next_waiting = next((b for b in bookings if b.status in (BookingStatusEnum.waiting.value, "confirmed")), None)
    if next_waiting:
        next_waiting.status = BookingStatusEnum.in_progress.value
        next_waiting.desk = desk_name

    await db.commit()
    return await get_live_queue(provider_id, date, db)
