"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { providers } from "../../lib/dummyData";
import { useBooking } from "../../context/BookingContext";
import { Screen, BottomNavBar } from "../../components/UI";
import { formatDate } from "../../lib/formatDate";
import { strings } from "../../lib/strings";

export default function ProvidersPage() {
  const router = useRouter();
  const { isHydrated, serviceType, setProvider, getBookedSlots, language, providerList, providersLoading } = useBooking();
  const activeLang = language || "en";
  const s = strings[activeLang];
  const [filter, setFilter] = useState("nearest"); // 'nearest' or 'shortest'

  // Guard: redirect to /service if serviceType is missing AFTER hydration
  useEffect(() => {
    if (isHydrated && !serviceType) {
      router.replace("/service");
    }
  }, [isHydrated, serviceType, router]);

  // Back navigation
  const handleBack = () => {
    router.push("/service");
  };

  // Use dynamic providerList from context (fallback to static providers import if empty)
  const activeProviders = providerList && providerList.length > 0 ? providerList : providers;

  // Find providers matching serviceType
  const matches = activeProviders.filter((p) => p.type === serviceType);

  // Sorting logic based on filter
  const sortedMatches = [...matches].sort((a, b) => {
    if (filter === "nearest") {
      return a.distanceKm - b.distanceKm;
    } else {
      return a.waitMinutes - b.waitMinutes;
    }
  });

  // Booking action
  const handleBook = (prov) => {
    setProvider(prov);
    router.push("/slots");
  };

  const serviceTypeLabels = {
    hospital: { en: "Hospitals", hi: "अस्पताल", te: "ఆసుపత్రులు", ta: "மருத்துவமனைகள்", bn: "হাসপাতালসমূহ", ur: "ہسپتال" },
    aadhaar: { en: "Aadhaar centers", hi: "आधार केंद्र", te: "ఆధార్ కేంద్రాలు", ta: "ஆதார் மையங்கள்", bn: "আধার কেন্দ্রসমূহ", ur: "آدھار مراكز" },
    bank: { en: "Banks", hi: "बैंक", te: "బ్యాంకులు", ta: "வங்கிகள்", bn: "ব্যাংকসমূহ", ur: "بینک" },
  };

  const serviceIcons = {
    hospital: "local_hospital",
    aadhaar: "fingerprint",
    bank: "account_balance",
  };

  // Dynamic wait color classes based on time with high WCAG AA contrast
  const getWaitBadgeClass = (minutes) => {
    if (minutes < 15) {
      return "bg-emerald-50 text-[#047857] border border-emerald-200/70 font-semibold";
    } else if (minutes <= 30) {
      return "bg-amber-50 text-[#b45309] border border-amber-200/70 font-semibold";
    } else {
      return "bg-red-50 text-[#b91c1c] border border-red-200/70 font-semibold";
    }
  };

  // Get next available slot for a provider
  const getNextAvailableSlot = (prov) => {
    const booked = getBookedSlots(prov);
    const available = prov.slots.find((s) => !booked.includes(s));
    return available || s.noSlotsLeft;
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

  return (
    <Screen className="flex flex-col min-h-screen bg-background relative overflow-x-hidden p-0 max-w-container-max mx-auto">
      {/* Top App Bar Header */}
      <header className="bg-surface sticky top-0 w-full max-w-container-max mx-auto h-16 z-50 flex items-center justify-between px-page-margin border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-100 flex items-center justify-center p-2 min-touch-target cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">{s.brandName}</h1>
        </div>
        <button className="text-on-surface-variant hover:opacity-80 transition-opacity min-touch-target flex items-center justify-center cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
          <span className="material-symbols-outlined">search</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow px-page-margin pb-32 pt-6">
        {/* Map Header Graphic (Clickable to Google Maps) */}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sortedMatches[0]?.address || "New Delhi, Delhi, India")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full h-48 mb-stack-lg rounded-2xl overflow-hidden shadow-sm select-none block group cursor-pointer active:scale-[0.99] transition-all border border-outline-variant/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          title="Open area map in Google Maps"
        >
          <Image
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            alt="New Delhi area map background representation"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNohjW9DHCkc9CLifavyjsWkDgfY6YywxN65UzVEEzJd822WHl98lAkV1F_R-05mPsGIG1yxKkuKnTCs7Ekv2Uq14afpKLivWCHEsBv_Dz28PgU3voMSMxOnIIw3MUP4ScKvdVE8ez7wRyQABIdLWmyK1cDaoIae_docKyz50CoJirKDw9T9LlVd8eBy_V_M8kdKY6m30SyZeJcHedHiv-ahlJ82iyui66JFOHq47SoT0G36tNXRxfdaTWArIhUR14vx21RDB6vQ"
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span className="font-label-lg text-label-lg font-semibold">{s.newDelhi}</span>
            </div>
          </div>
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 px-3 py-1.5 rounded-full font-label-sm text-xs font-semibold shadow-md group-hover:bg-white flex items-center gap-1.5 cursor-pointer">
            <span className="material-symbols-outlined text-primary text-sm">map</span>
            <span>View on Map</span>
            <span className="material-symbols-outlined text-xs text-slate-500">open_in_new</span>
          </div>
        </a>

        {/* Headings */}
        <div className="mb-stack-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-stack-sm font-semibold">
            {serviceTypeLabels[serviceType]?.[activeLang] || serviceTypeLabels[serviceType]?.en || "Services"} {s.nearYou}
          </h2>
          <p className="font-body-md text-on-surface-variant">
            {s.showingFacilities}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-outline-variant mb-stack-lg select-none">
          <button
            onClick={() => setFilter("nearest")}
            className={`flex-1 py-3 font-label-lg text-label-lg transition-colors min-touch-target cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              filter === "nearest"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {s.nearest}
          </button>
          <button
            onClick={() => setFilter("shortest")}
            className={`flex-1 py-3 font-label-lg text-label-lg transition-colors min-touch-target cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              filter === "shortest"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {s.shortestWait}
          </button>
        </div>

        {/* Dynamic Provider Cards List or Skeleton Loader */}
        <div className="space-y-4">
          {providersLoading ? (
            /* Skeleton Loading State */
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-outline-variant shadow-sm animate-pulse flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0"></div>
                    <div className="space-y-2">
                      <div className="h-5 w-40 bg-slate-200 rounded-md"></div>
                      <div className="h-3 w-24 bg-slate-200 rounded-md"></div>
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                  <div className="space-y-1">
                    <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                    <div className="h-4 w-28 bg-slate-200 rounded-md"></div>
                  </div>
                  <div className="h-9 w-20 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            ))
          ) : (
            sortedMatches.map((prov) => {
              const icon = serviceIcons[prov.type] || "local_hospital";
              const waitClass = getWaitBadgeClass(prov.waitMinutes);
              const nextAvailable = getNextAvailableSlot(prov);

              return (
                <div
                  key={prov.id}
                  onClick={() => handleBook(prov)}
                  className="bg-white rounded-2xl p-4 border border-outline-variant shadow-sm hover:border-primary active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary"
                >
                  {/* Card Top Row */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">{icon}</span>
                      </div>
                      <div>
                        <h3 className="font-headline-md text-[18px] text-on-surface font-semibold group-hover:text-primary transition-colors leading-tight">
                          {prov.name}
                        </h3>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prov.address || prov.name + ", New Delhi")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-label-sm text-xs text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer w-fit focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                          title="Open location in Google Maps"
                        >
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span>{prov.distanceKm} {s.kmAway}</span>
                          <span className="text-slate-400">•</span>
                          <span className="line-clamp-1 underline">{prov.address ? prov.address.split(",")[1] || prov.address : "New Delhi"}</span>
                          <span className="material-symbols-outlined text-[12px] opacity-70">open_in_new</span>
                        </a>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full font-label-sm text-label-sm shrink-0 ${waitClass}`}>
                      {prov.waitMinutes} {s.min} {s.waitLabel}
                    </div>
                  </div>

                  {/* Card Bottom Row */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <div className="space-y-0.5">
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        {formatDate()}
                      </p>
                      <p className="font-body-md text-on-surface text-sm">
                        {s.next} <strong className="font-bold text-slate-800">{nextAvailable}</strong>
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid double click triggers
                        handleBook(prov);
                      }}
                      className="bg-primary text-white px-6 py-2 rounded-full font-label-lg text-label-lg hover:opacity-95 active:scale-95 transition-all shadow-md group-hover:shadow-primary/20 min-touch-target cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      {s.book}
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {!providersLoading && sortedMatches.length === 0 && (
            <div className="bg-white rounded-2xl p-6 border border-outline-variant text-center">
              <p className="text-on-surface-variant">{s.noProvidersFound}</p>
              <button
                onClick={handleBack}
                className="mt-4 text-primary font-semibold hover:underline cursor-pointer"
              >
                {s.goBackChooseService}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Bottom Nav Bar */}
      <BottomNavBar />
    </Screen>
  );
}
