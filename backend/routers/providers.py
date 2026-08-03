from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Provider, Slot
from schemas import ProviderResponse

router = APIRouter(prefix="/providers", tags=["Providers"])


def time_24(value):
    return value.strftime("%H:%M")


async def provider_dto(provider: Provider, db: AsyncSession, slot_date: date) -> ProviderResponse:
    result = await db.execute(select(Slot).where(Slot.provider_id == provider.id, Slot.date == slot_date))
    slots = result.scalars().all()
    return ProviderResponse(
        id=provider.id, name=provider.name, type=provider.type, address=provider.address,
        distanceKm=provider.distance_km, waitMinutes=provider.wait_minutes,
        slots=[time_24(slot.start_time) for slot in slots],
        bookedSlots=[time_24(slot.start_time) for slot in slots if slot.is_booked],
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
