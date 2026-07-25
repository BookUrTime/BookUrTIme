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
  const { isHydrated, serviceType, setProvider, getBookedSlots, language } = useBooking();
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

  // Find providers matching serviceType
  const matches = providers.filter((p) => p.type === serviceType);

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
    hospital: "Hospitals",
    aadhaar: "Aadhaar centers",
    bank: "Banks",
  };

  const serviceIcons = {
    hospital: "local_hospital",
    aadhaar: "fingerprint",
    bank: "account_balance",
  };

  // Dynamic wait color classes based on time
  const getWaitBadgeClass = (minutes) => {
    if (minutes < 15) {
      return "bg-secondary-container text-on-secondary-container";
    } else if (minutes <= 30) {
      return "bg-tertiary-container/10 text-tertiary";
    } else {
      return "bg-error-container text-on-error-container";
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
            className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-100 flex items-center justify-center p-2 min-touch-target cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">{s.brandName}</h1>
        </div>
        <button className="text-on-surface-variant hover:opacity-80 transition-opacity min-touch-target flex items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined">search</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow px-page-margin pb-32 pt-6">
        {/* Map Header Graphic */}
        <div className="relative w-full h-48 mb-stack-lg rounded-2xl overflow-hidden shadow-sm select-none">
          <Image
            className="absolute inset-0 w-full h-full object-cover"
            alt="New Delhi area map background placeholder representation"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNohjW9DHCkc9CLifavyjsWkDgfY6YywxN65UzVEEzJd822WHl98lAkV1F_R-05mPsGIG1yxKkuKnTCs7Ekv2Uq14afpKLivWCHEsBv_Dz28PgU3voMSMxOnIIw3MUP4ScKvdVE8ez7wRyQABIdLWmyK1cDaoIae_docKyz50CoJirKDw9T9LlVd8eBy_V_M8kdKY6m30SyZeJcHedHiv-ahlJ82iyui66JFOHq47SoT0G36tNXRxfdaTWArIhUR14vx21RDB6vQ"
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span className="font-label-lg text-label-lg font-semibold">{s.newDelhi}</span>
            </div>
          </div>
        </div>

        {/* Headings */}
        <div className="mb-stack-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-stack-sm">
            {serviceTypeLabels[serviceType] || "Services"} {s.nearYou}
          </h2>
          <p className="font-body-md text-on-surface-variant">
            {s.showingFacilities}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-outline-variant mb-stack-lg select-none">
          <button
            onClick={() => setFilter("nearest")}
            className={`flex-1 py-3 font-label-lg text-label-lg transition-colors min-touch-target cursor-pointer text-center ${
              filter === "nearest"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {s.nearest}
          </button>
          <button
            onClick={() => setFilter("shortest")}
            className={`flex-1 py-3 font-label-lg text-label-lg transition-colors min-touch-target cursor-pointer text-center ${
              filter === "shortest"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {s.shortestWait}
          </button>
        </div>

        {/* Dynamic Provider Cards List */}
        <div className="space-y-4">
          {sortedMatches.map((prov) => {
            const icon = serviceIcons[prov.type] || "local_hospital";
            const waitClass = getWaitBadgeClass(prov.waitMinutes);
            const nextAvailable = getNextAvailableSlot(prov);

            return (
              <div
                key={prov.id}
                onClick={() => handleBook(prov)}
                className="bg-white rounded-2xl p-4 border border-outline-variant shadow-sm hover:border-primary transition-all cursor-pointer group flex flex-col justify-between"
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
                      <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[14px]">near_me</span>
                        {prov.distanceKm} {s.kmAway}
                      </p>
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
                    className="bg-primary text-white px-6 py-2 rounded-full font-label-lg text-label-lg hover:opacity-95 active:scale-95 transition-all shadow-md group-hover:shadow-primary/20 min-touch-target cursor-pointer"
                  >
                    {s.book}
                  </button>
                </div>
              </div>
            );
          })}

          {sortedMatches.length === 0 && (
            <div className="bg-white rounded-2xl p-6 border border-outline-variant text-center">
              <p className="text-on-surface-variant">{s.noProvidersFound}</p>
              <button
                onClick={handleBack}
                className="mt-4 text-primary font-semibold hover:underline"
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
