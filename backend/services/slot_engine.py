from datetime import datetime, timedelta, date as datetime_date
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Provider, Slot


async def generate_slots(provider_id: str, date: datetime_date, db: AsyncSession):
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if not provider:
        return []
    if not provider.slot_duration_minutes or provider.slot_duration_minutes <= 0:
        raise HTTPException(status_code=400, detail="Invalid provider slot duration minutes (must be > 0)")
    existing = (await db.execute(select(Slot).where(Slot.provider_id == provider_id, Slot.date == date))).scalars().all()
    if existing:
        return existing
    current = datetime.combine(date, provider.working_hours_start)
    end = datetime.combine(date, provider.working_hours_end)
    interval = timedelta(minutes=provider.slot_duration_minutes)
    slots = []
    while current + interval <= end:
        slots.append(Slot(provider_id=provider_id, date=date, start_time=current.time(), end_time=(current + interval).time()))
        current += interval
    if slots:
        db.add_all(slots)
        await db.commit()
    return slots

