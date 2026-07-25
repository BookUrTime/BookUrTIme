from datetime import datetime, timedelta, date as datetime_date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Provider, Slot

async def generate_slots(provider_id: int, date: datetime_date, db: AsyncSession):
    # Fetch provider
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        return None

    # Check if slots already exist for this date
    existing_slots_result = await db.execute(
        select(Slot).where(Slot.provider_id == provider_id, Slot.date == date)
    )
    existing_slots = existing_slots_result.scalars().all()
    if existing_slots:
        return existing_slots

    # Generate slots
    start_dt = datetime.combine(date, provider.working_hours_start)
    end_dt = datetime.combine(date, provider.working_hours_end)
    slot_duration = timedelta(minutes=provider.slot_duration_minutes)

    new_slots = []
    current_dt = start_dt
    while current_dt + slot_duration <= end_dt:
        new_slot = Slot(
            provider_id=provider_id,
            date=date,
            start_time=current_dt.time(),
            end_time=(current_dt + slot_duration).time(),
            is_booked=False
        )
        new_slots.append(new_slot)
        current_dt += slot_duration

    if new_slots:
        db.add_all(new_slots)
        await db.commit()
    
    return new_slots
