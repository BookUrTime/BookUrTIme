"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { providers } from "../lib/dummyData";
import {
  cancelBooking,
  createBooking,
  fetchProviders,
  fetchSlots,
  isNetworkError,
  updateBookingStatusApi,
  createBusinessServiceApi,
  deleteBusinessServiceApi,
  generateBusinessScheduleApi,
  toggleSlotBlockedApi,
  callNextTokenApi,
  updateBusinessProfileApi,
} from "../lib/api";

const BookingContext = createContext(null);
const useBackend = process.env.NEXT_PUBLIC_USE_BACKEND !== "false";

const today = () => new Date().toISOString().slice(0, 10);

const to24Hour = (time) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time || "");
  if (!match) return time;
  let hour = Number(match[1]);
  if (match[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (match[3].toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
};

export function BookingProvider({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);

  // User / Citizen states
  const [language, setLanguageState] = useState("");
  const [serviceType, setServiceTypeState] = useState("");
  const [provider, setProvider] = useState(null);
  const [selectedService, setSelectedServiceState] = useState(null);
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [bookings, setBookings] = useState([]);
  const [activeBookingId, setActiveBookingIdState] = useState("");
  const [providerList, setProviderListState] = useState(providers);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Role & Mode State (B2B Business vs Consumer User)
  const [userRole, setUserRoleState] = useState("guest"); // 'guest' | 'business'
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
    if (newRole === "provider" || newRole === "business") {
      setIsProviderAccount(true);
      if (router) router.push("/business");
    } else {
      if (router) router.push("/");
    }
  };

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

  const setSelectedService = (svc) => {
    setSelectedServiceState(svc);
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

  const saveProviderList = (newList) => {
    setProviderListState(newList);
    if (typeof window !== "undefined") {
      localStorage.setItem("bookurtime_provider_list", JSON.stringify(newList));
    }
  };

  // Hydrate from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedLang = localStorage.getItem("bookurtime_language");
        if (storedLang) setLanguageState(storedLang);

        const storedServiceType = localStorage.getItem("bookurtime_service_type");
        if (storedServiceType) setServiceTypeState(storedServiceType);

        const storedRole = localStorage.getItem("bookurtime_user_role");
        if (storedRole) setUserRoleState(storedRole);

        const storedIsProvider = localStorage.getItem("bookurtime_is_provider_account");
        if (storedIsProvider === "true") setIsProviderAccountState(true);

        const storedBookings = localStorage.getItem("bookurtime_bookings");
        let parsedBookings = [];
        if (storedBookings) {
          try {
            parsedBookings = JSON.parse(storedBookings);
            setBookings(parsedBookings);
          } catch (e) {
            console.error("Failed to parse bookings", e);
          }
        }

        let parsedProviders = [];
        const storedProviders = localStorage.getItem("bookurtime_provider_list");
        if (storedProviders) {
          try {
            parsedProviders = JSON.parse(storedProviders);
            setProviderListState(parsedProviders);
          } catch (e) {
            console.error("Failed to parse provider list", e);
          }
        }

        const storedActiveId = localStorage.getItem("bookurtime_active_booking_id") || "";
        if (storedActiveId) {
          setActiveBookingIdState(storedActiveId);
          if (parsedBookings.length > 0) {
            const active = parsedBookings.find((b) => b.id === storedActiveId);
            if (active) {
              const foundProvider =
                parsedProviders.find((p) => p.id === active.providerId) ||
                providers.find((p) => p.id === active.providerId);
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

  const loadProviders = useCallback(async (type = serviceType) => {
    if (!useBackend) return providerList;
    setProvidersLoading(true);
    try {
      const remoteProviders = await fetchProviders(type);
      saveProviderList(remoteProviders);
      return remoteProviders;
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      return providerList.length > 0 ? providerList : providers;
    } finally {
      setProvidersLoading(false);
    }
  }, [providerList, serviceType]);

  const loadSlots = useCallback(async (providerId) => {
    if (!providerId || !useBackend) return null;
    setSlotsLoading(true);
    try {
      const remoteSlots = await fetchSlots(providerId, today());
      const slotTimes = remoteSlots.map((item) => to24Hour(item.startTime));
      const bookedSlots = remoteSlots.filter((item) => item.isBooked).map((item) => to24Hour(item.startTime));
      const update = (item) => (item.id === providerId ? { ...item, slots: slotTimes, bookedSlots } : item);
      const updatedList = providerList.map(update);
      saveProviderList(updatedList);
      const updatedProvider = updatedList.find((item) => item.id === providerId);
      if (updatedProvider && provider?.id === providerId) setProvider(updatedProvider);
      return updatedProvider;
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      return null;
    } finally {
      setSlotsLoading(false);
    }
  }, [provider?.id, providerList]);

  useEffect(() => {
    if (isHydrated && serviceType) {
      const timer = setTimeout(() => loadProviders(serviceType).catch(() => {}), 0);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, serviceType, loadProviders]);

  useEffect(() => {
    if (isHydrated && provider?.id) {
      const timer = setTimeout(() => loadSlots(provider.id).catch(() => {}), 0);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, provider?.id, loadSlots]);

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
  const bookAppointment = async (
    prov,
    slotTime,
    userName = "Guest User",
    userPhone = "",
    serviceId = null,
    serviceName = ""
  ) => {
    const serviceTypeMap = {
      hospital: "HC",
      aadhaar: "AK",
      bank: "SB",
    };
    const type = prov.type || serviceType || "hospital";
    const prefix = serviceTypeMap[type] || "HC";
    const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
    const generatedToken = `${prefix}-${randomDigits}`;

    let newBooking = {
      id: Math.random().toString(36).substr(2, 9),
      providerId: prov.id,
      providerName: prov.name,
      providerType: prov.type,
      serviceId,
      serviceName: serviceName || (selectedService ? selectedService.name : ""),
      slot: slotTime,
      token: generatedToken,
      name: userName || "Guest User",
      phone: userPhone,
      desk: prov.activeCounter || "Counter 1",
      date: new Date().toISOString(),
      status: "waiting",
      queuePosition: 1,
      currentlyServingToken: `${prefix}-1001`,
    };

    if (useBackend) {
      try {
        const created = await createBooking({
          providerId: prov.id,
          slot: slotTime,
          date: today(),
          serviceId,
          serviceName: serviceName || (selectedService ? selectedService.name : undefined),
          name: userName || "Guest User",
          phone: userPhone,
          desk: prov.activeCounter || "Counter 1",
        });
        newBooking = created;
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }

    const updatedBookings = [newBooking, ...bookings.filter((b) => b.id !== newBooking.id)];
    saveBookings(updatedBookings);
    saveActiveBookingId(newBooking.id);

    // Set active values in context
    setProvider(prov);
    setSlot(slotTime);
    setToken(newBooking.token);
    setName(userName || "Guest User");
    setServiceType(prov.type);

    return newBooking;
  };

  const cancelAppointment = async (id) => {
    const targetBooking = bookings.find((b) => b.id === id);
    if (!targetBooking) return;

    if (useBackend) {
      try {
        await cancelBooking(id);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }

    const updatedBookings = bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b));
    saveBookings(updatedBookings);

    // Free up slot locally
    if (targetBooking.providerId && targetBooking.slot) {
      const slot24 = to24Hour(targetBooking.slot);
      const updatedList = providerList.map((p) => {
        if (p.id === targetBooking.providerId) {
          return { ...p, bookedSlots: (p.bookedSlots || []).filter((s) => s !== slot24) };
        }
        return p;
      });
      saveProviderList(updatedList);
    }
  };

  const getBookedSlots = (providerId) => {
    const prov = providerList.find((p) => p.id === providerId);
    return prov ? prov.bookedSlots || [] : [];
  };

  const viewBookingDetails = (id) => {
    const b = bookings.find((item) => item.id === id);
    if (b) {
      const prov = providerList.find((p) => p.id === b.providerId) || providers.find((p) => p.id === b.providerId);
      if (prov) setProvider(prov);
      setSlot(b.slot);
      setToken(b.token);
      setName(b.name);
      setServiceType(b.providerType);
      saveActiveBookingId(id);
    }
  };

  // --- B2B Business Device Actions ---

  const updateBookingStatus = async (bookingId, newStatus, desk) => {
    if (useBackend) {
      try {
        await updateBookingStatusApi(bookingId, newStatus, desk);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }

    const updatedBookings = bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus, desk: desk || b.desk } : b));
    saveBookings(updatedBookings);
  };

  const callNextToken = async (providerId, date = today(), desk = "Counter 1") => {
    if (useBackend) {
      try {
        return await callNextTokenApi(providerId, date, desk);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }

    // Local fallback
    const provBookings = bookings.filter((b) => b.providerId === providerId);
    const waiting = provBookings.find((b) => b.status === "waiting" || b.status === "confirmed");
    if (waiting) {
      const updated = bookings.map((b) => {
        if (b.providerId === providerId && b.status === "in-progress") return { ...b, status: "completed" };
        if (b.id === waiting.id) return { ...b, status: "in-progress", desk };
        return b;
      });
      saveBookings(updated);
    }
    return null;
  };

  const addBusinessService = async (providerId, serviceData) => {
    if (useBackend) {
      try {
        const created = await createBusinessServiceApi(providerId, serviceData);
        const updatedList = providerList.map((p) => {
          if (p.id === providerId) {
            return { ...p, services: [...(p.services || []), created] };
          }
          return p;
        });
        saveProviderList(updatedList);
        return created;
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }

    // Local fallback
    const newSvc = { id: Date.now(), providerId, ...serviceData, isActive: true };
    const updatedList = providerList.map((p) => {
      if (p.id === providerId) {
        return { ...p, services: [...(p.services || []), newSvc] };
      }
      return p;
    });
    saveProviderList(updatedList);
    return newSvc;
  };

  const removeBusinessService = async (providerId, serviceId) => {
    if (useBackend) {
      try {
        await deleteBusinessServiceApi(providerId, serviceId);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }

    const updatedList = providerList.map((p) => {
      if (p.id === providerId) {
        return { ...p, services: (p.services || []).filter((s) => s.id !== serviceId) };
      }
      return p;
    });
    saveProviderList(updatedList);
  };

  const regenerateBusinessSchedule = async (providerId, config) => {
    if (useBackend) {
      try {
        const slots = await generateBusinessScheduleApi(providerId, config);
        const slotTimes = slots.map((s) => s.startTime);
        const updatedList = providerList.map((p) => (p.id === providerId ? { ...p, slots: slotTimes } : p));
        saveProviderList(updatedList);
        return slots;
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }

    // Local fallback
    const generated = [];
    for (let h = config.startHour || 9; h < (config.endHour || 17); h++) {
      for (let m = 0; m < 60; m += config.intervalMinutes || 30) {
        generated.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    const updatedList = providerList.map((p) => (p.id === providerId ? { ...p, slots: generated } : p));
    saveProviderList(updatedList);
    return generated;
  };

  const toggleSlotBlocked = async (providerId, slotId, slotTime) => {
    if (useBackend && slotId) {
      try {
        return await toggleSlotBlockedApi(providerId, slotId);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }

    const updatedList = providerList.map((p) => {
      if (p.id === providerId) {
        const currentlyBooked = p.bookedSlots || [];
        const isBlocked = currentlyBooked.includes(slotTime);
        const updated = isBlocked ? currentlyBooked.filter((s) => s !== slotTime) : [...currentlyBooked, slotTime];
        return { ...p, bookedSlots: updated };
      }
      return p;
    });
    saveProviderList(updatedList);
  };

  const updateBusinessProfile = async (providerId, profileData) => {
    if (useBackend) {
      try {
        const updated = await updateBusinessProfileApi(providerId, profileData);
        const updatedList = providerList.map((p) => (p.id === providerId ? { ...p, ...updated } : p));
        saveProviderList(updatedList);
        return updated;
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }

    const updatedList = providerList.map((p) => (p.id === providerId ? { ...p, ...profileData } : p));
    saveProviderList(updatedList);
  };

  // Direct Walk-in registration from counter device
  const providerCreateAppointment = async (
    providerId,
    { slotTime, guestName, guestPhone, serviceName = "", desk = "Counter 1", notes = "" }
  ) => {
    const targetProvider = providerList.find((p) => p.id === providerId) || providers.find((p) => p.id === providerId);
    if (!targetProvider) return null;

    const serviceTypeMap = { hospital: "HC", aadhaar: "AK", bank: "SB" };
    const prefix = serviceTypeMap[targetProvider.type] || "HC";
    const generatedToken = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    let newBooking = {
      id: Math.random().toString(36).substr(2, 9),
      providerId: targetProvider.id,
      providerName: targetProvider.name,
      providerType: targetProvider.type,
      serviceName: serviceName || "General Counter Service",
      slot: slotTime,
      token: generatedToken,
      name: guestName || "Walk-in Guest",
      phone: guestPhone || "",
      desk,
      notes,
      status: "waiting",
      createdBy: "Walk-in Desk",
      date: new Date().toISOString(),
    };

    if (useBackend) {
      try {
        newBooking = await createBooking({
          providerId: targetProvider.id,
          slot: slotTime,
          date: today(),
          serviceName,
          name: guestName || "Walk-in Guest",
          phone: guestPhone,
          desk,
          notes,
          createdBy: "Walk-in Desk",
        });
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }

    const updatedBookings = [newBooking, ...bookings];
    saveBookings(updatedBookings);
    return newBooking;
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
        selectedService,
        setSelectedService,
        slot,
        setSlot,
        name,
        setName,
        phone,
        setPhone,
        token,
        setToken,
        bookings,
        providerList,
        providersLoading,
        slotsLoading,
        activeBookingId,
        setActiveBookingId: saveActiveBookingId,
        userRole,
        isProviderAccount,
        switchRole,
        bookAppointment,
        cancelAppointment,
        loadProviders,
        loadSlots,
        getBookedSlots,
        viewBookingDetails,
        updateBookingStatus,
        callNextToken,
        addBusinessService,
        removeBusinessService,
        regenerateBusinessSchedule,
        toggleSlotBlocked,
        updateBusinessProfile,
        providerCreateAppointment,
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
