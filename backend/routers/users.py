from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from database import get_db
from models import Booking, Slot
from routers.bookings import booking_dto
from schemas import BookingResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}/bookings", response_model=list[BookingResponse])
async def get_user_bookings(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Booking).options(joinedload(Booking.slot).joinedload(Slot.provider), joinedload(Booking.user)).where(Booking.user_id == user_id).order_by(Booking.created_at.desc()))
    return [booking_dto(booking) for booking in result.unique().scalars().all()]
