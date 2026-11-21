"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useBooking } from "../../context/BookingContext";
import { Screen, BottomNavBar } from "../../components/UI";
import { serviceCategories, categoryTranslations, languages } from "../../lib/dummyData";
import { strings } from "../../lib/strings";

function CategoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type") || "hospital";

  const {
    isHydrated,
    providerList,
    setProvider,
    setSelectedService,
    language,
    setLanguage,
  } = useBooking();

  const activeLang = language || "en";
  const s = strings[activeLang] || strings.en;
  const currentLangObj = languages.find((l) => l.code === activeLang) || languages[0];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceTag, setSelectedServiceTag] = useState("all");
  const [showLangModal, setShowLangModal] = useState(false);

  // Find active category
  const activeCategory = useMemo(() => {
    return (
      serviceCategories.find((c) => c.id === rawType) || serviceCategories[0]
    );
  }, [rawType]);

  const currentCatTrans = categoryTranslations[activeCategory.id]?.[activeLang] || categoryTranslations[activeCategory.id]?.en;
  const categoryLabel = currentCatTrans?.label || activeCategory.label;
  const categorySubtitle = currentCatTrans?.subtitle || activeCategory.subtitle;

  // Find providers matching this category
  const matchingProviders = useMemo(() => {
    if (!providerList || providerList.length === 0) return [];
    return providerList.filter((p) => {
      if (activeCategory.id === "hospital") {
        return p.type === "hospital" || p.type === "clinic";
      }
      return p.type === activeCategory.id;
    });
  }, [providerList, activeCategory]);

  // Collect all unique service names in this category for quick filters
  const availableServices = useMemo(() => {
    const map = new Map();
    matchingProviders.forEach((p) => {
      (p.services || []).forEach((svc) => {
        if (!map.has(svc.name)) {
          map.set(svc.name, svc);
        }
      });
    });
    return Array.from(map.values());
  }, [matchingProviders]);

  // Filter providers and their services based on search query and selected service tag
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return matchingProviders.map((p) => {
      const allServices = p.services || [];
      const filteredServices = allServices.filter((svc) => {
        const matchesTag =
          selectedServiceTag === "all" || svc.name === selectedServiceTag;
        const matchesQuery =
          !q ||
          svc.name.toLowerCase().includes(q) ||
          (svc.description && svc.description.toLowerCase().includes(q)) ||
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q);

        return matchesTag && matchesQuery;
      });

      return {
        ...p,
        matchingServices: filteredServices,
      };
    }).filter((p) => {
      // Show provider if it has matching services or if provider name matches search
      if (!searchQuery && selectedServiceTag === "all") return true;
      return (
        p.matchingServices.length > 0 ||
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
      );
    });
  }, [matchingProviders, searchQuery, selectedServiceTag]);

  // Handle direct service booking
  const handleBookService = (providerObj, serviceObj) => {
    setProvider(providerObj);
    setSelectedService(serviceObj);
    router.push("/slots");
  };

  // Handle general provider booking
  const handleBookProvider = (providerObj) => {
    setProvider(providerObj);
    if (providerObj.services && providerObj.services.length > 0) {
      setSelectedService(providerObj.services[0]);
    }
    router.push("/slots");
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

  return (
    <Screen className="flex flex-col min-h-screen bg-slate-50 relative pb-28">
      {/* Top App Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 w-full shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              title={s.back}
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                {s.allCategories}
              </span>
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                <span className="material-symbols-outlined text-xl">schedule</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight text-lg leading-none block">
                  BookUrTime
                </span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
                  SMART QUEUE &amp; SLOTS
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link
              href="/"
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-lg">apps</span>
              <span>{s.allCategories}</span>
            </Link>
            <Link
              href="/bookings"
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-lg">event_note</span>
              <span>{s.myBookings}</span>
            </Link>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-lg text-emerald-600">
                support_agent
              </span>
              <span>{s.navSupport || "Support"}</span>
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Quick Language Pill */}
            <button
              onClick={() => setShowLangModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition cursor-pointer border border-slate-200"
              title={s.switchLanguage}
            >
              <span className="material-symbols-outlined text-base">translate</span>
              <span>{currentLangObj.label.split(" ")[0]}</span>
            </button>

            <button
              onClick={() => router.push("/business")}
              className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white active:scale-95 transition-all cursor-pointer font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              title="Open Business Device Portal"
            >
              <span className="material-symbols-outlined text-base text-blue-400">devices</span>
              <span className="hidden sm:inline">{s.businessTerminal}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-20 flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">home</span>
            <span>{s.home}</span>
          </Link>
          <span>/</span>
          <span>{s.categoriesCount || "Categories"}</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">{categoryLabel}</span>
        </div>

        {/* Category Header Banner */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4 sm:gap-5">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${activeCategory.iconColor}`}
              >
                <span className="material-symbols-outlined text-4xl sm:text-5xl">
                  {activeCategory.icon}
                </span>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold mb-1.5 border bg-slate-100 text-slate-700 border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{activeCategory.stats || s.liveQueueOpen}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {categoryLabel}
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                  {categorySubtitle}
                </p>
              </div>
            </div>

            {/* Quick summary stats */}
            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 shrink-0 text-xs text-slate-600">
              <div>
                <div className="text-xl font-black text-slate-900">
                  {matchingProviders.length}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">
                  {s.verifiedCenters}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <div className="text-xl font-black text-blue-600">
                  {availableServices.length}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">
                  {s.procedures}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <div className="text-xl font-black text-emerald-600">
                  ~12 {s.min}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">
                  {s.averageWait}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Category Switcher Tabs */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              {s.switchCategory}
            </span>
            {serviceCategories.map((cat) => {
              const isSelected = cat.id === activeCategory.id;
              const catTrans = categoryTranslations[cat.id]?.[activeLang] || categoryTranslations[cat.id]?.en;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedServiceTag("all");
                    setSearchQuery("");
                    router.push(`/category?type=${cat.id}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm scale-95"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/60"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                  <span>{catTrans?.label || cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${s.searchInCategory || "Search in"} ${categoryLabel}...`}
                className="w-full h-11 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-10 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-1">
              <span>{s.showingCenters || "Showing:"}</span>
              <span className="text-slate-900 font-bold">
                {filteredData.length} {s.centers || "Centers"}
              </span>
            </div>
          </div>

          {/* Procedure Tags */}
          {availableServices.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
              <button
                onClick={() => setSelectedServiceTag("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedServiceTag === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s.allServices || "All Services"} ({availableServices.length})
              </button>

              {availableServices.map((svc) => {
                const isSelected = selectedServiceTag === svc.name;
                return (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedServiceTag(isSelected ? "all" : svc.name)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {svc.name}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Business and Service Offerings Directory */}
        <section className="flex flex-col gap-6">
          {filteredData.length > 0 ? (
            filteredData.map((b) => {
              const servicesToDisplay =
                b.matchingServices && b.matchingServices.length > 0
                  ? b.matchingServices
                  : b.services || [];

              return (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition flex flex-col gap-5"
                >
                  {/* Provider Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${activeCategory.iconColor}`}
                      >
                        <span className="material-symbols-outlined text-2xl">
                          {activeCategory.icon}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-bold text-lg text-slate-900 leading-snug">
                            {b.name}
                          </h2>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            ~{b.waitMinutes || 12} {s.mins}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="material-symbols-outlined text-sm text-slate-400">
                            location_on
                          </span>
                          <span>{b.address}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-600">
                            {b.distanceKm} {s.kmAway || "km away"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        onClick={() => handleBookProvider(b)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <span>{s.generalBooking || "General Booking"}</span>
                        <span className="material-symbols-outlined text-sm rtl:rotate-180">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Available Services Grid for this Provider */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-blue-600">
                          checklist
                        </span>
                        <span>{s.availableProcedures || "Available Services & Procedures"} ({servicesToDisplay.length})</span>
                      </h3>
                      <span className="text-xs text-slate-400">
                        {s.chooseProcedureSubtitle || "Choose a service to reserve your exact time slot"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {servicesToDisplay.map((svc) => (
                        <div
                          key={svc.id}
                          className="bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-300 rounded-2xl p-4 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                                {svc.name}
                              </h4>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-extrabold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md inline-block">
                                  {svc.price === 0 ? (s.freePrice || "Free") : `₹${svc.price}`}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                              {svc.description || "Standard consultation and verified counter service."}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-slate-400">
                                schedule
                              </span>
                              <span>{svc.durationMinutes} {s.mins}</span>
                            </span>

                            <button
                              onClick={() => handleBookService(b, svc)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <span>{s.bookSlotBtn || "Book Slot"}</span>
                              <span className="material-symbols-outlined text-xs rtl:rotate-180">
                                arrow_forward
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">
                search_off
              </span>
              <p className="font-bold text-lg text-slate-800">
                {s.noResultsFound || "No services or centers found"}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                No services match your active search filter. Try clearing your search keyword or switching service filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedServiceTag("all");
                }}
                className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition cursor-pointer"
              >
                {s.resetFilters || "Reset Filters"}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* LANGUAGE SELECTION MODAL */}
      {showLangModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">translate</span>
                <h3 className="font-bold text-slate-900 text-base">{s.selectLanguageModal}</h3>
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
                const isSelected = activeLang === l.code;
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

      <BottomNavBar />
    </Screen>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl animate-spin text-blue-600">
            progress_activity
          </span>
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
