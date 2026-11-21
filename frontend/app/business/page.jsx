"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../../context/BookingContext";
import { formatDate } from "../../lib/formatDate";
import { fetchDashboardMetrics, fetchLiveQueueApi } from "../../lib/api";

const today = () => new Date().toISOString().slice(0, 10);

export default function BusinessDevicePage() {
  const router = useRouter();
  const {
    isHydrated,
    bookings,
    providerList,
    switchRole,
    updateBookingStatus,
    providerCreateAppointment,
    callNextToken,
    addBusinessService,
    removeBusinessService,
    regenerateBusinessSchedule,
    toggleSlotBlocked,
    updateBusinessProfile,
  } = useBooking();

  // Active Business & View Tabs
  const [selectedBusinessId, setSelectedBusinessId] = useState("citycare");
  const [activeTab, setActiveTab] = useState("counter"); // 'counter' | 'services' | 'schedule' | 'profile' | 'analytics'
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [callAlertMsg, setCallAlertMsg] = useState("");

  // Counter & Queue Data
  const [liveQueue, setLiveQueue] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // Walk-in modal
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinService, setWalkinService] = useState("");
  const [walkinNotes, setWalkinNotes] = useState("");
  const [walkinSuccessToken, setWalkinSuccessToken] = useState("");

  // Add Service Form
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(20);
  const [newServicePrice, setNewServicePrice] = useState(0);
  const [newServiceDesc, setNewServiceDesc] = useState("");

  // Shift Generator
  const [shiftStartHour, setShiftStartHour] = useState(9);
  const [shiftEndHour, setShiftEndHour] = useState(17);
  const [shiftInterval, setShiftInterval] = useState(30);
  const [shiftSuccessMsg, setShiftSuccessMsg] = useState("");

  // Active business entity
  const activeBusiness =
    providerList.find((p) => p.id === selectedBusinessId) || providerList[0] || {};

  // Profile Editor state
  const [profileName, setProfileName] = useState(activeBusiness.name || "");
  const [profileAddress, setProfileAddress] = useState(activeBusiness.address || "");
  const [profilePhone, setProfilePhone] = useState(activeBusiness.phone || "");
  const [profileCounter, setProfileCounter] = useState(activeBusiness.activeCounter || "Counter 1");
  const [profileWaitTime, setProfileWaitTime] = useState(activeBusiness.waitMinutes || 15);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Synchronize profile state when switching business
  const handleSelectBusiness = (bId) => {
    setSelectedBusinessId(bId);
    const b = providerList.find((p) => p.id === bId);
    if (b) {
      setProfileName(b.name || "");
      setProfileAddress(b.address || "");
      setProfilePhone(b.phone || "");
      setProfileCounter(b.activeCounter || "Counter 1");
      setProfileWaitTime(b.waitMinutes || 15);
    }
  };

  // Poll live queue & metrics
  const refreshQueueData = useCallback(async () => {
    if (!selectedBusinessId) return;
    try {
      const [queueData, metricsData] = await Promise.all([
        fetchLiveQueueApi(selectedBusinessId, today()),
        fetchDashboardMetrics(selectedBusinessId, today()),
      ]);
      setLiveQueue(queueData);
      setMetrics(metricsData);
    } catch {
      // Offline fallback
      setLiveQueue(null);
      setMetrics(null);
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    if (!isHydrated || !selectedBusinessId) return;
    const timer = setTimeout(() => {
      refreshQueueData();
    }, 0);
    const interval = setInterval(refreshQueueData, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isHydrated, selectedBusinessId, refreshQueueData]);

  // Call Next Token Action
  const handleCallNext = async () => {
    setIsCallingNext(true);
    try {
      await callNextToken(selectedBusinessId, today(), profileCounter);
      await refreshQueueData();
      setCallAlertMsg("Token advanced successfully!");
      setTimeout(() => setCallAlertMsg(""), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCallingNext(false);
    }
  };

  // Create Walk-in Guest
  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    if (!walkinName.trim()) return;

    try {
      const result = await providerCreateAppointment(selectedBusinessId, {
        slotTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        guestName: walkinName,
        guestPhone: walkinPhone,
        serviceName: walkinService || "General Counter Service",
        desk: profileCounter,
        notes: walkinNotes,
      });

      setWalkinSuccessToken(result.token || "WK-" + Math.floor(1000 + Math.random() * 9000));
      setWalkinName("");
      setWalkinPhone("");
      setWalkinNotes("");
      await refreshQueueData();
    } catch (e) {
      alert("Failed to issue token: " + e.message);
    }
  };

  // Add Service Handler
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    try {
      await addBusinessService(selectedBusinessId, {
        name: newServiceName,
        durationMinutes: Number(newServiceDuration),
        price: Number(newServicePrice),
        description: newServiceDesc,
      });

      setNewServiceName("");
      setNewServiceDesc("");
      setShowAddServiceModal(false);
    } catch (e) {
      alert("Failed to add service: " + e.message);
    }
  };

  // Regenerate Schedule
  const handleRegenerateSchedule = async () => {
    try {
      await regenerateBusinessSchedule(selectedBusinessId, today(), {
        startHour: Number(shiftStartHour),
        endHour: Number(shiftEndHour),
        intervalMinutes: Number(shiftInterval),
      });
      setShiftSuccessMsg(`Generated slots for ${shiftStartHour}:00 - ${shiftEndHour}:00 (${shiftInterval}m intervals)`);
      setTimeout(() => setShiftSuccessMsg(""), 4000);
    } catch (e) {
      alert("Failed to regenerate schedule: " + e.message);
    }
  };

  // Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateBusinessProfile(selectedBusinessId, {
        name: profileName,
        address: profileAddress,
        phone: profilePhone,
        activeCounter: profileCounter,
        waitMinutes: Number(profileWaitTime),
      });
      setProfileSavedMsg(true);
      setTimeout(() => setProfileSavedMsg(false), 3000);
    } catch (e) {
      alert("Failed to save profile: " + e.message);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl animate-spin text-blue-600">
          progress_activity
        </span>
      </div>
    );
  }

  // Derive active bookings for this business
  const businessBookings = bookings.filter((b) => b.providerId === selectedBusinessId);
  const currentlyServing =
    liveQueue?.currentlyServing ||
    businessBookings.find((b) => b.status === "in-progress");
  const waitingBookings = businessBookings.filter(
    (b) => b.status === "waiting" || b.status === "confirmed"
  );
  const filteredBookings = businessBookings.filter((b) => {
    if (statusFilter === "all") return true;
    return b.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar - Matches User App Design */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 w-full shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand Logo & Station Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-xl leading-none">
                  BookUrTime
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  Business Desk
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold tracking-wide block mt-0.5">
                SMART QUEUE &amp; TERMINAL
              </span>
            </div>
          </div>

          {/* Business Selector Dropdown */}
          <div className="hidden sm:flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-blue-600">storefront</span>
              <span>Facility:</span>
            </label>
            <div className="relative">
              <select
                value={selectedBusinessId}
                onChange={(e) => handleSelectBusiness(e.target.value)}
                className="bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none transition"
              >
                {providerList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Right Actions: Counter pill + Switch to Customer View */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-sm text-emerald-600">desktop_windows</span>
              <span>{profileCounter}</span>
            </div>

            <button
              onClick={() => {
                switchRole("guest");
                router.push("/");
              }}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="Switch to Citizen / Customer Booking Mode"
            >
              <span className="material-symbols-outlined text-base text-blue-400">explore</span>
              <span>Customer App</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Terminal Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-20 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border border-slate-200/90 rounded-3xl p-3 flex flex-row md:flex-col gap-1.5 shrink-0 shadow-xs overflow-x-auto h-fit">
          <button
            onClick={() => setActiveTab("counter")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition cursor-pointer text-left whitespace-nowrap ${
              activeTab === "counter"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="material-symbols-outlined text-lg">queue_play_next</span>
            <span>Live Counter</span>
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition cursor-pointer text-left whitespace-nowrap ${
              activeTab === "services"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="material-symbols-outlined text-lg">design_services</span>
            <span>Services &amp; Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition cursor-pointer text-left whitespace-nowrap ${
              activeTab === "schedule"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            <span>Shift &amp; Slots</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition cursor-pointer text-left whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="material-symbols-outlined text-lg">storefront</span>
            <span>Business Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition cursor-pointer text-left whitespace-nowrap ${
              activeTab === "analytics"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="material-symbols-outlined text-lg">monitoring</span>
            <span>Live Reports</span>
          </button>

          {/* Active Facility Card Footer */}
          <div className="hidden md:block mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{activeBusiness.name}</span>
            </div>
            <p className="truncate text-slate-400 mt-1">{activeBusiness.address}</p>
            <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                ● Live Station
              </span>
              <span className="text-slate-400 font-medium">{formatDate()}</span>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 flex flex-col gap-6">
          {callAlertMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in">
              <span className="flex items-center gap-2 font-bold text-sm">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                {callAlertMsg}
              </span>
            </div>
          )}

          {/* TAB 1: LIVE COUNTER STATION */}
          {activeTab === "counter" && (
            <div className="flex flex-col gap-6">
              {/* Top Hero Station: Now Serving + Big Next Button */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Now Serving Big Card */}
                <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative shadow-xs">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                      <span>Now Serving at {profileCounter}</span>
                    </div>

                    <button
                      onClick={() => setShowWalkinModal(true)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 hover:border-blue-200 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      <span>Issue Walk-in Token</span>
                    </button>
                  </div>

                  {currentlyServing ? (
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-4">
                      <div>
                        <div className="text-6xl sm:text-7xl font-black tracking-tight text-slate-900 font-mono leading-none">
                          {currentlyServing.token}
                        </div>
                        <div className="mt-3 text-xl font-bold text-slate-900">
                          {currentlyServing.name}{" "}
                          <span className="text-slate-400 text-sm font-normal">
                            ({currentlyServing.phone || "Walk-in Guest"})
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-blue-600 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">medical_services</span>
                          <span>{currentlyServing.serviceName || "General Service"}</span>
                          <span>•</span>
                          <span>Slot: {currentlyServing.slot}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateBookingStatus(currentlyServing.id, "completed")}
                          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                          <span>Mark Done</span>
                        </button>
                        <button
                          onClick={() => updateBookingStatus(currentlyServing.id, "no-show")}
                          className="px-4 py-3 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer"
                          title="Mark absent"
                        >
                          <span>Absent / No-Show</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
                      </div>
                      <p className="text-xl font-bold text-slate-800">Station is Idle</p>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-sm">
                        No guest is currently being served at {profileCounter}. Click &quot;Call Next Token&quot; to advance the queue.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Waiting in Line:{" "}
                      <strong className="text-slate-900 font-bold">{waitingBookings.length}</strong> guests
                    </span>
                    <span>
                      Est. Next Wait: ~
                      <strong className="text-slate-900 font-bold">{activeBusiness.waitMinutes || 12}</strong> mins
                    </span>
                  </div>
                </div>

                {/* Big Next Button Panel */}
                <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-between shadow-lg shadow-blue-700/20">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200 bg-white/10 px-2.5 py-1 rounded-md border border-white/20">
                      DESK CONTROLLER
                    </span>
                    <h2 className="text-2xl font-black mt-3 tracking-tight">Ready for next guest?</h2>
                    <p className="text-blue-100 text-xs mt-1.5 leading-relaxed">
                      Calling next advances the active queue, notifies the guest on their device, and announces the token.
                    </p>
                  </div>

                  <button
                    onClick={handleCallNext}
                    disabled={isCallingNext || waitingBookings.length === 0}
                    className="w-full py-5 bg-white text-blue-800 rounded-2xl font-black text-base tracking-wide shadow-xl hover:bg-blue-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-6"
                  >
                    {isCallingNext ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                        <span>Calling...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-2xl">campaign</span>
                        <span>CALL NEXT TOKEN</span>
                      </>
                    )}
                  </button>

                  <div className="text-[11px] text-blue-200 text-center mt-3 font-semibold">
                    {waitingBookings.length > 0
                      ? `Next token in line: ${waitingBookings[0].token}`
                      : "Queue is empty for today"}
                  </div>
                </div>
              </div>

              {/* Queue Table */}
              <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Today&apos;s Appointment Queue</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Real-time live queue tracking for {activeBusiness.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["all", "waiting", "in-progress", "completed", "cancelled"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                          statusFilter === f
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200 font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-3.5">Token</th>
                          <th className="px-6 py-3.5">Guest Name</th>
                          <th className="px-6 py-3.5">Service</th>
                          <th className="px-6 py-3.5">Slot Time</th>
                          <th className="px-6 py-3.5">Status</th>
                          <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-6 py-4 font-mono font-black text-slate-900">{b.token}</td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{b.name}</div>
                              <div className="text-xs text-slate-400">{b.phone || "Walk-in Guest"}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                              {b.serviceName || "General Service"}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{b.slot}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                  b.status === "in-progress"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : b.status === "waiting" || b.status === "confirmed"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : b.status === "completed"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {b.status !== "in-progress" && b.status !== "completed" && (
                                  <button
                                    onClick={() => updateBookingStatus(b.id, "in-progress", profileCounter)}
                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold cursor-pointer transition"
                                    title="Call now"
                                  >
                                    <span className="material-symbols-outlined text-base">campaign</span>
                                  </button>
                                )}
                                {b.status !== "completed" && (
                                  <button
                                    onClick={() => updateBookingStatus(b.id, "completed")}
                                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition"
                                    title="Mark completed"
                                  >
                                    <span className="material-symbols-outlined text-base">check</span>
                                  </button>
                                )}
                                {b.status !== "cancelled" && (
                                  <button
                                    onClick={() => updateBookingStatus(b.id, "cancelled")}
                                    className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition"
                                    title="Cancel"
                                  >
                                    <span className="material-symbols-outlined text-base">close</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No bookings found for the selected filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SERVICES & PRICING CONFIGURATOR */}
          {activeTab === "services" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Services &amp; Offerings</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Configure the specific services and procedures visitors can book at your facility.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddServiceModal(true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  <span>Add New Service</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeBusiness.services || []).map((s) => (
                  <div
                    key={s.id}
                    className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center font-bold text-lg">
                          <span className="material-symbols-outlined text-2xl">medical_services</span>
                        </div>
                        <button
                          onClick={() => removeBusinessService(selectedBusinessId, s.id)}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                          title="Delete service"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-4 group-hover:text-blue-600 transition">
                        {s.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {s.description || "Standard consultation or service procedure."}
                      </p>
                    </div>

                    <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
                        <span>{s.durationMinutes} mins</span>
                      </span>
                      <span className="font-black text-slate-900 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                        {s.price > 0 ? `₹${s.price}` : "Free / Gov"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SHIFT & SLOTS GENERATOR */}
          {activeTab === "schedule" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Shift &amp; Schedule Generator</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Generate daily appointment slots and block or unblock specific hours.
                </p>
              </div>

              {shiftSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl flex items-center gap-2 text-sm font-bold shadow-xs">
                  <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                  <span>{shiftSuccessMsg}</span>
                </div>
              )}

              {/* Generator Configuration Card */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-4">Daily Working Shift Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Start Hour (24h)
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="20"
                      value={shiftStartHour}
                      onChange={(e) => setShiftStartHour(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      End Hour (24h)
                    </label>
                    <input
                      type="number"
                      min="7"
                      max="23"
                      value={shiftEndHour}
                      onChange={(e) => setShiftEndHour(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Slot Interval (Minutes)
                    </label>
                    <select
                      value={shiftInterval}
                      onChange={(e) => setShiftInterval(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition cursor-pointer"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="20">20 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleRegenerateSchedule}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">auto_mode</span>
                  <span>Regenerate Slots for Today</span>
                </button>
              </div>

              {/* Slot Grid */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1">Today&apos;s Slots Availability</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Click on any slot to toggle blocking (e.g. Doctor in surgery or desk closed).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {(activeBusiness.slots || []).map((s) => {
                    const isBooked = (activeBusiness.bookedSlots || []).includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSlotBlocked(selectedBusinessId, null, s)}
                        className={`p-3.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          isBooked
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : "bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-800"
                        }`}
                      >
                        <span className="font-mono font-bold text-sm">{s}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {isBooked ? "Blocked" : "Available"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BUSINESS PROFILE & SETTINGS */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Business Profile &amp; Terminal</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Update your public business listing and local desk terminal settings.
                </p>
              </div>

              {profileSavedMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl flex items-center gap-2 text-sm font-bold shadow-xs">
                  <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                  <span>Business profile successfully saved!</span>
                </div>
              )}

              <form
                onSubmit={handleSaveProfile}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Facility / Business Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Physical Address (for Google Maps Navigation)
                  </label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Desk / Counter ID
                    </label>
                    <input
                      type="text"
                      value={profileCounter}
                      onChange={(e) => setProfileCounter(e.target.value)}
                      placeholder="e.g. Counter 1 or Room 102"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Avg Wait Time Buffer (Minutes)
                    </label>
                    <input
                      type="number"
                      value={profileWaitTime}
                      onChange={(e) => setProfileWaitTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: ANALYTICS & REPORTS */}
          {activeTab === "analytics" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Daily Queue Analytics &amp; Footfall</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Live operational statistics for {activeBusiness.name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Bookings</div>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                    {metrics?.totalBookings ?? businessBookings.length}
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mt-1">Visitors registered today</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Waiting</div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-600 mt-2">
                    {metrics?.waitingCount ?? waitingBookings.length}
                  </div>
                  <div className="text-xs font-semibold text-amber-600 mt-1">Citizens in queue</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Completed Tokens</div>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-600 mt-2">
                    {metrics?.completedCount ??
                      businessBookings.filter((b) => b.status === "completed").length}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 mt-1">Successfully served</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Capacity Utilization</div>
                  <div className="text-3xl sm:text-4xl font-black text-indigo-600 mt-2">
                    {metrics?.capacityPercent ?? 65}%
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 mt-1">Shift slots filled</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* WALK-IN APPOINTMENT MODAL */}
      {showWalkinModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Issue Walk-in Token</h3>
              <button
                onClick={() => {
                  setShowWalkinModal(false);
                  setWalkinSuccessToken("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {walkinSuccessToken ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900">Token Issued Successfully!</h4>
                <div className="text-5xl font-black font-mono text-emerald-600 tracking-tight">
                  {walkinSuccessToken}
                </div>
                <p className="text-xs text-slate-500">
                  Please ask the guest to wait near {profileCounter}.
                </p>
                <button
                  onClick={() => {
                    setShowWalkinModal(false);
                    setWalkinSuccessToken("");
                  }}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateWalkin} className="space-y-4 mt-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Guest Full Name</label>
                  <input
                    type="text"
                    required
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Service</label>
                  <select
                    value={walkinService}
                    onChange={(e) => setWalkinService(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 cursor-pointer transition"
                  >
                    <option value="">General Counter Service</option>
                    {(activeBusiness.services || []).map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.durationMinutes}m)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Internal Notes</label>
                  <input
                    type="text"
                    value={walkinNotes}
                    onChange={(e) => setWalkinNotes(e.target.value)}
                    placeholder="e.g. Senior citizen, Urgent"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition cursor-pointer"
                  >
                    Generate &amp; Print Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ADD SERVICE MODAL */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Add New Service</h3>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Service Name</label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. Dental Checkup"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="240"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Description (Optional)</label>
                <textarea
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  rows="3"
                  placeholder="Brief description of requirements or what the service covers..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition cursor-pointer"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
