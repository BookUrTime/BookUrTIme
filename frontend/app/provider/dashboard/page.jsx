"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../../../context/BookingContext";
import { Screen } from "../../../components/UI";
import { formatDate } from "../../../lib/formatDate";
import { fetchDashboardMetrics, fetchUpcoming } from "../../../lib/api";

const useBackend = process.env.NEXT_PUBLIC_USE_BACKEND !== "false";
const today = () => new Date().toISOString().slice(0, 10);

export default function ProviderDashboardPage() {
  const router = useRouter();
  const {
    isHydrated,
    bookings,
    providerList,
    switchRole,
    updateBookingStatus,
    updateProviderWaitTime,
    addProviderSlot,
    toggleProviderSlot,
    updateProviderProfile,
    providerCreateAppointment,
    autoGenerateSlots,
    cancelAppointment,
    getBookedSlots,
  } = useBooking();

  const [activeTab, setActiveTab] = useState("live-queue"); // 'live-queue' | 'schedule' | 'profile'
  const [selectedProviderId, setSelectedProviderId] = useState("citycare");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'waiting' | 'in-progress' | 'completed' | 'cancelled'
  const [newSlotTime, setNewSlotTime] = useState("");
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState("");
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [dashboardBookings, setDashboardBookings] = useState(null);

  // Direct Appointment Modal State (Walk-in Dispatcher)
  const [showAppointModal, setShowAppointModal] = useState(false);
  const [appointSlot, setAppointSlot] = useState("");
  const [appointName, setAppointName] = useState("");
  const [appointPhone, setAppointPhone] = useState("");
  const [appointDesk, setAppointDesk] = useState("Counter 1");
  const [appointNotes, setAppointNotes] = useState("");
  const [appointSuccessToken, setAppointSuccessToken] = useState("");

  // Shift Generator State
  const [genStartHour, setGenStartHour] = useState(9);
  const [genEndHour, setGenEndHour] = useState(17);
  const [genInterval, setGenInterval] = useState(30);
  const [genSuccessMsg, setGenSuccessMsg] = useState("");

  // Get active provider details
  const activeProvider = providerList.find((p) => p.id === selectedProviderId) || providerList[0] || {};

  // Profile form state
  const [profileName, setProfileName] = useState(activeProvider.name || "");
  const [profileAddress, setProfileAddress] = useState(activeProvider.address || "");
  const [profileType, setProfileType] = useState(activeProvider.type || "hospital");
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Sync profile form when active provider changes
  const handleSelectProvider = (provId) => {
    setSelectedProviderId(provId);
    const prov = providerList.find((p) => p.id === provId);
    if (prov) {
      setProfileName(prov.name || "");
      setProfileAddress(prov.address || "");
      setProfileType(prov.type || "hospital");
    }
  };

  useEffect(() => {
    if (!isHydrated || !selectedProviderId || !useBackend) return;
    const timer = setTimeout(async () => {
      try {
        const [metrics, upcoming] = await Promise.all([
          fetchDashboardMetrics(selectedProviderId, today()),
          fetchUpcoming(selectedProviderId, today()),
        ]);
        setDashboardMetrics(metrics);
        setDashboardBookings(upcoming);
      } catch {
        // Preserve the localStorage queue and computed stats when offline.
        setDashboardMetrics(null);
        setDashboardBookings(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isHydrated, selectedProviderId]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  // Filter bookings by selected provider
  const localProviderBookings = bookings.filter((b) => b.providerId === activeProvider.id || !b.providerId);
  const providerBookings = dashboardBookings ?? localProviderBookings;

  // Find currently serving booking & next in queue
  const currentlyServing = providerBookings.find((b) => b.status === "in-progress");
  const nextInQueue = providerBookings.find((b) => !b.status || b.status === "waiting");

  // Stats calculation
  const totalBookings = dashboardMetrics?.totalBookings ?? providerBookings.length;
  const waitingCount = dashboardMetrics?.waitingCount ?? providerBookings.filter((b) => !b.status || b.status === "waiting").length;
  const completedCount = dashboardMetrics?.completedCount ?? providerBookings.filter((b) => b.status === "completed").length;

  // Capacity calculation
  const allBookedSlotTimes = getBookedSlots(activeProvider);
  const totalSlotsCount = dashboardMetrics?.totalSlotsCount ?? ((activeProvider.slots || []).length || 1);
  const bookedSlotsCount = dashboardMetrics?.bookedSlotsCount ?? allBookedSlotTimes.length;
  const capacityPercent = dashboardMetrics?.capacityPercent ?? Math.min(100, Math.round((bookedSlotsCount / totalSlotsCount) * 100));

  // Available slots for manual appointing
  const availableSlotsForProvider = (activeProvider.slots || []).filter(
    (s) => !allBookedSlotTimes.includes(s)
  );

  // Filtered Queue list
  const filteredQueue = providerBookings.filter((b) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "waiting") return !b.status || b.status === "waiting";
    if (statusFilter === "in-progress") return b.status === "in-progress";
    if (statusFilter === "completed") return b.status === "completed";
    if (statusFilter === "cancelled") return b.status === "cancelled" || b.status === "no-show";
    return true;
  });

  // Call Next Token Action
  const handleCallNext = () => {
    if (currentlyServing) {
      updateBookingStatus(currentlyServing.id, "completed");
    }
    if (nextInQueue) {
      updateBookingStatus(nextInQueue.id, "in-progress");
    }
  };

  // Submit Direct Provider Appointment (Walk-in/Phone)
  const handleCreateDirectAppointment = (e) => {
    e.preventDefault();
    if (!appointSlot) return;

    const created = providerCreateAppointment(activeProvider.id, {
      slotTime: appointSlot,
      guestName: appointName || "Walk-in Guest",
      guestPhone: appointPhone,
      desk: appointDesk,
      notes: appointNotes,
    });

    if (created) {
      setAppointSuccessToken(created.token);
      setAppointSlot("");
      setAppointName("");
      setAppointPhone("");
      setAppointNotes("");
      setTimeout(() => {
        setAppointSuccessToken("");
        setShowAppointModal(false);
      }, 2000);
    }
  };

  // Auto-generate Shift Slots
  const handleRunSlotGenerator = (e) => {
    e.preventDefault();
    const generated = autoGenerateSlots(activeProvider.id, genStartHour, genEndHour, genInterval);
    setGenSuccessMsg(`Generated ${generated.length} time slots successfully!`);
    setTimeout(() => setGenSuccessMsg(""), 3000);
  };

  // Export Daily Roster to CSV
  const handleExportRosterCSV = () => {
    if (providerBookings.length === 0) {
      alert("No appointments available to export.");
      return;
    }
    const headers = ["Token", "Guest Name", "Phone", "Slot", "Desk", "Status", "Notes", "Date"];
    const rows = providerBookings.map((b) => [
      `"${b.token || ""}"`,
      `"${b.name || "Guest"}"`,
      `"${b.phone || ""}"`,
      `"${b.slot || ""}"`,
      `"${b.desk || "Counter 1"}"`,
      `"${b.status || "waiting"}"`,
      `"${b.notes || ""}"`,
      `"${formatDate(b.date)}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `roster_${activeProvider.id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Profile Form Save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProviderProfile(activeProvider.id, {
      name: profileName,
      address: profileAddress,
      type: profileType,
    });
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2000);
  };

  // Add Slot Handler
  const handleAddSlotSubmit = (e) => {
    e.preventDefault();
    if (newSlotTime.trim()) {
      addProviderSlot(activeProvider.id, newSlotTime.trim());
      setNewSlotTime("");
      setShowAddSlot(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "in-progress") {
      return (
        <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-xs font-bold animate-pulse flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          Now Serving
        </span>
      );
    } else if (status === "completed") {
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-xs font-semibold">
          Completed
        </span>
      );
    } else if (status === "no-show" || status === "cancelled") {
      return (
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-label-sm text-xs font-semibold">
          No-Show
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-label-sm text-xs font-semibold">
          Waiting
        </span>
      );
    }
  };

  return (
    <Screen className="flex flex-col min-h-screen bg-background relative overflow-x-hidden p-0 max-w-container-max mx-auto">
      {/* Top Header */}
      <header className="bg-surface sticky top-0 w-full max-w-container-max mx-auto h-16 z-50 flex items-center justify-between px-page-margin border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">admin_panel_settings</span>
          </div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Provider Console</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchRole("guest", router)}
            className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer font-bold text-xs flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            title="Switch to Booking App"
          >
            <span className="material-symbols-outlined text-sm">swap_horiz</span>
            <span>Booking App</span>
          </button>
          <button
            onClick={() => router.push("/provider/login")}
            className="text-on-surface-variant hover:text-primary transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            title="Sign out"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow px-page-margin pb-16 pt-6">
        
        {/* Provider Switcher & Quick Actions */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm mb-stack-lg flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] text-primary uppercase font-bold tracking-widest block">Active Facility</span>
              <select
                value={selectedProviderId}
                onChange={(e) => handleSelectProvider(e.target.value)}
                className="font-headline-md text-headline-md font-bold text-on-surface bg-transparent outline-none cursor-pointer border-b border-primary/30 pb-0.5"
              >
                {providerList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-label-sm text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Connected to Booking App
              </span>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
              <span>Today&apos;s Capacity Usage</span>
              <span>{bookedSlotsCount} / {totalSlotsCount} slots ({capacityPercent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  capacityPercent >= 85 ? "bg-red-500" : capacityPercent >= 60 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${capacityPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Dispatch Action Bar */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowAppointModal(true)}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>Appoint Slot (Walk-in / Phone)</span>
            </button>
            <button
              onClick={handleExportRosterCSV}
              className="px-3 py-2.5 bg-surface-container-low border border-outline-variant text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              title="Download booking log as CSV"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="flex border-b border-outline-variant mb-stack-lg select-none">
          <button
            onClick={() => setActiveTab("live-queue")}
            className={`flex-1 py-3 font-label-lg text-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              activeTab === "live-queue"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-lg">queue</span>
            <span>Live Queue</span>
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 py-3 font-label-lg text-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              activeTab === "schedule"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-lg">calendar_clock</span>
            <span>Slots & Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 font-label-lg text-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              activeTab === "profile"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            <span>Settings</span>
          </button>
        </div>

        {/* TAB 1: LIVE QUEUE & TOKEN MANAGEMENT */}
        {activeTab === "live-queue" && (
          <div className="space-y-6">
            
            {/* Now Serving Hero Card */}
            <div className="bg-gradient-to-br from-primary to-primary-container text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-white/80 font-bold block">Current Status</span>
                  <h2 className="text-2xl font-bold font-headline-lg mt-0.5">
                    {currentlyServing ? "Now Serving" : "Queue Ready"}
                  </h2>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
                  {waitingCount} Guests Waiting
                </div>
              </div>

              {currentlyServing ? (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white/80 uppercase font-semibold">Active Token</span>
                    <p className="text-3xl font-extrabold tracking-tight">{currentlyServing.token}</p>
                    <p className="text-sm text-white/90 font-medium mt-0.5">{currentlyServing.name} ({currentlyServing.slot})</p>
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-medium mt-1 inline-block">
                      {currentlyServing.desk || "Counter 1"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => updateBookingStatus(currentlyServing.id, "completed")}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-base">check</span>
                      Complete
                    </button>
                    <button
                      onClick={() => updateBookingStatus(currentlyServing.id, "no-show")}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-lg font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-base">person_off</span>
                      No-Show
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 mb-4 text-center">
                  <p className="text-sm text-white/90 font-medium">No guest is currently being served.</p>
                  {nextInQueue && (
                    <p className="text-xs text-white/70 mt-1">
                      Next up: <strong>{nextInQueue.token}</strong> ({nextInQueue.name})
                    </p>
                  )}
                </div>
              )}

              {/* Call Next Button */}
              <button
                onClick={handleCallNext}
                disabled={!nextInQueue && !currentlyServing}
                className="w-full py-3.5 bg-white text-primary rounded-xl font-bold text-base shadow-md hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">campaign</span>
                <span>{currentlyServing ? "Complete & Call Next Token" : "Call Next Guest Token"}</span>
              </button>
            </div>

            {/* Live Estimated Wait Time Controller */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Live Estimated Wait Time</h3>
                <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                  Directly impacts the estimated wait badge shown to guests.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateProviderWaitTime(activeProvider.id, (activeProvider.waitMinutes || 15) - 5)}
                  className="w-10 h-10 rounded-full border border-outline-variant hover:bg-slate-100 active:scale-95 flex items-center justify-center font-bold text-lg text-on-surface cursor-pointer"
                >
                  -
                </button>
                <span className="font-display-sm text-xl font-extrabold text-primary min-w-[50px] text-center">
                  {activeProvider.waitMinutes || 15}m
                </span>
                <button
                  onClick={() => updateProviderWaitTime(activeProvider.id, (activeProvider.waitMinutes || 15) + 5)}
                  className="w-10 h-10 rounded-full border border-outline-variant hover:bg-slate-100 active:scale-95 flex items-center justify-center font-bold text-lg text-on-surface cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 text-center">
                <p className="font-display-sm text-2xl text-primary font-bold">{totalBookings}</p>
                <p className="font-label-sm text-xs text-on-surface-variant mt-1">Total Appointments</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 text-center">
                <p className="font-display-sm text-2xl text-amber-600 font-bold">{waitingCount}</p>
                <p className="font-label-sm text-xs text-on-surface-variant mt-1">Waiting</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 text-center">
                <p className="font-display-sm text-2xl text-emerald-600 font-bold">{completedCount}</p>
                <p className="font-label-sm text-xs text-on-surface-variant mt-1">Completed</p>
              </div>
            </div>

            {/* Queue Filter Bar */}
            <div className="flex border-b border-outline-variant gap-2 overflow-x-auto pb-2 text-xs font-semibold">
              {["all", "waiting", "in-progress", "completed", "cancelled"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-full capitalize shrink-0 cursor-pointer transition-colors ${
                    statusFilter === filter
                      ? "bg-primary text-white font-bold"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Guest Queue List */}
            <div className="space-y-3">
              {filteredQueue.length > 0 ? (
                filteredQueue.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl p-4 border border-outline-variant shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                        <span className="material-symbols-outlined text-lg">person</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{booking.token}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-semibold text-slate-800 text-sm">{booking.name || "Guest"}</span>
                          {booking.createdBy === "provider" && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                              Walk-in
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Slot: <strong>{booking.slot}</strong> | {booking.desk || "Counter 1"} {booking.phone ? `| 📞 ${booking.phone}` : ""}
                        </p>
                        {booking.notes && (
                          <p className="text-[11px] text-amber-700 italic mt-0.5">Note: {booking.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                      {getStatusBadge(booking.status)}
                      
                      {(!booking.status || booking.status === "waiting") && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, "in-progress")}
                          className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 cursor-pointer"
                        >
                          Call Now
                        </button>
                      )}

                      {booking.status === "in-progress" && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, "completed")}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:opacity-90 active:scale-95 cursor-pointer"
                        >
                          Complete
                        </button>
                      )}

                      {confirmCancelId === booking.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setConfirmCancelId("")}
                            className="px-2 py-1 text-xs text-slate-600 border border-slate-200 rounded"
                          >
                            No
                          </button>
                          <button
                            onClick={() => {
                              cancelAppointment(booking.id);
                              setConfirmCancelId("");
                            }}
                            className="px-2 py-1 text-xs text-white bg-red-600 rounded"
                          >
                            Yes
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmCancelId(booking.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Remove booking"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-outline-variant text-center text-slate-500 text-sm">
                  No bookings matching the active filter.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: SLOTS & SCHEDULE CONFIGURATOR */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            
            {/* Shift Auto-Generator Card */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-3">
              <h3 className="font-headline-md text-base font-bold text-on-surface">Auto-Generate Shift Slots</h3>
              <p className="font-body-md text-xs text-on-surface-variant">
                Quickly generate recurring time slots for today&apos;s working hours.
              </p>

              {genSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{genSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleRunSlotGenerator} className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Hour (24H)</label>
                  <input
                    type="number"
                    min="6"
                    max="22"
                    value={genStartHour}
                    onChange={(e) => setGenStartHour(parseInt(e.target.value))}
                    className="w-full h-10 bg-surface-bright border border-outline-variant rounded-xl px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">End Hour (24H)</label>
                  <input
                    type="number"
                    min="7"
                    max="23"
                    value={genEndHour}
                    onChange={(e) => setGenEndHour(parseInt(e.target.value))}
                    className="w-full h-10 bg-surface-bright border border-outline-variant rounded-xl px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Interval (Mins)</label>
                  <select
                    value={genInterval}
                    onChange={(e) => setGenInterval(parseInt(e.target.value))}
                    className="w-full h-10 bg-surface-bright border border-outline-variant rounded-xl px-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value={15}>15 Mins</option>
                    <option value={30}>30 Mins</option>
                    <option value={45}>45 Mins</option>
                    <option value={60}>60 Mins</option>
                  </select>
                </div>
                <div className="col-span-3 pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-95 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">auto_mode</span>
                    <span>Generate Shift Schedule</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Header with Single Add Slot Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-lg text-lg font-bold text-on-surface">Time Slot Manager</h2>
                <p className="font-body-md text-xs text-on-surface-variant">
                  Toggle slot availability or add custom time slots for {activeProvider.name}.
                </p>
              </div>
              <button
                onClick={() => setShowAddSlot(!showAddSlot)}
                className="px-4 py-2 bg-primary text-white rounded-xl font-label-lg text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Add Custom Slot</span>
              </button>
            </div>

            {/* Add Custom Slot Form */}
            {showAddSlot && (
              <form onSubmit={handleAddSlotSubmit} className="bg-surface-container-lowest p-4 rounded-2xl border-2 border-primary shadow-md flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Time Slot (24H format)</label>
                  <input
                    type="text"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    placeholder="e.g. 16:30 or 17:00"
                    className="w-full h-11 bg-surface-bright border border-outline-variant rounded-xl px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 active:scale-95 cursor-pointer"
                  >
                    Save Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSlot(false)}
                    className="px-3 py-2.5 text-slate-600 font-semibold text-xs border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Slots Grid */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
              <h3 className="font-label-lg text-xs font-bold uppercase tracking-wider text-slate-500">Configured Time Slots</h3>
              <div className="grid grid-cols-3 gap-3">
                {(activeProvider.slots || []).map((slotTime) => {
                  const isBlocked = (allBookedSlotTimes || []).includes(slotTime);
                  return (
                    <div
                      key={slotTime}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-between text-center select-none transition-all ${
                        isBlocked
                          ? "bg-slate-100 border-slate-300 opacity-60"
                          : "bg-surface-container-lowest border-primary/30 hover:border-primary shadow-xs"
                      }`}
                    >
                      <span className="font-bold text-slate-900 text-sm">{slotTime}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        isBlocked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {isBlocked ? "Booked / Blocked" : "Available"}
                      </span>
                      <button
                        onClick={() => toggleProviderSlot(activeProvider.id, slotTime)}
                        className="mt-2 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        {isBlocked ? "Unblock" : "Block"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FACILITY PROFILE & SETTINGS */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-5">
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">Facility Profile & Settings</h2>
              <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                Update public display name, address, and service classification.
              </p>
            </div>

            {profileSaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Facility profile updated successfully!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 ml-0.5">Facility / Provider Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full h-12 bg-surface-bright border border-outline-variant rounded-xl px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 ml-0.5">Full Physical Address</label>
              <textarea
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                rows={3}
                className="w-full bg-surface-bright border border-outline-variant rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 ml-0.5">Service Type Category</label>
              <select
                value={profileType}
                onChange={(e) => setProfileType(e.target.value)}
                className="w-full h-12 bg-surface-bright border border-outline-variant rounded-xl px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="hospital">Hospital / Clinic</option>
                <option value="aadhaar">Aadhaar Seva Kendra</option>
                <option value="bank">Bank Branch</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full h-[50px] bg-primary text-white font-bold text-sm rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              <span>Save Facility Profile</span>
            </button>
          </form>
        )}

        {/* MODAL: DIRECT APPOINTMENT DISPATCHER (Walk-in / Telephone) */}
        {showAppointModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative border border-slate-100">
              <button
                onClick={() => {
                  setShowAppointModal(false);
                  setAppointSuccessToken("");
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <h3 className="font-headline-md text-lg font-bold text-slate-900 mb-1">
                Appoint Slot for Guest
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Walk-in or telephone appointment dispatch for {activeProvider.name}.
              </p>

              {appointSuccessToken ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-6 rounded-2xl text-center space-y-2 my-4 animate-scale">
                  <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
                  <h4 className="font-bold text-lg">Appointment Dispatched!</h4>
                  <p className="text-xs text-emerald-700">Official Queue Token Generated:</p>
                  <div className="text-3xl font-extrabold tracking-tight text-emerald-900">{appointSuccessToken}</div>
                </div>
              ) : (
                <form onSubmit={handleCreateDirectAppointment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Time Slot</label>
                    <select
                      value={appointSlot}
                      onChange={(e) => setAppointSlot(e.target.value)}
                      className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      required
                    >
                      <option value="">-- Choose an available slot --</option>
                      {availableSlotsForProvider.map((s) => (
                        <option key={s} value={s}>
                          {s} (Available)
                        </option>
                      ))}
                    </select>
                    {availableSlotsForProvider.length === 0 && (
                      <p className="text-[11px] text-red-600 mt-1">No open slots available. Please add/unblock a slot first.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Guest Name</label>
                    <input
                      type="text"
                      value={appointName}
                      onChange={(e) => setAppointName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={appointPhone}
                        onChange={(e) => setAppointPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Counter/Desk</label>
                      <select
                        value={appointDesk}
                        onChange={(e) => setAppointDesk(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      >
                        <option value="Counter 1">Counter 1</option>
                        <option value="Counter 2">Counter 2</option>
                        <option value="Desk 3">Desk 3</option>
                        <option value="Dr. Consultation">Dr. Consultation</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Reason (Optional)</label>
                    <input
                      type="text"
                      value={appointNotes}
                      onChange={(e) => setAppointNotes(e.target.value)}
                      placeholder="e.g. Walk-in, Senior citizen, Follow-up"
                      className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!appointSlot}
                    className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <span className="material-symbols-outlined text-lg">confirmation_number</span>
                    <span>Generate Token & Dispatch</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </main>
    </Screen>
  );
}
