"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Screen } from "../components/UI";
import { useBooking } from "../context/BookingContext";
import { strings } from "../lib/strings";

export default function Home() {
  const router = useRouter();
  const { isHydrated, bookings, language } = useBooking();
  const activeLang = language || "en";
  const s = strings[activeLang];
  const [isNavigating, setIsNavigating] = useState(false);

  // Redirect if existing bookings were found after hydration completes
  useEffect(() => {
    if (isHydrated && bookings && bookings.length > 0) {
      router.replace("/bookings");
    }
  }, [isHydrated, bookings, router]);

  const handleGetStarted = () => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push("/language");
    }, 400); // Small delay for visual feedback
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
    <Screen className="flex flex-col min-h-screen bg-background relative overflow-hidden p-0 max-w-container-max mx-auto">
      {/* Animated Background Ornament */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-page-margin w-full h-16 bg-surface z-20 shrink-0">
        <div className="font-headline-md text-headline-md font-bold text-primary">
          {s.brandName}
        </div>
        <button
          onClick={() => router.push("/language")}
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:opacity-85 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">language</span>
        </button>
      </header>

      {/* Hero Content Section */}
      <section className="flex-grow flex flex-col items-center justify-center px-page-margin py-stack-lg relative z-10 text-center select-none">
        {/* isometric Hero Graphic */}
        <div className="relative w-full aspect-square max-w-[320px] mb-stack-lg group">
          {/* Decorative shapes */}
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary-container rounded-2xl rotate-12 animate-pulse opacity-50"></div>
          <div className="absolute -bottom-6 -left-2 w-24 h-24 bg-primary-fixed-dim rounded-full mix-blend-multiply opacity-30"></div>

          {/* Isometric Calendar/Clock Image */}
          <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative bg-white">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-container opacity-20 z-0"></div>
            <Image
              className="w-full h-full object-cover transform scale-110 transition-transform duration-500 group-hover:scale-115"
              alt="Isometric calendar and clock illustration representing scheduling efficiency"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCf1xa4agKEZn3AXBeMNCsF66kQmP0sI5gnVnNkTs8-WQ020ATzR9fxtYFOz4DtqZDyhFhGDwhiCFKOwIl2k7n234O47npbAMr6sN5cGyNrUcHTZ5Jhv9M3uqShOKPeB1lGQG6zrn1w3KpqFDPNXR-mnDb_ufURSq-S_RnwXFU2oCguRiXYPTP9kxPOrmMWm2OlRgkOXKUhaqwB4ZH7u6E-IuvOhwhBO124snIxNkSzhXTmLNPymMDqUIWr3fWcIgUEL0vYxgLI_A"
              fill
              sizes="320px"
              unoptimized
            />
            {/* Glassmorphic Overlay Card */}
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/85 backdrop-blur-md rounded-xl border border-white/20 shadow-lg transform translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{s.confirmed}</p>
                  <p className="font-label-lg text-label-lg text-on-surface font-semibold">{s.sampleAppointment}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-stack-sm max-w-[320px]">
          <h1 className="font-display-sm text-display-sm text-on-surface tracking-tight leading-tight">
            {s.welcomeTitle1}<br />
            <span className="text-primary font-bold">{s.welcomeTitle2}</span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {s.welcomeDesc}
          </p>
        </div>
      </section>

      {/* Footer sticky area */}
      <footer className="p-page-margin bg-surface z-20 shrink-0">
        <div className="space-y-6">
          {/* Features summary */}
          <div className="grid grid-cols-3 gap-2 py-4 border-t border-outline-variant">
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-primary text-2xl">bolt</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{s.featureFast}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-primary text-2xl">verified</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{s.featureReliable}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-primary text-2xl">security</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{s.featureSecure}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleGetStarted}
              disabled={isNavigating}
              className="w-full h-[52px] bg-primary text-white rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute inset-0 animate-shine pointer-events-none"></div>
              {isNavigating ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span>{s.getStarted}</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
            <button
              onClick={() => router.push("/bookings")}
              className="w-full py-3 text-on-surface-variant font-label-lg text-label-lg hover:text-primary transition-colors cursor-pointer"
            >
              {s.alreadyHaveAppointment}
            </button>
          </div>
        </div>
      </footer>
    </Screen>
  );
}
