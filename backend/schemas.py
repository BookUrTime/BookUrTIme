from pydantic import BaseModel
from typing import List, Optional
from datetime import date, time, datetime
from models import LanguageEnum, ProviderTypeEnum, BookingStatusEnum

class UserBase(BaseModel):
    name: str
    phone: str
    language: LanguageEnum = LanguageEnum.english

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class ProviderBase(BaseModel):
    name: str
    type: ProviderTypeEnum
    address: Optional[str] = None
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    working_hours_start: time
    working_hours_end: time
    slot_duration_minutes: int
    is_active: bool = True

class ProviderCreate(ProviderBase):
    pass

class ProviderResponse(ProviderBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class SlotBase(BaseModel):
    provider_id: int
    date: date
    start_time: time
    end_time: time
    is_booked: bool = False

class SlotCreate(SlotBase):
    pass

class SlotResponse(SlotBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class BookingBase(BaseModel):
    user_id: int
    slot_id: int
    reason: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    id: int
    status: BookingStatusEnum
    created_at: datetime
    class Config:
        orm_mode = True

class DashboardBookingResponse(BaseModel):
    booking_id: int
    user_name: str
    user_phone: str
    slot_start: time
    slot_end: time
    status: BookingStatusEnum
    reason: Optional[str]
