"use client";

import { useEffect, useState } from "react";
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
  const [walkinSlot, setWalkinSlot] = useState("");
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
  const refreshQueueData = async () => {
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
  };

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
  }, [isHydrated, selectedBusinessId]);

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
        slotTime: walkinSlot || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        guestName: walkinName,
        guestPhone: walkinPhone,
        serviceName: walkinService || "General Counter Service",
        desk: profileCounter,
        notes: walkinNotes,
      });
      setWalkinSuccessToken(result.token);
      setWalkinName("");
      setWalkinPhone("");
      setWalkinNotes("");
      await refreshQueueData();
    } catch (e) {
      alert("Error issuing walk-in token: " + e.message);
    }
  };

  // Add Service
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
      setShowAddServiceModal(false);
      setNewServiceName("");
      setNewServiceDesc("");
    } catch (e) {
      alert("Failed to add service: " + e.message);
    }
  };

  // Regenerate Schedule
  const handleRegenerateSchedule = async () => {
    try {
      await regenerateBusinessSchedule(selectedBusinessId, {
        date: today(),
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <span className="material-symbols-outlined text-4xl animate-spin text-blue-500">progress_activity</span>
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Business Station Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-lg">
              <span className="material-symbols-outlined text-blue-400">devices</span>
              BookUrTime <span className="text-xs bg-blue-600/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">Business Terminal</span>
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          {/* Business Selector */}
          <select
            value={selectedBusinessId}
            onChange={(e) => handleSelectBusiness(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {providerList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-emerald-400">desktop_windows</span>
            {profileCounter}
          </span>

          <button
            onClick={() => switchRole("guest", router)}
            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
            title="Switch to Citizen / Customer Booking Mode"
          >
            <span className="material-symbols-outlined text-sm">person</span>
            Customer View
          </button>
        </div>
      </header>

      {/* Main Terminal Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-row md:flex-col p-3 gap-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("counter")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left ${
              activeTab === "counter"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined">queue_play_next</span>
            <span>Live Counter</span>
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left ${
              activeTab === "services"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined">design_services</span>
            <span>Services & Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left ${
              activeTab === "schedule"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Shift & Slots</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left ${
              activeTab === "profile"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined">storefront</span>
            <span>Business Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left ${
              activeTab === "analytics"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined">monitoring</span>
            <span>Live Reports</span>
          </button>

          <div className="hidden md:block mt-auto p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">{activeBusiness.name}</p>
            <p className="truncate text-slate-400 mt-0.5">{activeBusiness.address}</p>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-semibold">● Station Online</span>
              <span>{formatDate()}</span>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">
          {callAlertMsg && (
            <div className="mb-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
              <span className="flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined">check_circle</span>
                {callAlertMsg}
              </span>
            </div>
          )}

          {/* TAB 1: LIVE COUNTER STATION */}
          {activeTab === "counter" && (
            <div className="space-y-6">
              {/* Top Hero Station: Now Serving + Big Next Button */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Now Serving Big Card */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Now Serving at {profileCounter}
                    </span>
                    <button
                      onClick={() => setShowWalkinModal(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Issue Walk-in Token
                    </button>
                  </div>

                  {currentlyServing ? (
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4">
                      <div>
                        <div className="text-6xl md:text-7xl font-extrabold tracking-tight text-white font-mono">
                          {currentlyServing.token}
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-200">
                          {currentlyServing.name}{" "}
                          <span className="text-slate-400 text-sm font-normal">
                            ({currentlyServing.phone || "No phone"})
                          </span>
                        </div>
                        <div className="text-sm text-blue-400 font-medium">
                          Service: {currentlyServing.serviceName || "General Service"} • Slot: {currentlyServing.slot}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateBookingStatus(currentlyServing.id, "completed")}
                          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                          Mark Done
                        </button>
                        <button
                          onClick={() => updateBookingStatus(currentlyServing.id, "no-show")}
                          className="px-4 py-3 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 rounded-xl font-semibold text-sm transition cursor-pointer"
                          title="Mark absent"
                        >
                          Absent / No-Show
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-500">
                        <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
                      </div>
                      <p className="text-xl font-bold text-slate-300">Station is Idle</p>
                      <p className="text-slate-500 text-sm mt-1">
                        No guest is currently being served. Click &quot;Call Next Token&quot; to advance.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Waiting in Line:{" "}
                      <strong className="text-white font-semibold">{waitingBookings.length}</strong> guests
                    </span>
                    <span>
                      Est. Next Wait: ~
                      <strong className="text-white font-semibold">{activeBusiness.waitMinutes || 12}</strong> mins
                    </span>
                  </div>
                </div>

                {/* Big Next Button Panel */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-widest text-blue-200">
                      QUEUE CONTROLLER
                    </span>
                    <h2 className="text-2xl font-black mt-1">Ready for next guest?</h2>
                    <p className="text-blue-100 text-xs mt-1 leading-relaxed">
                      Calling next will mark any current appointment as complete and announce the next waiting token.
                    </p>
                  </div>

                  <button
                    onClick={handleCallNext}
                    disabled={isCallingNext || waitingBookings.length === 0}
                    className="w-full py-5 bg-white text-blue-900 rounded-xl font-black text-lg tracking-wide shadow-2xl hover:bg-blue-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-6"
                  >
                    {isCallingNext ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Calling...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-2xl">campaign</span>
                        CALL NEXT TOKEN
                      </>
                    )}
                  </button>

                  <div className="text-[11px] text-blue-200 text-center mt-3 font-medium">
                    {waitingBookings.length > 0
                      ? `Next token in queue: ${waitingBookings[0].token}`
                      : "Queue is empty for today"}
                  </div>
                </div>
              </div>

              {/* Queue Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">Today&apos;s Appointment Queue</h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Real-time queue tracking for {activeBusiness.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {["all", "waiting", "in-progress", "completed", "cancelled"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                          statusFilter === f
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold">
                        <tr>
                          <th className="px-6 py-3.5">Token</th>
                          <th className="px-6 py-3.5">Guest Name</th>
                          <th className="px-6 py-3.5">Service</th>
                          <th className="px-6 py-3.5">Slot Time</th>
                          <th className="px-6 py-3.5">Status</th>
                          <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-800/40 transition">
                            <td className="px-6 py-4 font-mono font-bold text-white">{b.token}</td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white">{b.name}</div>
                              <div className="text-xs text-slate-500">{b.phone || "Walk-in"}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-300 text-xs font-medium">
                              {b.serviceName || "General Service"}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-400">{b.slot}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                  b.status === "in-progress"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : b.status === "waiting" || b.status === "confirmed"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : b.status === "completed"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
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
                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                    title="Call now"
                                  >
                                    <span className="material-symbols-outlined text-sm">campaign</span>
                                  </button>
                                )}
                                {b.status !== "completed" && (
                                  <button
                                    onClick={() => updateBookingStatus(b.id, "completed")}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                    title="Mark completed"
                                  >
                                    <span className="material-symbols-outlined text-sm">check</span>
                                  </button>
                                )}
                                {b.status !== "cancelled" && (
                                  <button
                                    onClick={() => updateBookingStatus(b.id, "cancelled")}
                                    className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg text-xs font-semibold cursor-pointer"
                                    title="Cancel"
                                  >
                                    <span className="material-symbols-outlined text-sm">close</span>
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
                  <div className="py-12 text-center text-slate-500 text-sm">
                    No bookings found for the selected filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SERVICES & PRICING CONFIGURATOR */}
          {activeTab === "services" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Services & Offerings</h2>
                  <p className="text-slate-400 text-sm">
                    Configure the specific services and procedures visitors can book at your facility.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddServiceModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add New Service
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(activeBusiness.services || []).map((s) => (
                  <div
                    key={s.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">
                          <span className="material-symbols-outlined">medical_services</span>
                        </span>
                        <button
                          onClick={() => removeBusinessService(selectedBusinessId, s.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 transition cursor-pointer"
                          title="Delete service"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                      <h3 className="font-bold text-white text-base mt-3">{s.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {s.description || "No description provided."}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-slate-500">schedule</span>
                        {s.durationMinutes} mins
                      </span>
                      <span className="font-bold text-white">
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
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Shift & Schedule Generator</h2>
                <p className="text-slate-400 text-sm">
                  Generate daily appointments slots and block/unblock specific hours.
                </p>
              </div>

              {shiftSuccessMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {shiftSuccessMsg}
                </div>
              )}

              {/* Generator Configuration Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4">Daily Working Shift Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Start Hour (24h)
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="20"
                      value={shiftStartHour}
                      onChange={(e) => setShiftStartHour(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      End Hour (24h)
                    </label>
                    <input
                      type="number"
                      min="7"
                      max="23"
                      value={shiftEndHour}
                      onChange={(e) => setShiftEndHour(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Slot Interval (Minutes)
                    </label>
                    <select
                      value={shiftInterval}
                      onChange={(e) => setShiftInterval(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">auto_mode</span>
                  Regenerate Slots for Today
                </button>
              </div>

              {/* Slot Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-2">Today&apos;s Slots Availability</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Click on any slot to toggle blocking (e.g. Doctor in surgery or counter closed).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {(activeBusiness.slots || []).map((s) => {
                    const isBooked = (activeBusiness.bookedSlots || []).includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSlotBlocked(selectedBusinessId, null, s)}
                        className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          isBooked
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-slate-800 border-slate-700 text-slate-200 hover:border-blue-500"
                        }`}
                      >
                        <span className="font-mono font-bold text-sm">{s}</span>
                        <span className="text-[10px] font-semibold uppercase">
                          {isBooked ? "Booked/Blocked" : "Available"}
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
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-2xl font-bold text-white">Business Profile & Terminal</h2>
                <p className="text-slate-400 text-sm">
                  Update your public business listing and local desk terminal settings.
                </p>
              </div>

              {profileSavedMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Business profile successfully saved!
                </div>
              )}

              <form
                onSubmit={handleSaveProfile}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Facility / Business Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Physical Address (for Google Maps Navigation)
                  </label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Desk / Counter ID
                    </label>
                    <input
                      type="text"
                      value={profileCounter}
                      onChange={(e) => setProfileCounter(e.target.value)}
                      placeholder="e.g. Counter 1 or Room 102"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Avg Wait Time Buffer (Minutes)
                    </label>
                    <input
                      type="number"
                      value={profileWaitTime}
                      onChange={(e) => setProfileWaitTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: ANALYTICS & REPORTS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Daily Queue Analytics & Footfall</h2>
                <p className="text-slate-400 text-sm">
                  Live operational statistics for {activeBusiness.name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="text-xs uppercase font-semibold text-slate-400">Total Bookings</div>
                  <div className="text-3xl font-extrabold text-white mt-2">
                    {metrics?.totalBookings ?? businessBookings.length}
                  </div>
                  <div className="text-xs text-blue-400 mt-1">Visitors registered today</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="text-xs uppercase font-semibold text-slate-400">Active Waiting</div>
                  <div className="text-3xl font-extrabold text-amber-400 mt-2">
                    {metrics?.waitingCount ?? waitingBookings.length}
                  </div>
                  <div className="text-xs text-amber-400/80 mt-1">Citizens in queue</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="text-xs uppercase font-semibold text-slate-400">Completed Tokens</div>
                  <div className="text-3xl font-extrabold text-emerald-400 mt-2">
                    {metrics?.completedCount ??
                      businessBookings.filter((b) => b.status === "completed").length}
                  </div>
                  <div className="text-xs text-emerald-400/80 mt-1">Successfully served</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="text-xs uppercase font-semibold text-slate-400">Capacity Utilization</div>
                  <div className="text-3xl font-extrabold text-indigo-400 mt-2">
                    {metrics?.capacityPercent ?? 65}%
                  </div>
                  <div className="text-xs text-indigo-400/80 mt-1">Shift slots filled</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* WALK-IN APPOINTMENT MODAL */}
      {showWalkinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-lg">Issue Walk-in Token</h3>
              <button
                onClick={() => {
                  setShowWalkinModal(false);
                  setWalkinSuccessToken("");
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {walkinSuccessToken ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <h4 className="text-lg font-bold text-white">Token Issued Successfully!</h4>
                <div className="text-4xl font-extrabold font-mono text-emerald-400">
                  {walkinSuccessToken}
                </div>
                <p className="text-xs text-slate-400">
                  Please ask the guest to wait near {profileCounter}.
                </p>
                <button
                  onClick={() => {
                    setShowWalkinModal(false);
                    setWalkinSuccessToken("");
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateWalkin} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Guest Full Name</label>
                  <input
                    type="text"
                    required
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Service</label>
                  <select
                    value={walkinService}
                    onChange={(e) => setWalkinService(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Internal Notes</label>
                  <input
                    type="text"
                    value={walkinNotes}
                    onChange={(e) => setWalkinNotes(e.target.value)}
                    placeholder="e.g. Senior citizen, Urgent"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer"
                  >
                    Generate & Print Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ADD SERVICE MODAL */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-lg">Add New Service</h3>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. Dental Checkup"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="240"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  rows="3"
                  placeholder="Brief description of requirements or what the service covers..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer"
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
