import random
import asyncio
from datetime import datetime, time, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import models
from database import AsyncSessionLocal, engine, Base
from services.slot_engine import generate_slots

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        # Check if DB is empty (skip if users exist)
        result = await db.execute(select(func.count(models.User.id)))
        if result.scalar() > 0:
            print("Database already seeded.")
            return

        print("Seeding database...")
        
        # Add Users
        users = [
            models.User(name="Rahul Kumar", phone="9876543210", language=models.LanguageEnum.hindi),
            models.User(name="Priya Singh", phone="9876543211", language=models.LanguageEnum.english),
            models.User(name="Amit Sharma", phone="9876543212", language=models.LanguageEnum.hindi),
        ]
        db.add_all(users)
        await db.commit()
        
        # Add Providers
        provider_data = [
            {"name": "City Hospital", "type": models.ProviderTypeEnum.hospital, "city": "Delhi"},
            {"name": "SBI Branch", "type": models.ProviderTypeEnum.bank, "city": "Gurgaon"},
            {"name": "Local Clinic", "type": models.ProviderTypeEnum.local, "city": "Noida"},
            {"name": "Passport Office", "type": models.ProviderTypeEnum.government, "city": "Delhi"},
            {"name": "Apollo Clinic", "type": models.ProviderTypeEnum.hospital, "city": "Delhi"},
            {"name": "HDFC Bank", "type": models.ProviderTypeEnum.bank, "city": "Noida"},
            {"name": "Dr. Batra", "type": models.ProviderTypeEnum.local, "city": "Gurgaon"},
            {"name": "RTO Office", "type": models.ProviderTypeEnum.government, "city": "Gurgaon"},
            {"name": "Max Hospital", "type": models.ProviderTypeEnum.hospital, "city": "Delhi"},
            {"name": "Dental Clinic", "type": models.ProviderTypeEnum.local, "city": "Delhi"},
        ]
        
        providers = []
        for p in provider_data:
            provider = models.Provider(
                name=p["name"],
                type=p["type"],
                city=p["city"],
                latitude=28.6139 + random.uniform(-0.1, 0.1),
                longitude=77.2090 + random.uniform(-0.1, 0.1),
                working_hours_start=time(9, 0),
                working_hours_end=time(17, 0),
                slot_duration_minutes=15
            )
            providers.append(provider)
        db.add_all(providers)
        await db.commit()
        
        # Fetch inserted users and providers
        users = (await db.execute(select(models.User))).scalars().all()
        providers = (await db.execute(select(models.Provider))).scalars().all()
        
        # Generate slots and book 30%
        today = date.today()
        all_slots = []
        for provider in providers:
            slots = await generate_slots(provider.id, today, db)
            if slots:
                all_slots.extend(slots)
                
        # Book random slots
        num_to_book = int(len(all_slots) * 0.3)
        slots_to_book = random.sample(all_slots, num_to_book)
        
        for slot in slots_to_book:
            user = random.choice(users)
            booking = models.Booking(
                user_id=user.id,
                slot_id=slot.id,
                status=models.BookingStatusEnum.confirmed,
                reason="Regular checkup/visit"
            )
            db.add(booking)
            slot.is_booked = True
            
        await db.commit()
        print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
