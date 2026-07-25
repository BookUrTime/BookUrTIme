import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Time, Date, Enum, Float, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class LanguageEnum(str, enum.Enum):
    hindi = "hindi"
    english = "english"

class ProviderTypeEnum(str, enum.Enum):
    hospital = "hospital"
    bank = "bank"
    government = "government"
    local = "local"

class BookingStatusEnum(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    no_show = "no_show"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    language = Column(Enum(LanguageEnum), default=LanguageEnum.english)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    bookings = relationship("Booking", back_populates="user")

class Provider(Base):
    __tablename__ = "providers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(ProviderTypeEnum), nullable=False)
    address = Column(String)
    city = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    working_hours_start = Column(Time, nullable=False)
    working_hours_end = Column(Time, nullable=False)
    slot_duration_minutes = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    slots = relationship("Slot", back_populates="provider")

class Slot(Base):
    __tablename__ = "slots"
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_booked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    provider = relationship("Provider", back_populates="slots")
    booking = relationship("Booking", back_populates="slot", uselist=False)

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("slots.id"), nullable=False, unique=True)
    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.confirmed)
    reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="bookings")
    slot = relationship("Slot", back_populates="booking")
