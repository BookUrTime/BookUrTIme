"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { providers } from "../lib/dummyData";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Safe defaults for both SSR and initial client render
  const [language, setLanguageState] = useState("");
  const [serviceType, setServiceTypeState] = useState("");
  const [provider, setProvider] = useState(null);
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [bookings, setBookings] = useState([]);
  const [activeBookingId, setActiveBookingIdState] = useState("");
  const [providerList, setProviderListState] = useState(providers);

  // Role & Mode State (Airbnb-style Universal App Mode Switching)
  const [userRole, setUserRoleState] = useState("patient"); // 'patient' | 'provider'
  const [isProviderAccount, setIsProviderAccountState] = useState(false);

  const setRole = (role) => {
    setUserRoleState(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("bookurtime_user_role", role);
    }
  };

  const setIsProviderAccount = (status) => {
    setIsProviderAccountState(status);
    if (typeof window !== "undefined") {
      localStorage.setItem("bookurtime_is_provider_account", status ? "true" : "false");
    }
  };

  const switchRole = (newRole, router) => {
    setRole(newRole);
    if (newRole === "provider") {
      setIsProviderAccount(true);
      if (router) router.push("/provider/dashboard");
    } else {
      if (router) router.push("/service");
    }
  };

  // Setter with localStorage sync
  const setLanguage = (lang) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      if (lang) {
        localStorage.setItem("bookurtime_language", lang);
      } else {
        localStorage.removeItem("bookurtime_language");
      }
    }
  };

  // Setter with localStorage sync
  const setServiceType = (type) => {
    setServiceTypeState(type);
    if (typeof window !== "undefined") {
      if (type) {
        localStorage.setItem("bookurtime_service_type", type);
      } else {
        localStorage.removeItem("bookurtime_service_type");
      }
    }
  };

  const saveBookings = (newBookings) => {
    setBookings(newBookings);
    if (typeof window !== "undefined") {
      localStorage.setItem("bookurtime_bookings", JSON.stringify(newBookings));
    }
  };

  const saveActiveBookingId = (id) => {
    setActiveBookingIdState(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("bookurtime_active_booking_id", id);
      } else {
        localStorage.removeItem("bookurtime_active_booking_id");
      }
    }
  };

  // Hydrate from localStorage AFTER initial mount (asynchronous to avoid set-state-in-effect rule)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedLang = localStorage.getItem("bookurtime_language");
        if (storedLang) {
          setLanguageState(storedLang);
        }

        const storedServiceType = localStorage.getItem("bookurtime_service_type");
        if (storedServiceType) {
          setServiceTypeState(storedServiceType);
        }

        const storedRole = localStorage.getItem("bookurtime_user_role");
        if (storedRole) {
          setUserRoleState(storedRole);
        }

        const storedIsProvider = localStorage.getItem("bookurtime_is_provider_account");
        if (storedIsProvider === "true") {
          setIsProviderAccountState(true);
        }

        const storedBookings = localStorage.getItem("bookurtime_bookings");
        let parsedBookings = [];
        if (storedBookings) {
          try {
            parsedBookings = JSON.parse(storedBookings);
            setBookings(parsedBookings);
          } catch (e) {
            console.error("Failed to parse bookings from localStorage", e);
          }
        }

        const storedProviders = localStorage.getItem("bookurtime_provider_list");
        if (storedProviders) {
          try {
            const parsedProviders = JSON.parse(storedProviders);
            setProviderListState(parsedProviders);
          } catch (e) {
            console.error("Failed to parse provider list from localStorage", e);
          }
        }

        const storedActiveId = localStorage.getItem("bookurtime_active_booking_id") || "";
        if (storedActiveId) {
          setActiveBookingIdState(storedActiveId);
          if (parsedBookings.length > 0) {
            const active = parsedBookings.find((b) => b.id === storedActiveId);
            if (active) {
              const foundProvider = providers.find((p) => p.id === active.providerId);
              if (foundProvider) {
                setProvider(foundProvider);
                setSlot(active.slot);
                setToken(active.token);
                setName(active.name);
                setServiceTypeState(active.providerType);
              }
            }
          }
        }
      } catch (e) {
        console.error("Hydration error:", e);
      } finally {
        setIsHydrated(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Sync HTML dir attribute for RTL support (Urdu)
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (language === "ur") {
        document.documentElement.dir = "rtl";
        document.documentElement.lang = "ur";
      } else {
        document.documentElement.dir = "ltr";
        document.documentElement.lang = language || "en";
      }
    }
  }, [language]);

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

  // Provider state management
  const saveProviderList = (newList) => {
    setProviderListState(newList);
    if (typeof window !== "undefined") {
      localStorage.setItem("bookurtime_provider_list", JSON.stringify(newList));
    }
  };

  const updateBookingStatus = (bookingId, newStatus) => {
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: newStatus } : b
    );
    saveBookings(updatedBookings);
  };

  const updateProviderWaitTime = (providerId, newMinutes) => {
    const updatedList = providerList.map((p) =>
      p.id === providerId ? { ...p, waitMinutes: Math.max(0, newMinutes) } : p
    );
    saveProviderList(updatedList);
  };

  const addProviderSlot = (providerId, newSlot) => {
    const updatedList = providerList.map((p) => {
      if (p.id === providerId) {
        if (!p.slots.includes(newSlot)) {
          return { ...p, slots: [...p.slots, newSlot].sort() };
        }
      }
      return p;
    });
    saveProviderList(updatedList);
  };

  const toggleProviderSlot = (providerId, slotTime) => {
    const updatedList = providerList.map((p) => {
      if (p.id === providerId) {
        const currentlyBooked = p.bookedSlots || [];
        const isBooked = currentlyBooked.includes(slotTime);
        const updatedBooked = isBooked
          ? currentlyBooked.filter((s) => s !== slotTime)
          : [...currentlyBooked, slotTime];
        return { ...p, bookedSlots: updatedBooked };
      }
      return p;
    });
    saveProviderList(updatedList);
  };

  const updateProviderProfile = (providerId, updatedData) => {
    const updatedList = providerList.map((p) =>
      p.id === providerId ? { ...p, ...updatedData } : p
    );
    saveProviderList(updatedList);
  };

  // Handler for provider to directly appoint a slot for a patient (walk-in / phone booking)
  const providerCreateAppointment = (providerId, { slotTime, patientName, patientPhone, desk = "Counter 1", notes = "" }) => {
    const targetProvider = providerList.find((p) => p.id === providerId) || providers.find((p) => p.id === providerId);
    if (!targetProvider) return null;

    const serviceTypeMap = {
      hospital: "HC",
      aadhaar: "AK",
      bank: "SB",
    };
    const type = targetProvider.type || "hospital";
    const prefix = serviceTypeMap[type] || "HC";
    const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
    const generatedToken = `${prefix}-${randomDigits}`;

    const newBooking = {
      id: Math.random().toString(36).substr(2, 9),
      providerId: targetProvider.id,
      providerName: targetProvider.name,
      providerType: targetProvider.type,
      slot: slotTime,
      token: generatedToken,
      name: patientName || "Walk-in Patient",
      phone: patientPhone || "",
      desk: desk,
      notes: notes,
      status: "waiting",
      createdBy: "provider",
      date: new Date().toISOString(),
    };

    const updatedBookings = [newBooking, ...bookings];
    saveBookings(updatedBookings);
    return newBooking;
  };

  // Handler to auto-generate shift slots for a provider (e.g., 09:00 to 17:00 at 30 min intervals)
  const autoGenerateSlots = (providerId, startHour = 9, endHour = 17, intervalMins = 30) => {
    const generated = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += intervalMins) {
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        generated.push(timeStr);
      }
    }

    const updatedList = providerList.map((p) => {
      if (p.id === providerId) {
        const merged = [...new Set([...p.slots, ...generated])].sort();
        return { ...p, slots: merged };
      }
      return p;
    });

    saveProviderList(updatedList);
    return generated;
  };

  return (
    <BookingContext.Provider
      value={{
        isHydrated,
        language,
        setLanguage,
        serviceType,
        setServiceType,
        provider,
        setProvider,
        slot,
        userRole,
        isProviderAccount,
        setRole,
        setIsProviderAccount,
        switchRole,
        setSlot,
        name,
        setName,
        phone,
        setPhone,
        token,
        setToken,
        bookings,
        providerList,
        activeBookingId,
        setActiveBookingId: saveActiveBookingId,
        bookAppointment,
        cancelAppointment,
        getBookedSlots,
        viewBookingDetails,
        updateBookingStatus,
        updateProviderWaitTime,
        addProviderSlot,
        toggleProviderSlot,
        updateProviderProfile,
        providerCreateAppointment,
        autoGenerateSlots,
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
