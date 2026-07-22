from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from database import get_db
import models
from services.notifications import send_reminder

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.post("/send")
async def send_reminders(db: AsyncSession = Depends(get_db)):
    now = datetime.now()
    # Find all confirmed bookings
    result = await db.execute(
        select(models.Booking, models.User, models.Slot, models.Provider)
        .join(models.User, models.Booking.user_id == models.User.id)
        .join(models.Slot, models.Booking.slot_id == models.Slot.id)
        .join(models.Provider, models.Slot.provider_id == models.Provider.id)
        .where(models.Booking.status == models.BookingStatusEnum.confirmed)
    )
    
    rows = result.all()
    reminders_sent = 0
    
    for booking, user, slot, provider in rows:
        slot_datetime = datetime.combine(slot.date, slot.start_time)
        time_diff = slot_datetime - now
        
        hours_until = time_diff.total_seconds() / 3600
        
        # Check if approx 24h or 2h away
        # Using a 30-minute window (0.5 hours) on either side
        margin = 0.5
        
        if (24 - margin) <= hours_until <= (24 + margin):
            send_reminder(user, provider, slot, 24)
            reminders_sent += 1
        elif (2 - margin) <= hours_until <= (2 + margin):
            send_reminder(user, provider, slot, 2)
            reminders_sent += 1
            
    return {"message": f"Sent {reminders_sent} reminders"}
