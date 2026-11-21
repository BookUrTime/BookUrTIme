import datetime as dt
from typing import Literal, Optional
from pydantic import BaseModel, Field


class ServiceResponse(BaseModel):
    id: int
    providerId: str
    name: str
    durationMinutes: int
    price: float
    description: Optional[str] = None
    isActive: bool


class ServiceCreate(BaseModel):
    name: str = Field(..., max_length=150)
    durationMinutes: int = Field(30, ge=5, le=480)
    price: float = Field(0.0, ge=0.0)
    description: Optional[str] = Field(None, max_length=500)


class ProviderResponse(BaseModel):
    id: str
    name: str
    type: str
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    distanceKm: float
    waitMinutes: int
    workingHoursStart: Optional[str] = None
    workingHoursEnd: Optional[str] = None
    slotDurationMinutes: Optional[int] = 30
    activeCounter: Optional[str] = "Counter 1"
    slots: list[str] = []
    bookedSlots: list[str] = []
    services: list[ServiceResponse] = []


class ProviderProfileUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    waitMinutes: Optional[int] = None
    activeCounter: Optional[str] = None
    workingHoursStart: Optional[str] = None
    workingHoursEnd: Optional[str] = None
    slotDurationMinutes: Optional[int] = None


class ScheduleGenerateRequest(BaseModel):
    date: dt.date
    startHour: int = Field(9, ge=0, le=23)
    endHour: int = Field(17, ge=1, le=24)
    intervalMinutes: int = Field(30, ge=5, le=120)


class BookingCreate(BaseModel):
    providerId: str = Field(..., max_length=100)
    slot: str = Field(..., max_length=50)
    date: Optional[dt.date] = None
    serviceId: Optional[int] = None
    serviceName: Optional[str] = None
    name: str = Field("Guest User", max_length=100)
    phone: str = Field("", max_length=30)
    reason: Optional[str] = Field(None, max_length=500)
    desk: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
    createdBy: Optional[str] = Field(None, max_length=100)


class BookingResponse(BaseModel):
    id: str
    providerId: str
    providerName: str
    providerType: str
    serviceId: Optional[int] = None
    serviceName: Optional[str] = None
    slot: str
    token: str
    name: str
    phone: Optional[str] = None
    desk: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    createdBy: Optional[str] = None
    date: str
    queuePosition: Optional[int] = None
    currentlyServingToken: Optional[str] = None


class SlotResponse(BaseModel):
    id: int
    providerId: str
    serviceId: Optional[int] = None
    date: dt.date
    startTime: str
    endTime: str
    isBooked: bool
    isBlocked: bool = False


class BookingStatusUpdate(BaseModel):
    status: Literal["waiting", "in-progress", "completed", "cancelled", "no-show"]
    desk: Optional[str] = None


class DashboardMetricsResponse(BaseModel):
    totalBookings: int
    waitingCount: int
    inProgressCount: int
    completedCount: int
    bookedSlotsCount: int
    totalSlotsCount: int
    capacityPercent: int


class QueueLiveStateResponse(BaseModel):
    providerId: str
    providerName: str
    activeCounter: str
    currentlyServing: Optional[BookingResponse] = None
    waitingCount: int
    waitingList: list[BookingResponse] = []
    completedCount: int
