from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import date
from database import get_db
import models, schemas

router = APIRouter(tags=["Dashboard"])

@router.get("/provider/{provider_id}/dashboard", response_model=List[schemas.DashboardBookingResponse])
async def get_dashboard(provider_id: int, date: date, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Booking, models.User, models.Slot)
        .join(models.User, models.Booking.user_id == models.User.id)
        .join(models.Slot, models.Booking.slot_id == models.Slot.id)
        .where(
            models.Slot.provider_id == provider_id,
            models.Slot.date == date
        )
        .order_by(models.Slot.start_time)
    )
    
    rows = result.all()
    dashboard_data = []
    for booking, user, slot in rows:
        dashboard_data.append(
            schemas.DashboardBookingResponse(
                booking_id=booking.id,
                user_name=user.name,
                user_phone=user.phone,
                slot_start=slot.start_time,
                slot_end=slot.end_time,
                status=booking.status,
                reason=booking.reason
            )
        )
    return dashboard_data
