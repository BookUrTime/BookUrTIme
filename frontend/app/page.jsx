"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBooking } from "../context/BookingContext";
import { Screen, BottomNavBar } from "../components/UI";
import { languages, serviceCategories } from "../lib/dummyData";
import { formatDate } from "../lib/formatDate";

export default function Home() {
  const router = useRouter();
  const {
    isHydrated,
    providerList,
    setProvider,
    setServiceType,
    bookings,
    activeBookingId,
    language,
    setLanguage,
  } = useBooking();

  const [searchQuery, setSearchQuery] = useState("");
  const [showLangModal, setShowLangModal] = useState(false);

  // Find active booking if any
  const activeBooking = useMemo(() => {
    if (!bookings || bookings.length === 0) return null;
    return (
      bookings.find((b) => b.id === activeBookingId && b.status !== "cancelled") ||
      bookings.find((b) => b.status === "waiting" || b.status === "in-progress") ||
      bookings[0]
    );
  }, [bookings, activeBookingId]);

  // Filter businesses when searching
  const filteredBusinesses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    return (providerList || []).filter((b) => {
      const matchesName = b.name.toLowerCase().includes(q);
      const matchesAddress = b.address.toLowerCase().includes(q);
      const matchesType = b.type.toLowerCase().includes(q);
      const matchesService = (b.services || []).some((s) =>
        s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
      );

      return matchesName || matchesAddress || matchesType || matchesService;
    });
  }, [providerList, searchQuery]);

  const handleBookBusiness = (business) => {
    setProvider(business);
    setServiceType(business.type);
    router.push("/slots");
  };

  const getCategoryIcon = (type) => {
    switch (type) {
      case "hospital":
        return "local_hospital";
      case "salon":
        return "content_cut";
      case "dental":
        return "dentistry";
      case "aadhaar":
        return "badge";
      case "bank":
        return "account_balance";
      case "legal":
        return "gavel";
      default:
        return "storefront";
    }
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case "hospital":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "salon":
        return "bg-pink-50 text-pink-700 border-pink-200/60";
      case "dental":
        return "bg-cyan-50 text-cyan-700 border-cyan-200/60";
      case "aadhaar":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "bank":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "legal":
        return "bg-purple-50 text-purple-700 border-purple-200/60";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/60";
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const currentLangObj =
    languages.find((l) => l.code === (language || "en")) || languages[0];

  return (
    <Screen className="flex flex-col min-h-screen bg-slate-50 relative pb-28">
      {/* Top App Header - Modern Responsive Web Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 w-full shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-xl leading-none block">
                BookUrTime
              </span>
              <span className="text-[11px] text-slate-500 font-semibold tracking-wide">
                SMART QUEUE &amp; SLOTS
              </span>
            </div>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link
              href="/"
              className="text-blue-600 font-bold flex items-center gap-1.5 hover:text-blue-700 transition"
            >
              <span className="material-symbols-outlined text-lg">explore</span>
              <span>Explore Businesses</span>
            </Link>
            <Link
              href="/bookings"
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-lg">event_note</span>
              <span>My Bookings</span>
            </Link>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-lg text-emerald-600">support_agent</span>
              <span>Support</span>
            </a>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Language Pill */}
            <button
              onClick={() => setShowLangModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition cursor-pointer border border-slate-200"
              title="Switch Language"
            >
              <span className="material-symbols-outlined text-base">translate</span>
              <span>{currentLangObj.label.split(" ")[0]}</span>
            </button>

            {/* Business Terminal Link */}
            <button
              onClick={() => router.push("/business")}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white active:scale-95 transition-all cursor-pointer font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              title="Open Business Device Portal"
            >
              <span className="material-symbols-outlined text-base text-blue-400">devices</span>
              <span className="hidden sm:inline">Business Terminal</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-20 flex flex-col gap-6">
        {/* ACTIVE APPOINTMENT FLOATING CARD */}
        {activeBooking && activeBooking.status !== "cancelled" && (
          <div
            onClick={() => router.push("/confirmation")}
            className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-5 text-white shadow-lg shadow-blue-700/20 cursor-pointer hover:opacity-95 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none animate-fade-in"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-md flex flex-col items-center justify-center border border-white/20 shrink-0">
                <span className="text-[10px] uppercase font-bold text-blue-200 tracking-widest leading-none">
                  TOKEN
                </span>
                <span className="font-mono font-extrabold text-lg leading-tight mt-0.5">
                  {activeBooking.token}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-400/30 uppercase tracking-wider text-[10px]">
                    ● {activeBooking.status || "Active"}
                  </span>
                  <span className="text-xs text-blue-200 font-medium">
                    Slot: {activeBooking.slot}
                  </span>
                </div>
                <h4 className="font-bold text-base text-white mt-1 leading-snug">
                  {activeBooking.providerName}
                </h4>
                <p className="text-xs text-blue-200 mt-0.5">
                  {activeBooking.serviceName || "Scheduled Service"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl shrink-0 self-start sm:self-auto transition">
              <span>View Live Ticket</span>
              <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
            </div>
          </div>
        )}

        {/* HERO SEARCH & DISCOVERY BAR */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-100">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Live Wait Time &amp; Online Slot Reservation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Book Your Slot. Skip The Wait.
              </h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Search verified clinics, salons, banks, dentists, and service hubs. Reserve exact time slots and monitor live token queues in real-time.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-6 text-xs text-slate-500 font-semibold border-l border-slate-200 pl-6 shrink-0">
              <div className="text-center">
                <div className="text-lg font-black text-slate-900">0</div>
                <div>Queue Waiting</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-blue-600">100%</div>
                <div>Free to Book</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-emerald-600">Live</div>
                <div>Queue Counter</div>
              </div>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by business name, specialty, or service (e.g. CityCare, Hair Cut, Teeth Cleaning)..."
              className="w-full h-14 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl pl-12 pr-12 text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
        </section>

        {/* If user is actively searching: Show matching search results */}
        {searchQuery ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Search Results for &quot;{searchQuery}&quot;</span>
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                    {filteredBusinesses.length} found
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any business or procedure to reserve your slot directly.
                </p>
              </div>

              <button
                onClick={() => setSearchQuery("")}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                <span>Clear Search</span>
              </button>
            </div>

            {filteredBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((b) => {
                  const icon = getCategoryIcon(b.type);
                  const badgeColor = getCategoryColor(b.type);
                  const servicesList = b.services || [];

                  return (
                    <div
                      key={b.id}
                      className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400/80 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${badgeColor}`}
                            >
                              <span className="material-symbols-outlined text-2xl">{icon}</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                                {b.name}
                              </h3>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                <span className="capitalize font-semibold text-slate-600">
                                  {b.type}
                                </span>
                                <span>•</span>
                                <span>{b.distanceKm} km away</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0">
                            ~{b.waitMinutes || 12}m wait
                          </div>
                        </div>

                        {/* Address */}
                        <p className="text-xs text-slate-500 mt-2 flex items-start gap-1 leading-relaxed">
                          <span className="material-symbols-outlined text-base text-slate-400 shrink-0 mt-0.5">
                            location_on
                          </span>
                          <span>{b.address}</span>
                        </p>

                        {/* Services */}
                        {servicesList.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {servicesList.map((svc) => (
                              <span
                                key={svc.id}
                                className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/70"
                              >
                                {svc.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">Taking bookings</span>
                          <div className="text-[11px] text-slate-400">
                            Slots: {(b.slots || []).length} daily
                          </div>
                        </div>

                        <button
                          onClick={() => handleBookBusiness(b)}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Book Slot</span>
                          <span className="material-symbols-outlined text-sm rtl:rotate-180">
                            arrow_forward
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
                  search_off
                </span>
                <p className="font-bold text-base text-slate-700">
                  No businesses or services match &quot;{searchQuery}&quot;
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try searching with generic terms like &quot;doctor&quot;, &quot;facial&quot;, &quot;aadhaar&quot;, or &quot;dental&quot;.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  View All Categories
                </button>
              </div>
            )}
          </section>
        ) : (
          /* DEFAULT VIEW: BEAUTIFUL SMALL CARDS FOR ALL BUSINESS CATEGORIES */
          <section className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Browse by Business Category</span>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {serviceCategories.length} Categories
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Click on any category to view available centers, procedures menu, and instant time slots.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium hidden sm:block">
                Updated today • {formatDate()}
              </span>
            </div>

            {/* Small Category Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceCategories.map((cat) => {
                const count = (providerList || []).filter((p) => {
                  if (cat.id === "hospital") return p.type === "hospital" || p.type === "clinic";
                  return p.type === cat.id;
                }).length;

                return (
                  <div
                    key={cat.id}
                    onClick={() => router.push(`/category?type=${cat.id}`)}
                    className="bg-white border border-slate-200/90 hover:border-blue-400 rounded-3xl p-6 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div>
                      {/* Top Row: Icon + Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xs group-hover:scale-105 transition-transform ${cat.iconColor}`}
                        >
                          <span className="material-symbols-outlined text-3xl">
                            {cat.icon}
                          </span>
                        </div>

                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/70 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition">
                          {count} {count === 1 ? "Center" : "Centers"}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                        {cat.subtitle}
                      </p>

                      {/* Popular Services Pills */}
                      {cat.popularServices && cat.popularServices.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {cat.popularServices.map((svcName, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold bg-slate-50 text-slate-600 group-hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60"
                            >
                              {svcName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-blue-600 transition">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-slate-500 font-semibold">{cat.stats || "Live Queue Open"}</span>
                      </span>

                      <div className="flex items-center gap-1 text-blue-600 group-hover:translate-x-1 transition-transform">
                        <span>View Services</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* How It Works Banner */}
            <div className="mt-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
              <div className="max-w-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  How BookUrTime Works
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-1">
                  Skip the physical lines in 3 simple steps
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-white/10">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center font-bold text-blue-300 text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Choose Category &amp; Center</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Select your service type: clinic OPD, salon grooming, dental checkup, or govt seva.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center font-bold text-blue-300 text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Select Exact Time Slot</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Reserve a dedicated appointment slot and avoid waiting in crowded waiting lobbies.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center font-bold text-blue-300 text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Live Digital Token</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Receive an instant live queue pass with real-time counter updates on WhatsApp and web.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* LANGUAGE SELECTION MODAL */}
      {showLangModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">translate</span>
                <h3 className="font-bold text-slate-900 text-base">Select Your Language</h3>
              </div>
              <button
                onClick={() => setShowLangModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 mt-4">
              {languages.map((l) => {
                const isSelected = (language || "en") === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangModal(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 text-blue-900 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-700 shadow-2xs">
                        {l.avatar}
                      </span>
                      <div>
                        <div className="font-bold text-sm">{l.label}</div>
                        <div className="text-[11px] text-slate-500">{l.subtitle}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-blue-600">check_circle</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <BottomNavBar />
    </Screen>
  );
}
