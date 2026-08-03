import asyncio
from datetime import date, time
from sqlalchemy import func, select

from database import AsyncSessionLocal, Base, engine
from models import Provider, Slot, User


# These public fields intentionally mirror the frontend provider contract.
PROVIDERS = [
    {"id": "citycare", "name": "CityCare Clinic", "type": "hospital", "address": "CityCare Clinic, Block E, Connaught Place, New Delhi, Delhi 110001", "distance_km": 1.8, "wait_minutes": 12, "slots": ["09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00"]},
    {"id": "apollo-hospital", "name": "Apollo Hospital", "type": "hospital", "address": "Apollo Hospital, Sarita Vihar, New Delhi, Delhi 110076", "distance_km": 4.1, "wait_minutes": 18, "slots": ["09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00"]},
    {"id": "fortis-memorial", "name": "Fortis Memorial", "type": "hospital", "address": "Fortis Memorial, Sector 44, Gurugram, Haryana 122002", "distance_km": 5.6, "wait_minutes": 22, "slots": ["09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00"]},
    {"id": "aadhaar-seva", "name": "Aadhaar Seva Kendra", "type": "aadhaar", "address": "Aadhaar Seva Kendra, Akshardham Metro Station Building, Laxmi Nagar, New Delhi, Delhi 110092", "distance_km": 3.2, "wait_minutes": 24, "slots": ["09:00", "09:45", "10:30", "11:15", "14:00", "14:45", "15:30"]},
    {"id": "state-bank", "name": "State Bank Branch", "type": "bank", "address": "State Bank of India Branch, Parliament Street, Janpath, New Delhi, Delhi 110001", "distance_km": 0.9, "wait_minutes": 38, "slots": ["10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30"]},
]


async def seed_data():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        if (await db.execute(select(func.count(Provider.id)))).scalar_one() > 0:
            return
        db.add(User(name="Demo User", phone="9999999999"))
        for item in PROVIDERS:
            duration = item.get("slot_duration_minutes", 30)
            if duration <= 0:
                raise ValueError(f"Invalid slot duration minutes {duration} for provider {item['id']}")
            db.add(Provider(
                id=item["id"], name=item["name"], type=item["type"], address=item["address"],
                distance_km=item["distance_km"], wait_minutes=item["wait_minutes"],
                working_hours_start=time(9), working_hours_end=time(17), slot_duration_minutes=duration,
            ))

        await db.commit()
        for provider in PROVIDERS:
            for time_text in provider["slots"]:
                start = time.fromisoformat(time_text)
                end_minutes = start.hour * 60 + start.minute + 30
                db.add(Slot(provider_id=provider["id"], date=date.today(), start_time=start,
                            end_time=time(end_minutes // 60, end_minutes % 60)))
        await db.commit()
        # Match dummyData's visible booked examples where provider/time overlaps.
        booked = {"citycare": {"09:30", "14:30"}, "aadhaar-seva": {"10:30", "15:30"}, "state-bank": {"11:00", "14:00"}}
        slots = (await db.execute(select(Slot))).scalars().all()
        for slot in slots:
            if slot.start_time.strftime("%H:%M") in booked.get(slot.provider_id, set()):
                slot.is_booked = True
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed_data())
