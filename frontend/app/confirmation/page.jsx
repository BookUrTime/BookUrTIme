"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../../context/BookingContext";
import { formatDate } from "../../lib/formatDate";
import { strings } from "../../lib/strings";

export default function ConfirmationPage() {
  const router = useRouter();
  const {
    isHydrated,
    provider,
    slot,
    serviceType,
    token,
    setToken,
    setProvider,
    setSlot,
    setServiceType,
    name,
    setActiveBookingId,
    language,
  } = useBooking();

  const activeLang = language || "en";
  const s = strings[activeLang];

  const [showReminder, setShowReminder] = useState(false);
  const canvasRef = useRef(null);

  // Generate a token if missing and booking details exist
  useEffect(() => {
    if (provider && !token) {
      const serviceTypeMap = {
        hospital: "HC",
        aadhaar: "AK",
        bank: "SB",
      };
      const type = provider.type || serviceType || "hospital";
      const prefix = serviceTypeMap[type] || "HC";
      const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
      const generatedToken = `${prefix}-${randomDigits}`;
      setToken(generatedToken);
    }
  }, [provider, serviceType, token, setToken]);

  // Show WhatsApp reminder bubble after a short delay
  useEffect(() => {
    if (provider && slot) {
      const timer = setTimeout(() => {
        setShowReminder(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [provider, slot]);

  // Confetti Burst Animation Logic (Brief 2-second celebratory burst)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !provider || !slot) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const pieces = [];
    const numberOfPieces = 130;
    const colors = ["#2563EB", "#007230", "#824500", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
    const shapes = ["rect", "circle", "strip"];

    const originX = canvas.width / 2;
    const originY = canvas.height * 0.35;

    for (let i = 0; i < numberOfPieces; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 4;
      pieces.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 6,
        gravity: 0.25,
        drag: 0.97,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: Math.random() * 8 + 4,
      });
    }

    const startTime = performance.now();
    const DURATION = 2000; // Finish within 2 seconds

    function updateConfetti(currentTime) {
      const elapsed = currentTime - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (elapsed >= DURATION) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return; // Stop animation loop after 2 seconds
      }

      // Calculate smooth fade out in the last 600ms
      const globalOpacity = elapsed > 1400 ? Math.max(0, 1 - (elapsed - 1400) / 600) : 1;

      pieces.forEach((p) => {
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.globalAlpha = globalOpacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "strip") {
          ctx.fillRect(-p.size / 4, -p.size, p.size / 2, p.size * 1.8);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(updateConfetti);
    }

    animationFrameId = requestAnimationFrame(updateConfetti);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [provider, slot]);

  // Reset booking state and return home
  const handleBookAnother = () => {
    setActiveBookingId("");
    setProvider(null);
    setSlot("");
    setServiceType("");
    setToken("");
    router.push("/");
  };

  const handleReturnHome = () => {
    setActiveBookingId("");
    setProvider(null);
    setSlot("");
    setServiceType("");
    setToken("");
    router.push("/");
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

  // Fallback state if no active booking details exist
  if (!provider || !slot) {
    return (
      <div className="max-w-container-max mx-auto confirmation-canvas flex flex-col relative z-10 bg-transparent px-page-margin justify-center items-center text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[40px] text-amber-600">info</span>
        </div>
        <h1 className="font-display-sm text-display-sm text-on-surface mb-2">{s.noActiveBooking}</h1>
        <p className="text-on-surface-variant font-body-md mb-8">
          {s.noActiveBookingDesc}
        </p>
        <button
          onClick={handleReturnHome}
          className="w-full max-w-xs h-[52px] bg-primary text-on-primary font-label-lg rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md min-h-[48px] cursor-pointer"
        >
          <span className="material-symbols-outlined">home</span>
          {s.returnToHome}
        </button>
      </div>
    );
  }

  const providerTypeLabels = {
    hospital: { en: "Hospital", hi: "अस्पताल", te: "ఆసుపత్రి", ta: "மருத்துவமனை", bn: "হাসপাতাল", ur: "ہسپتال" },
    aadhaar: { en: "Aadhaar", hi: "आधार", te: "ఆధార్", ta: "ஆதார்", bn: "আধার", ur: "آدھار" },
    bank: { en: "Bank", hi: "बैंक", te: "బ్యాంక్", ta: "வங்கி", bn: "ব্যাংক", ur: "بینک" },
  };

  const serviceIcons = {
    hospital: "local_hospital",
    aadhaar: "badge",
    bank: "account_balance",
  };
  const providerIcon = serviceIcons[provider.type] || "local_hospital";
  const typeKey = provider.type || serviceType;
  const displayType = providerTypeLabels[typeKey]?.[activeLang] || providerTypeLabels[typeKey]?.en || typeKey;

  return (
    <>
      {/* Confetti Canvas */}
      <canvas ref={canvasRef} className="confetti-canvas"></canvas>

      <div className="max-w-container-max mx-auto confirmation-canvas flex flex-col relative z-10 bg-transparent">
        {/* Header */}
        <header className="flex items-center justify-between px-page-margin w-full max-w-container-max mx-auto h-16 bg-surface dark:bg-background sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-headline-md">check_circle</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">{s.brandName}</span>
          </div>
          <button
            onClick={handleReturnHome}
            className="hover:opacity-85 active:scale-95 transition-all duration-100 p-2 min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </header>

        <main className="flex-1 px-page-margin pt-8 pb-32 flex flex-col items-center">
          {/* Success Status Section */}
          <div className="flex flex-col items-center text-center mb-stack-lg w-full">
            <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mb-stack-md success-check-scale">
              <span
                className="material-symbols-outlined text-[48px] text-on-secondary-container"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <h1 className="font-display-sm text-display-sm text-on-surface mb-2">{s.bookingConfirmed}</h1>
            <p className="text-on-surface-variant font-body-md">{s.bookingConfirmedDesc}</p>
          </div>

          {/* Token Number Card */}
          <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 mb-stack-lg shadow-[0px_4px_12px_rgba(0,0,0,0.05)] text-center">
            <span className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-1 block">{s.queueToken}</span>
            <div className="font-display-sm text-[42px] leading-tight text-on-surface font-extrabold tracking-tight">
              {token || "..."}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 py-2 px-4 bg-surface-container-low rounded-full w-fit mx-auto">
              <span className="material-symbols-outlined text-secondary text-lg">timer</span>
              <span className="font-label-lg text-label-lg text-secondary">
                {s.estWaitLabel} {provider.waitMinutes || 12} {s.mins}
              </span>
            </div>
          </div>

          {/* Booking Summary Bento */}
          <div className="w-full grid grid-cols-1 gap-4 mb-stack-lg">
            {/* Provider & Service */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary-container">{providerIcon}</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">{s.providerServiceLabel}</p>
                <p className="font-headline-md text-headline-md text-on-surface">{provider.name}</p>
                <p className="font-body-md text-on-surface-variant">{displayType}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">{s.dateLabel}</p>
                <p className="font-label-lg text-label-lg text-on-surface">{formatDate()}</p>
              </div>
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">{s.timeLabel}</p>
                <p className="font-label-lg text-label-lg text-on-surface">{slot}</p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">{s.patientNameLabel}</p>
                <p className="font-label-lg text-label-lg text-on-surface">{name || "Guest User"}</p>
              </div>
              <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface-container-highest text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px]">person</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Notification Bubble */}
          <div
            className={`w-full mb-12 transition-all duration-700 ease-out ${
              showReminder ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="relative bg-[#D1FAE5] text-[#065F46] p-4 rounded-2xl rounded-br-none shadow-sm flex gap-3 items-start border border-[#A7F3D0]">
              <span className="material-symbols-outlined text-[#059669] shrink-0">chat</span>
              <p className="text-sm leading-relaxed">
                {s.whatsappPrefix} <strong className="font-bold">{provider.name}</strong> {s.whatsappMiddle} <strong className="font-bold">{slot}</strong>{s.whatsappSuffix} <strong className="font-bold">{token}</strong>{s.whatsappEnd}
              </p>
              <div className="whatsapp-bubble-tail" style={{ borderTopColor: "#D1FAE5", right: 0, bottom: "-8px" }}></div>
            </div>
            <div className="text-[10px] text-on-surface-variant text-right mt-2 font-medium opacity-60">{s.justNow}</div>
          </div>
        </main>

        {/* Sticky Bottom Actions */}
        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-container-max bg-surface border-t border-outline-variant p-6 flex flex-col gap-3 z-50">
          <button
            onClick={handleBookAnother}
            className="w-full h-[52px] bg-primary text-on-primary font-label-lg rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md min-h-[48px] cursor-pointer"
          >
            <span className="material-symbols-outlined">add_circle</span>
            {s.bookAnother}
          </button>
          <button
            onClick={handleReturnHome}
            className="w-full h-[52px] border border-outline text-on-surface font-label-lg rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-low active:scale-[0.98] transition-all min-h-[48px] cursor-pointer"
          >
            <span className="material-symbols-outlined">home</span>
            {s.returnToHome}
          </button>
        </footer>
      </div>
    </>
  );
}
