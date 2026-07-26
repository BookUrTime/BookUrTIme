"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../../context/BookingContext";
import { Screen } from "../../components/UI";
import { strings } from "../../lib/strings";

export default function SlotsPage() {
  const router = useRouter();
  const {
    isHydrated,
    provider,
    providerList,
    slot,
    setSlot,
    name,
    setName,
    phone,
    setPhone,
    bookAppointment,
    getBookedSlots,
    language
  } = useBooking();

  const activeLang = language || "en";
  const s = strings[activeLang];

  const [selectedSlot, setSelectedSlot] = useState(slot || "");
  const [userName, setUserName] = useState(name || "");
  const [userPhone, setUserPhone] = useState(phone || "");
  const [isProcessing, setIsProcessing] = useState(false);

  // Derive showForm from selectedSlot instead of using state+effect
  const showForm = !!selectedSlot;

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!provider) {
    return (
      <Screen>
        <div className="bg-white rounded-2xl p-6 border border-outline-variant text-center">
          <p className="text-on-surface-variant">{s.chooseProviderFirst}</p>
          <button
            onClick={() => router.push("/providers")}
            className="mt-4 text-primary font-semibold hover:underline"
          >
            {s.chooseProviderBtn}
          </button>
        </div>
      </Screen>
    );
  }

  // Get current provider from dynamic providerList to include newly added or unblocked slots
  const currentProvider = (providerList || []).find((p) => p.id === provider.id) || provider;

  // Helper to convert 24hr slot ("14:30") to 12hr AM/PM ("02:30 PM")
  const convertToAMPM = (time24) => {
    const [hourStr, minStr] = time24.split(":");
    const hour = parseInt(hourStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const formattedHour = String(displayHour).padStart(2, "0");
    return `${formattedHour}:${minStr} ${ampm}`;
  };

  // Helper to convert 12hr AM/PM back to 24hr slot for standard checks
  const convertTo24H = (time12) => {
    const [time, ampm] = time12.split(" ");
    const [hourStr, minStr] = time.split(":");
    let hour = parseInt(hourStr);
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minStr}`;
  };

  const activeBookedSlots = getBookedSlots(currentProvider);

  // Grouping slots using currentProvider
  const morningSlots = (currentProvider.slots || [])
    .filter((time) => parseInt(time.slice(0, 2)) < 12)
    .map(convertToAMPM);

  const afternoonSlots = (currentProvider.slots || [])
    .filter((time) => parseInt(time.slice(0, 2)) >= 12)
    .map(convertToAMPM);

  const handleBack = () => {
    router.push("/providers");
  };

  const handleSlotSelect = (time12) => {
    setSelectedSlot(time12);
    // Scroll to form after a brief delay to let React render the form
    setTimeout(() => {
      const formEl = document.getElementById("booking-form-container");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleConfirmBooking = () => {
    if (selectedSlot && userName.trim().length >= 2 && userPhone.trim().length >= 8) {
      setIsProcessing(true);
      
      // Save details to state & context
      setName(userName);
      setPhone(userPhone);
      setSlot(selectedSlot);
      
      // Simulate API processing delay (1.5s as requested by HTML code script)
      setTimeout(() => {
        bookAppointment(provider, selectedSlot, userName);
        router.push("/confirmation");
      }, 1500);
    }
  };

  // Form validation checks
  const isFormValid =
    selectedSlot &&
    userName.trim().length >= 2 &&
    userPhone.trim().length >= 8;

  const serviceIcons = {
    hospital: "local_hospital",
    aadhaar: "fingerprint",
    bank: "account_balance",
  };

  return (
    <Screen className="flex flex-col min-h-screen bg-background relative overflow-x-hidden p-0 max-w-container-max mx-auto">
      {/* Top App Bar Header */}
      <header className="bg-surface sticky top-0 w-full max-w-container-max mx-auto h-16 z-50 flex items-center justify-between px-page-margin border-b border-outline-variant/10 shrink-0">
        <button
          onClick={handleBack}
          className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-100 flex items-center gap-1 p-2 min-touch-target cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
          <span className="font-label-lg text-label-lg font-semibold">{s.back}</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">{s.brandName}</h1>
        <div className="w-12"></div> {/* Spacer balance */}
      </header>

      {/* Main Container */}
      <main className="flex-grow px-page-margin pt-6 pb-32 flex flex-col gap-6">
        
        {/* Provider Info Header Card */}
        <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm shrink-0">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-primary-container/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">
                {serviceIcons[currentProvider.type] || "local_hospital"}
              </span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
                {currentProvider.name}
              </h2>
              <p className="font-label-lg text-label-lg text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {s.estWaitPrefix} {currentProvider.waitMinutes || 15} {s.mins}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 select-none">
            <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim"></span>
            <span className="font-label-sm text-label-sm text-secondary font-semibold">
              {s.takingWalkinsBookings}
            </span>
          </div>
        </section>

        {/* Slot Selection Grid */}
        <section id="slot-picker" className="flex flex-col gap-6 select-none">
          <h3 className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider font-bold">
            {s.availableSlots}
          </h3>

          {/* Morning Slots */}
          <div>
            <h4 className="font-label-lg text-label-lg mb-stack-sm flex items-center gap-2 font-semibold text-slate-800">
              <span className="material-symbols-outlined text-tertiary">light_mode</span>
              {s.morning}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {morningSlots.map((time12) => {
                const time24 = convertTo24H(time12);
                const isBooked = activeBookedSlots.includes(time24);
                const isSelected = selectedSlot === time12;

                return (
                  <button
                    key={time12}
                    disabled={isBooked}
                    aria-disabled={isBooked}
                    onClick={() => handleSlotSelect(time12)}
                    className={`slot-pill h-12 flex items-center justify-center border rounded-xl font-label-lg transition-all text-sm font-semibold select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                      isBooked
                        ? "slot-pill disabled cursor-not-allowed"
                        : isSelected
                        ? "slot-pill active animate-slot-snap border-2 border-primary shadow-sm"
                        : "border-outline-variant hover:bg-surface-container-high hover:border-primary/50 active:scale-95 cursor-pointer"
                    }`}
                  >
                    {time12.replace(" AM", "")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Afternoon Slots */}
          <div>
            <h4 className="font-label-lg text-label-lg mb-stack-sm flex items-center gap-2 font-semibold text-slate-800">
              <span className="material-symbols-outlined text-primary">partly_cloudy_day</span>
              {s.afternoon}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {afternoonSlots.map((time12) => {
                const time24 = convertTo24H(time12);
                const isBooked = activeBookedSlots.includes(time24);
                const isSelected = selectedSlot === time12;

                return (
                  <button
                    key={time12}
                    disabled={isBooked}
                    aria-disabled={isBooked}
                    onClick={() => handleSlotSelect(time12)}
                    className={`slot-pill h-12 flex items-center justify-center border rounded-xl font-label-lg transition-all text-sm font-semibold select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                      isBooked
                        ? "slot-pill disabled cursor-not-allowed"
                        : isSelected
                        ? "slot-pill active animate-slot-snap border-2 border-primary shadow-sm"
                        : "border-outline-variant hover:bg-surface-container-high hover:border-primary/50 active:scale-95 cursor-pointer"
                    }`}
                  >
                    {time12.replace(" PM", "")}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Booking Details Input Form */}
        {showForm && (
          <section
            id="booking-form-container"
            className="transition-all duration-300 transform translate-y-0 opacity-100 mt-2"
          >
            <div className="bg-surface-container-lowest p-6 rounded-2xl border-2 border-primary shadow-lg mb-stack-lg flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md font-bold text-slate-900">
                  {s.bookingDetails}
                </h3>
                <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-label-lg font-bold text-xs">
                  {selectedSlot}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-label-lg text-label-lg mb-1 ml-1 text-on-surface-variant font-semibold">
                    {s.fullName}
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full h-14 bg-surface-bright border border-outline-variant rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 font-semibold"
                    placeholder={s.enterYourName}
                  />
                </div>
                <div>
                  <label className="block font-label-lg text-label-lg mb-1 ml-1 text-on-surface-variant font-semibold">
                    {s.phoneNumber}
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full h-14 bg-surface-bright border border-outline-variant rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 font-semibold"
                    placeholder="+91 98765 43210"
                    maxLength={15}
                  />
                  <p className="text-[10px] text-on-surface-variant mt-1.5 ml-1">
                    {s.includeCountryCode}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* Sticky Bottom Confirm Booking Button Footer */}
      <footer className="fixed bottom-0 left-0 right-0 w-full max-w-container-max mx-auto bg-surface-container-lowest/90 backdrop-blur-md px-page-margin py-4 border-t border-outline-variant/30 flex flex-col gap-2 z-[60]">
        <button
          onClick={handleConfirmBooking}
          disabled={!isFormValid || isProcessing}
          className={`w-full h-[52px] bg-primary text-on-primary rounded-xl font-label-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer shrink-0 ${
            !isFormValid || isProcessing
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-opacity-95"
          }`}
        >
          {isProcessing ? (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span>
              <span>{s.processing}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              <span>{s.confirmBooking}</span>
            </>
          )}
        </button>
      </footer>
    </Screen>
  );
}
