"use client";

import { createContext, useContext, useState, useRef } from "react";
import { providers } from "../lib/dummyData";

const BookingContext = createContext(null);

/**
 * Compute initial hydrated state from localStorage in a single pass.
 * Replaces two useEffect blocks that caused cascading re-renders.
 */
function computeInitialState() {
  if (typeof window === "undefined") {
    return { bookings: [], activeBookingId: "", provider: null, slot: "", token: "", name: "", serviceType: "" };
  }

  let bookings = [];
  const storedBookings = localStorage.getItem("bookurtime_bookings");
  if (storedBookings) {
    try {
      bookings = JSON.parse(storedBookings);
    } catch (e) {
      console.error("Failed to parse bookings from localStorage", e);
    }
  }

  const activeBookingId = localStorage.getItem("bookurtime_active_booking_id") || "";

  let provider = null, slot = "", token = "", name = "", serviceType = "";

  if (activeBookingId && bookings.length > 0) {
    const active = bookings.find((b) => b.id === activeBookingId);
    if (active) {
      const foundProvider = providers.find((p) => p.id === active.providerId);
      if (foundProvider) {
        provider = foundProvider;
        slot = active.slot;
        token = active.token;
        name = active.name;
        serviceType = active.providerType;
      }
    }
  }

  return { bookings, activeBookingId, provider, slot, token, name, serviceType };
}

export function BookingProvider({ children }) {
  // Compute initial hydrated state once via ref (runs only on first render)
  const initialRef = useRef(undefined);
  if (initialRef.current === undefined) {
    initialRef.current = computeInitialState();
  }
  const initial = initialRef.current;

  const [language, setLanguage] = useState("");
  const [serviceType, setServiceType] = useState(initial.serviceType);
  const [provider, setProvider] = useState(initial.provider);
  const [slot, setSlot] = useState(initial.slot);
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState(initial.token);

  const [bookings, setBookings] = useState(initial.bookings);
  const [activeBookingId, setActiveBookingId] = useState(initial.activeBookingId);

  const saveBookings = (newBookings) => {
    setBookings(newBookings);
    localStorage.setItem("bookurtime_bookings", JSON.stringify(newBookings));
  };

  const saveActiveBookingId = (id) => {
    setActiveBookingId(id);
    if (id) {
      localStorage.setItem("bookurtime_active_booking_id", id);
    } else {
      localStorage.removeItem("bookurtime_active_booking_id");
    }
  };

  // Handler to book an appointment
  const bookAppointment = (prov, slotTime, userName = "Guest User") => {
    const serviceTypeMap = {
      hospital: "HC",
      aadhaar: "AK",
      bank: "SB",
    };
    const type = prov.type || serviceType || "hospital";
    const prefix = serviceTypeMap[type] || "HC";
    const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
    const generatedToken = `${prefix}-${randomDigits}`;

    const newBooking = {
      id: Math.random().toString(36).substr(2, 9),
      providerId: prov.id,
      providerName: prov.name,
      providerType: prov.type,
      slot: slotTime,
      token: generatedToken,
      name: userName || "Guest User",
      date: new Date().toISOString(),
    };

    const updatedBookings = [newBooking, ...bookings];
    saveBookings(updatedBookings);
    saveActiveBookingId(newBooking.id);

    // Set active values in context
    setProvider(prov);
    setSlot(slotTime);
    setToken(generatedToken);
    setName(userName || "Guest User");
    setServiceType(prov.type);

    return newBooking;
  };

  // Handler to cancel an appointment
  const cancelAppointment = (bookingId) => {
    const updatedBookings = bookings.filter((b) => b.id !== bookingId);
    saveBookings(updatedBookings);

    if (activeBookingId === bookingId) {
      saveActiveBookingId("");
      setProvider(null);
      setSlot("");
      setToken("");
      setName("");
    }
  };

  // Helper to fetch merged (static + user-made) booked slots for a provider
  const getBookedSlots = (prov) => {
    if (!prov) return [];
    const staticBooked = prov.bookedSlots || [];
    const dynamicBooked = bookings
      .filter((b) => b.providerId === prov.id)
      .map((b) => b.slot);
    return [...new Set([...staticBooked, ...dynamicBooked])];
  };

  // Helper to set an existing booking as the active one (for viewing tickets)
  const viewBookingDetails = (bookingId) => {
    const active = bookings.find((b) => b.id === bookingId);
    if (active) {
      saveActiveBookingId(bookingId);
      const foundProvider = providers.find((p) => p.id === active.providerId);
      if (foundProvider) {
        setProvider(foundProvider);
        setSlot(active.slot);
        setToken(active.token);
        setName(active.name);
        setServiceType(active.providerType);
      }
    }
  };

  return (
    <BookingContext.Provider
      value={{
        language,
        setLanguage,
        serviceType,
        setServiceType,
        provider,
        setProvider,
        slot,
        setSlot,
        name,
        setName,
        phone,
        setPhone,
        token,
        setToken,
        bookings,
        activeBookingId,
        setActiveBookingId: saveActiveBookingId,
        bookAppointment,
        cancelAppointment,
        getBookedSlots,
        viewBookingDetails,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const booking = useContext(BookingContext);
  if (!booking) throw new Error("useBooking must be used inside BookingProvider");
  return booking;
}
