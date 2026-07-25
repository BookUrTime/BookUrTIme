from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import date
import schemas, models
from database import get_db

from services.slot_engine import generate_slots
from services.notifications import send_booking_confirmation

router = APIRouter(tags=["Bookings"])

@router.get("/providers/{provider_id}/slots", response_model=List[schemas.SlotResponse])
async def get_slots(provider_id: int, date: date, db: AsyncSession = Depends(get_db)):
    # Auto-generate slots if none exist
    await generate_slots(provider_id, date, db)
    
    # Return available slots
    result = await db.execute(
        select(models.Slot).where(
            models.Slot.provider_id == provider_id,
            models.Slot.date == date,
            models.Slot.is_booked == False
        )
    )
    return result.scalars().all()

@router.post("/bookings", response_model=schemas.BookingResponse)
async def create_booking(booking: schemas.BookingCreate, db: AsyncSession = Depends(get_db)):
    # Check if slot is available
    result = await db.execute(select(models.Slot).where(models.Slot.id == booking.slot_id))
    slot = result.scalar_one_or_none()
    
    if not slot or slot.is_booked:
        raise HTTPException(status_code=400, detail="Slot is not available")
        
    # Create booking
    new_booking = models.Booking(
        user_id=booking.user_id,
        slot_id=booking.slot_id,
        reason=booking.reason,
        status=models.BookingStatusEnum.confirmed
    )
    db.add(new_booking)
    
    # Update slot
    slot.is_booked = True
    
    try:
        await db.commit()
        await db.refresh(new_booking)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error creating booking (possibly double booking)")
        
    # Send confirmation
    user_result = await db.execute(select(models.User).where(models.User.id == booking.user_id))
    user = user_result.scalar_one_or_none()
    
    provider_result = await db.execute(select(models.Provider).where(models.Provider.id == slot.provider_id))
    provider = provider_result.scalar_one_or_none()
    
    if user and provider:
        send_booking_confirmation(user, provider, slot)
        
    return new_booking

@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(booking_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Booking).where(models.Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    booking.status = models.BookingStatusEnum.cancelled
    
    slot_result = await db.execute(select(models.Slot).where(models.Slot.id == booking.slot_id))
    slot = slot_result.scalar_one_or_none()
    if slot:
        slot.is_booked = False
        
    await db.commit()
    return None

@router.patch("/bookings/{booking_id}/no-show", response_model=schemas.BookingResponse)
async def mark_no_show(booking_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Booking).where(models.Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    booking.status = models.BookingStatusEnum.no_show
    await db.commit()
    await db.refresh(booking)
    return booking
