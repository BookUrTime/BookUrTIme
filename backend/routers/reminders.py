import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from database import get_db
import models
from services.notifications import send_reminder

logger = logging.getLogger("bookurtime.reminders")
router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.post("/send")
async def send_reminders(db: AsyncSession = Depends(get_db)):
    now = datetime.now()
    # Find all active waiting/in-progress bookings
    result = await db.execute(
        select(models.Booking, models.User, models.Slot, models.Provider)
        .join(models.User, models.Booking.user_id == models.User.id)
        .join(models.Slot, models.Booking.slot_id == models.Slot.id)
        .join(models.Provider, models.Slot.provider_id == models.Provider.id)
        .where(models.Booking.status.in_([models.BookingStatusEnum.waiting.value, models.BookingStatusEnum.in_progress.value]))
    )
    
    rows = result.all()
    reminders_sent = 0
    
    for booking, user, slot, provider in rows:
        slot_datetime = datetime.combine(slot.date, slot.start_time)
        time_diff = slot_datetime - now
        
        hours_until = time_diff.total_seconds() / 3600
        margin = 0.5
        
        try:
            if (24 - margin) <= hours_until <= (24 + margin):
                send_reminder(user, provider, slot, 24)
                reminders_sent += 1
            elif (2 - margin) <= hours_until <= (2 + margin):
                send_reminder(user, provider, slot, 2)
                reminders_sent += 1
        except Exception as e:
            logger.error("Failed to send reminder for booking %s: %s", booking.id, str(e), exc_info=True)
            
    return {"message": f"Sent {reminders_sent} reminders"}

