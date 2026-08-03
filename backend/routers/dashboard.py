from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from database import get_db
from models import Booking, Slot
from routers.bookings import booking_dto
from schemas import BookingResponse, DashboardMetricsResponse

router = APIRouter(tags=["Dashboard"])


async def provider_bookings(provider_id: str, day: date, db: AsyncSession):
    result = await db.execute(select(Booking).options(joinedload(Booking.slot).joinedload(Slot.provider), joinedload(Booking.user)).join(Slot).where(Slot.provider_id == provider_id, Slot.date == day).order_by(Slot.start_time))
    return result.unique().scalars().all()


@router.get("/dashboard/upcoming", response_model=list[BookingResponse])
async def upcoming(providerId: str, date: date, db: AsyncSession = Depends(get_db)):
    return [booking_dto(booking) for booking in await provider_bookings(providerId, date, db)]


@router.get("/dashboard/metrics", response_model=DashboardMetricsResponse)
async def metrics(providerId: str, date: date, db: AsyncSession = Depends(get_db)):
    bookings = await provider_bookings(providerId, date, db)
    slots = (await db.execute(select(Slot).where(Slot.provider_id == providerId, Slot.date == date))).scalars().all()
    total = len(slots) or 1
    return DashboardMetricsResponse(totalBookings=len(bookings), waitingCount=sum(b.status in ("waiting", "confirmed") for b in bookings), completedCount=sum(b.status == "completed" for b in bookings), bookedSlotsCount=sum(s.is_booked for s in slots), totalSlotsCount=len(slots), capacityPercent=round(sum(s.is_booked for s in slots) / total * 100))


@router.get("/provider/{provider_id}/dashboard", response_model=list[BookingResponse])
async def get_dashboard(provider_id: str, date: date, db: AsyncSession = Depends(get_db)):
    return [booking_dto(booking) for booking in await provider_bookings(provider_id, date, db)]
