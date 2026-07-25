"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useBooking } from "../../context/BookingContext";
import { Screen, BottomNavBar } from "../../components/UI";
import { serviceTypes } from "../../lib/dummyData";

export default function ServicePage() {
  const router = useRouter();
  const { serviceType, setServiceType } = useBooking();
  const [selected, setSelected] = useState(serviceType || "");

  const handleCardSelect = (type) => {
    setSelected(type);
    
    // Add interactive ripple-like visual feedback
    const activeBtn = document.getElementById(`service-btn-${type}`);
    if (activeBtn) {
      const ripple = document.createElement("div");
      ripple.className = "absolute inset-0 bg-primary/5 rounded-2xl pointer-events-none animate-ping";
      activeBtn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 400);
    }
  };

  const handleContinue = () => {
    if (selected) {
      setServiceType(selected);
      router.push("/providers");
    }
  };

  // Use imported serviceTypes as single source of truth
  const categories = serviceTypes;

  return (
    <Screen className="flex flex-col min-h-screen bg-background relative overflow-x-hidden p-0 max-w-container-max mx-auto">
      {/* Top App Bar Header */}
      <header className="bg-surface fixed top-0 w-full max-w-container-max mx-auto h-16 z-50 flex items-center justify-between px-page-margin border-b border-outline-variant/10">
        <button
          onClick={() => router.push("/language")}
          className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-100 flex items-center justify-center p-2 min-touch-target cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">BookUrTime</h1>
        <div className="w-12"></div> {/* Spacer balance */}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow pt-24 pb-32 px-page-margin">
        {/* Headings */}
        <div className="mb-stack-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">What do you need to book?</h2>
          <p className="text-on-surface-variant mt-2 font-body-md text-body-md">
            Select a category to see available service providers in your area.
          </p>
        </div>

        {/* Categories list */}
        <div className="grid grid-cols-1 gap-gutter">
          {categories.map((cat) => {
            const isActive = selected === cat.type;
            return (
              <button
                key={cat.type}
                id={`service-btn-${cat.type}`}
                onClick={() => handleCardSelect(cat.type)}
                className={`group relative flex items-start gap-4 p-5 bg-white border rounded-2xl text-left transition-all duration-200 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary min-h-[112px] cursor-pointer ${
                  isActive ? "service-card-active ring-2 ring-primary border-primary" : "border-outline-variant"
                }`}
              >
                {/* Icon wrapper */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${cat.iconBg}`}>
                  <span className="material-symbols-outlined text-[28px]">{cat.icon}</span>
                </div>
                {/* Text details */}
                <div className="flex-grow">
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-1 font-semibold">
                    {cat.label}
                  </h3>
                  <p className="text-on-surface-variant font-body-md text-body-md leading-snug">
                    {cat.desc}
                  </p>
                </div>
                {/* Arrow */}
                <div className="self-center min-h-[48px] flex items-center shrink-0">
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Atmospheric Office Building Illustration */}
        <div className="mt-12 opacity-80 select-none">
          <div className="w-full h-48 rounded-3xl overflow-hidden relative grayscale-[0.2]">
            <Image
              className="w-full h-full object-cover"
              alt="Clean architectural minimalist office building facade represent trust and reliability"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXWLMTa3LpJjLp2BS2RflJcN_E9zCQqnC0uHnX6r0FrJEqGucbsNCf_psfQoTrjUmWPoktH7fLlZ-PIkZ6JPSuuSkexzTs-CCyrqH_DmgjRo-0au8tN-YWASzgkfuN_EV7RA4kHwMM-2Uf9trXFvxpd-hbhNi0n3bMKeiEEGjq8Ps_qW0B4br__ieoRwb9V1s9vctpsUStHqojG40wb33N3KVS6iu9mxIXCi18TXuFB3vEzqJYEOAq0amAjpbB49w1je6jcFJvqg"
              fill
              sizes="(max-width: 448px) 100vw, 448px"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Continue Button */}
      <footer className="fixed bottom-16 left-0 right-0 w-full max-w-container-max mx-auto bg-surface-container-lowest/80 backdrop-blur-md px-page-margin py-4 border-t border-outline-variant/30 flex flex-col gap-2 z-[40]">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full h-[52px] bg-primary text-white rounded-full font-label-lg text-label-lg shadow-md hover:bg-opacity-95 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>Continue</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </footer>

      {/* Persistent Navigation bar */}
      <BottomNavBar />
    </Screen>
  );
}
