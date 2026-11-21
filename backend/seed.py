import asyncio
from datetime import date, time
from sqlalchemy import func, select

from database import AsyncSessionLocal, Base, engine
from models import Booking, BusinessService, Provider, Slot, User

PROVIDERS = [
    {
        "id": "citycare",
        "name": "CityCare Clinic & Diagnostics",
        "type": "hospital",
        "address": "Block E, Connaught Place, New Delhi, Delhi 110001",
        "phone": "+91 98111 22334",
        "email": "reception@citycareclinic.com",
        "distance_km": 1.8,
        "wait_minutes": 12,
        "active_counter": "Doctor Room 1",
        "services": [
            {"name": "General Physician Consultation", "duration": 20, "price": 500, "description": "Routine medical checkup, fever, cold, prescription refill."},
            {"name": "Specialist Consultation (Cardio/Pediatric)", "duration": 30, "price": 900, "description": "Comprehensive specialist diagnostic visit."},
            {"name": "Blood Test & Pathology Collection", "duration": 15, "price": 350, "description": "Fasting and routine sample collection."},
        ],
        "slots": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30"],
    },
    {
        "id": "urban-glow",
        "name": "Urban Glow Salon & Spa Studio",
        "type": "salon",
        "address": "Market Lane, Khan Market, New Delhi 110003",
        "phone": "+91 98444 55667",
        "email": "bookings@urbanglow.in",
        "distance_km": 2.4,
        "wait_minutes": 10,
        "active_counter": "Styling Chair 2",
        "services": [
            {"name": "Haircut, Styling & Beard Grooming", "duration": 30, "price": 450, "description": "Precision haircut, wash, beard trim and hair styling."},
            {"name": "Organic Detox Facial & Cleanup", "duration": 45, "price": 1200, "description": "Deep skin cleansing, scrub, and hydrating face massage."},
            {"name": "Head & Shoulder Aroma Massage", "duration": 30, "price": 800, "description": "Relaxing pressure-point stress relief therapy."},
        ],
        "slots": ["10:00", "10:45", "11:30", "12:15", "14:00", "14:45", "15:30", "16:15", "17:00"],
    },
    {
        "id": "apex-dental",
        "name": "Apex Modern Dental & Orthodontics",
        "type": "dental",
        "address": "Ring Road, South Extension Part 2, New Delhi 110049",
        "phone": "+91 98555 66778",
        "email": "contact@apexdental.com",
        "distance_km": 3.8,
        "wait_minutes": 15,
        "active_counter": "Dental Operatory A",
        "services": [
            {"name": "Complete Dental Checkup & Digital X-Ray", "duration": 25, "price": 600, "description": "Oral examination, cavity detection, and high-res imaging."},
            {"name": "Ultrasonic Teeth Cleaning & Polishing", "duration": 30, "price": 1000, "description": "Plaque removal, stain polish, and gum care."},
            {"name": "Root Canal Consultation & Assessment", "duration": 40, "price": 850, "description": "Endodontic pain assessment and treatment planning."},
        ],
        "slots": ["09:30", "10:15", "11:00", "11:45", "14:00", "14:45", "15:30", "16:15"],
    },
    {
        "id": "aadhaar-seva",
        "name": "Aadhaar Seva Kendra - East Hub",
        "type": "aadhaar",
        "address": "Akshardham Metro Station Complex, Laxmi Nagar, New Delhi 110092",
        "phone": "+91 98222 33445",
        "email": "helpdesk@aadhaarseva.gov.in",
        "distance_km": 3.2,
        "wait_minutes": 20,
        "active_counter": "Counter 3",
        "services": [
            {"name": "Biometric Update (Iris & Fingerprint)", "duration": 15, "price": 100, "description": "Mandatory biometric capture for adults and children."},
            {"name": "Demographic Update (Address / Name / Phone)", "duration": 20, "price": 50, "description": "Change of residence or mobile number link."},
            {"name": "New Aadhaar Enrolment", "duration": 30, "price": 0, "description": "Fresh registration for infants or un-enrolled residents."},
        ],
        "slots": ["09:00", "09:45", "10:30", "11:15", "12:00", "14:00", "14:45", "15:30", "16:15"],
    },
    {
        "id": "state-bank",
        "name": "State Bank of India - Janpath Branch",
        "type": "bank",
        "address": "Parliament Street, Janpath, New Delhi, Delhi 110001",
        "phone": "+91 98333 44556",
        "email": "branch.janpath@sbi.co.in",
        "distance_km": 0.9,
        "wait_minutes": 25,
        "active_counter": "Counter 1 (Accounts)",
        "services": [
            {"name": "Savings / Current Account Opening", "duration": 30, "price": 0, "description": "KYC submission, debit card issue, internet banking setup."},
            {"name": "Forex & International Remittance", "duration": 20, "price": 0, "description": "Currency exchange and swift wire transfers."},
            {"name": "Locker Access & Operations", "duration": 15, "price": 0, "description": "Safe deposit vault access and inspection."},
        ],
        "slots": ["10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30"],
    },
    {
        "id": "lex-consult",
        "name": "LexConsult Legal & Notary Kiosk",
        "type": "legal",
        "address": "Lawyers Chambers, High Court Complex, New Delhi 110003",
        "phone": "+91 98666 77889",
        "email": "chamber@lexconsult.in",
        "distance_km": 2.1,
        "wait_minutes": 15,
        "active_counter": "Chamber Desk 4",
        "services": [
            {"name": "Affidavit Attestation & Notary Service", "duration": 15, "price": 300, "description": "Instant verification, stamp and official notarization."},
            {"name": "Property Agreement & Rent Deed Review", "duration": 30, "price": 1500, "description": "Legal deed vetting, clause audit and lease draft."},
            {"name": "General Legal Consultation", "duration": 30, "price": 1000, "description": "Initial case assessment with legal advocate."},
        ],
        "slots": ["11:00", "11:45", "12:30", "14:00", "14:45", "15:30", "16:15"],
    },
]


async def seed_data():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        if (await db.execute(select(func.count(Provider.id)))).scalar_one() > 0:
            return

        demo_user = User(name="Ramesh Sharma", phone="+91 98765 43210")
        db.add(demo_user)
        await db.flush()

        for item in PROVIDERS:
            provider = Provider(
                id=item["id"],
                name=item["name"],
                type=item["type"],
                address=item["address"],
                phone=item.get("phone"),
                email=item.get("email"),
                distance_km=item["distance_km"],
                wait_minutes=item["wait_minutes"],
                working_hours_start=time(9),
                working_hours_end=time(17),
                slot_duration_minutes=30,
                active_counter=item.get("active_counter", "Counter 1"),
            )
            db.add(provider)
            await db.flush()

            # Seed services for this provider
            for svc_data in item.get("services", []):
                db.add(
                    BusinessService(
                        provider_id=provider.id,
                        name=svc_data["name"],
                        duration_minutes=svc_data["duration"],
                        price=svc_data["price"],
                        description=svc_data["description"],
                        is_active=True,
                    )
                )

            # Seed slots
            for time_text in item["slots"]:
                start = time.fromisoformat(time_text)
                end_minutes = start.hour * 60 + start.minute + 30
                end_t = time(end_minutes // 60, end_minutes % 60)
                db.add(
                    Slot(
                        provider_id=provider.id,
                        date=date.today(),
                        start_time=start,
                        end_time=end_t,
                        is_booked=False,
                    )
                )

        await db.commit()

        # Mark initial sample booking for demo
        citycare_slot = (
            await db.execute(
                select(Slot).where(Slot.provider_id == "citycare", Slot.start_time == time(9, 30))
            )
        ).scalar_one_or_none()

        if citycare_slot:
            citycare_slot.is_booked = True
            db.add(
                Booking(
                    id="bk-sample-1",
                    user_id=demo_user.id,
                    slot_id=citycare_slot.id,
                    service_name="General Physician Consultation",
                    token="HC-1001",
                    status="in-progress",
                    desk="Doctor Room 1",
                    notes="Follow-up consultation",
                    created_by="Walk-in Desk",
                )
            )

        citycare_slot_2 = (
            await db.execute(
                select(Slot).where(Slot.provider_id == "citycare", Slot.start_time == time(10, 0))
            )
        ).scalar_one_or_none()

        if citycare_slot_2:
            citycare_slot_2.is_booked = True
            db.add(
                Booking(
                    id="bk-sample-2",
                    user_id=demo_user.id,
                    slot_id=citycare_slot_2.id,
                    service_name="Blood Test & Pathology Collection",
                    token="HC-1002",
                    status="waiting",
                    desk="Doctor Room 1",
                    notes="Fasting blood sample",
                    created_by="Online Booking",
                )
            )

        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed_data())
