from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from database import get_db
from models import BusinessService, Provider, Slot
from schemas import ProviderResponse, ServiceResponse

router = APIRouter(prefix="/providers", tags=["Providers"])


def time_24(value):
    return value.strftime("%H:%M") if value else "09:00"


async def provider_dto(provider: Provider, db: AsyncSession, slot_date: date) -> ProviderResponse:
    result = await db.execute(
        select(Slot).where(Slot.provider_id == provider.id, Slot.date == slot_date, Slot.is_blocked.is_(False))
    )
    slots = result.scalars().all()

    services_result = await db.execute(
        select(BusinessService).where(BusinessService.provider_id == provider.id, BusinessService.is_active.is_(True))
    )
    services = services_result.scalars().all()

    return ProviderResponse(
        id=provider.id,
        name=provider.name,
        type=provider.type,
        address=provider.address,
        phone=provider.phone,
        email=provider.email,
        distanceKm=provider.distance_km,
        waitMinutes=provider.wait_minutes,
        workingHoursStart=time_24(provider.working_hours_start),
        workingHoursEnd=time_24(provider.working_hours_end),
        slotDurationMinutes=provider.slot_duration_minutes,
        activeCounter=provider.active_counter or "Counter 1",
        slots=[time_24(slot.start_time) for slot in slots],
        bookedSlots=[time_24(slot.start_time) for slot in slots if slot.is_booked],
        services=[
            ServiceResponse(
                id=s.id,
                providerId=s.provider_id,
                name=s.name,
                durationMinutes=s.duration_minutes,
                price=s.price,
                description=s.description,
                isActive=s.is_active,
            )
            for s in services
        ],
    )


@router.get("", response_model=list[ProviderResponse])
async def get_providers(
    type: str | None = Query(None),
    date: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db),
):
    query = select(Provider).where(Provider.is_active.is_(True))
    if type:
        query = query.where(Provider.type == type)
    providers = (await db.execute(query)).scalars().all()
    return [await provider_dto(provider, db, date) for provider in providers]


@router.get("/{provider_id}", response_model=ProviderResponse)
async def get_provider(
    provider_id: str,
    date: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db),
):
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return await provider_dto(provider, db, date)
