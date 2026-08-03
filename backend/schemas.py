import datetime as dt
from typing import Literal, Optional
from pydantic import BaseModel, Field


class ProviderResponse(BaseModel):
    id: str
    name: str
    type: Literal["hospital", "aadhaar", "bank"]
    address: str
    distanceKm: float
    waitMinutes: int
    slots: list[str]
    bookedSlots: list[str]


class BookingCreate(BaseModel):
    providerId: str = Field(..., max_length=100)
    slot: str = Field(..., max_length=50)
    date: Optional[dt.date] = None

    name: str = Field("Guest User", max_length=100)
    phone: str = Field("", max_length=30)
    # Optional fields with strict length validation
    reason: Optional[str] = Field(None, max_length=500)
    desk: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
    createdBy: Optional[str] = Field(None, max_length=100)




class BookingResponse(BaseModel):
    id: str
    providerId: str
    providerName: str
    providerType: str
    slot: str
    token: str
    name: str
    phone: Optional[str] = None
    desk: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    createdBy: Optional[str] = None
    date: str


class SlotResponse(BaseModel):
    id: int
    providerId: str
    date: dt.date
    startTime: str
    endTime: str
    isBooked: bool



class BookingStatusUpdate(BaseModel):
    status: Literal["waiting", "in-progress", "completed", "cancelled", "no-show"]


class DashboardMetricsResponse(BaseModel):
    totalBookings: int
    waitingCount: int
    completedCount: int
    bookedSlotsCount: int
    totalSlotsCount: int
    capacityPercent: int
