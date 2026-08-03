import enum
from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class BookingStatusEnum(str, enum.Enum):
    waiting = "waiting"
    in_progress = "in-progress"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no-show"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    bookings = relationship("Booking", back_populates="user")


class Provider(Base):
    # Provider IDs are public frontend slugs (for example, "citycare").
    __tablename__ = "providers"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    address = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    wait_minutes = Column(Integer, nullable=False)
    working_hours_start = Column(Time, nullable=False)
    working_hours_end = Column(Time, nullable=False)
    slot_duration_minutes = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    slots = relationship("Slot", back_populates="provider", cascade="all, delete-orphan")


class Slot(Base):
    __tablename__ = "slots"
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(String, ForeignKey("providers.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_booked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    provider = relationship("Provider", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")

    @property
    def booking(self):
        # Helper property to get the active non-cancelled booking if any
        for b in self.bookings:
            if b.status != BookingStatusEnum.cancelled.value:
                return b
        return self.bookings[0] if self.bookings else None


class Booking(Base):
    __tablename__ = "bookings"
    # This is deliberately the random-style string ID used by BookingContext.
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("slots.id"), nullable=False)
    token = Column(String, nullable=False, unique=True)
    status = Column(String, default=BookingStatusEnum.waiting.value, nullable=False)
    reason = Column(String)
    desk = Column(String)
    notes = Column(String)
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="bookings")
    slot = relationship("Slot", back_populates="bookings")

