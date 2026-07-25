from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List
from datetime import date
from database import get_db
import models, schemas

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/{user_id}/bookings", response_model=List[schemas.BookingResponse])
async def get_user_bookings(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Booking)
        .options(joinedload(models.Booking.slot))
        .join(models.Slot)
        .where(
            models.Booking.user_id == user_id,
            models.Booking.status == models.BookingStatusEnum.confirmed,
            models.Slot.date >= date.today()
        )
        .order_by(models.Slot.date, models.Slot.start_time)
    )
    return result.scalars().all()
