"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../../context/BookingContext";
import { formatDate } from "../../lib/formatDate";
import { strings } from "../../lib/strings";
import { fetchLiveQueueApi } from "../../lib/api";

const today = () => new Date().toISOString().slice(0, 10);

export default function ConfirmationPage() {
  const router = useRouter();
  const {
    isHydrated,
    provider,
    slot,
    serviceType,
    selectedService,
    token,
    setToken,
    setProvider,
    setSlot,
    setServiceType,
    setSelectedService,
    name,
    bookings,
    activeBookingId,
    setActiveBookingId,
    language,
  } = useBooking();

  const activeLang = language || "en";
  const s = strings[activeLang];

  const [showReminder, setShowReminder] = useState(false);
  const [liveServingToken, setLiveServingToken] = useState(null);
  const [queuePos, setQueuePos] = useState(1);
  const canvasRef = useRef(null);

  // Active booking from list
  const activeBooking = bookings.find((b) => b.id === activeBookingId) || {};
  const serviceName =
    activeBooking.serviceName ||
    selectedService?.name ||
    "General Counter Service";

  // Generate fallback token if missing
  useEffect(() => {
    if (provider && !token) {
      const serviceTypeMap = { hospital: "HC", aadhaar: "AK", bank: "SB" };
      const type = provider.type || serviceType || "hospital";
      const prefix = serviceTypeMap[type] || "HC";
      const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
      setToken(`${prefix}-${randomDigits}`);
    }
  }, [provider, serviceType, token, setToken]);

  // WhatsApp bubble delay
  useEffect(() => {
    if (provider && slot) {
      const timer = setTimeout(() => setShowReminder(true), 700);
      return () => clearTimeout(timer);
    }
  }, [provider, slot]);

  // Live Queue Polling for this token
  useEffect(() => {
    if (!provider?.id) return;
    const fetchQueue = async () => {
      try {
        const data = await fetchLiveQueueApi(provider.id, today());
        if (data?.currentlyServing?.token) {
          setLiveServingToken(data.currentlyServing.token);
        }
        if (data?.waitingList && token) {
          const idx = data.waitingList.findIndex((b) => b.token === token);
          if (idx !== -1) setQueuePos(idx + 1);
        }
      } catch {}
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [provider?.id, token]);

  // Confetti Burst Animation
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

    const colors = ["#004ac6", "#006e2d", "#824500", "#ffd700", "#ff6b6b", "#4ecdc4"];
    const particles = [];
    const particleCount = 70;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14 - 4,
        gravity: 0.25,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.4 ? "circle" : "strip",
      });
    }

    let startTime = Date.now();
    const duration = 2200;

    function updateConfetti() {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const globalOpacity = 1 - elapsed / duration;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
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
        } else {
          ctx.fillRect(-p.size / 4, -p.size, p.size / 2, p.size * 1.8);
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

  const handleReturnHome = () => {
    setActiveBookingId("");
    setProvider(null);
    setSlot("");
    setServiceType("");
    if (setSelectedService) setSelectedService(null);
    setToken("");
    router.push("/");
  };

  const generateGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Appointment: ${serviceName} at ${provider?.name}`);
    const details = encodeURIComponent(
      `Queue Token: ${token}\nProvider: ${provider?.name}\nAddress: ${provider?.address}\nBooked via BookUrTime`
    );
    const location = encodeURIComponent(provider?.address || "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
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

  if (!provider || !slot) {
    return (
      <div className="max-w-container-max mx-auto confirmation-canvas flex flex-col relative z-10 bg-transparent px-page-margin justify-center items-center text-center min-h-screen">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[40px] text-amber-600">info</span>
        </div>
        <h1 className="font-display-sm text-display-sm text-on-surface mb-2">{s.noActiveBooking}</h1>
        <p className="text-on-surface-variant font-body-md mb-8">{s.noActiveBookingDesc}</p>
        <button
          onClick={handleReturnHome}
          className="w-full max-w-xs h-[52px] bg-primary text-on-primary font-label-lg rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined">home</span>
          {s.returnToHome}
        </button>
      </div>
    );
  }

  const providerTypeLabels = {
    hospital: { en: "Hospital & Clinic", hi: "अस्पताल", te: "ఆసుపత్రి", ta: "மருத்துவமனை", bn: "হাসপাতাল", ur: "ہسپتال" },
    aadhaar: { en: "Aadhaar Kendra", hi: "आधार केंद्र", te: "ఆధార్", ta: "ஆதார்", bn: "আধার", ur: "آدھار" },
    bank: { en: "Bank Branch", hi: "बैंक", te: "బ్యాంక్", ta: "வங்கி", bn: "ব্যাংক", ur: "بینک" },
  };

  const serviceIcons = {
    hospital: "local_hospital",
    aadhaar: "fingerprint",
    bank: "account_balance",
  };
  const providerIcon = serviceIcons[provider.type] || "local_hospital";
  const typeKey = provider.type || serviceType;
  const displayType = providerTypeLabels[typeKey]?.[activeLang] || providerTypeLabels[typeKey]?.en || typeKey;

  return (
    <>
      <canvas ref={canvasRef} className="confetti-canvas"></canvas>

      <div className="max-w-container-max mx-auto confirmation-canvas flex flex-col relative z-10 bg-transparent">
        {/* Header */}
        <header className="flex items-center justify-between px-page-margin w-full max-w-container-max mx-auto h-16 bg-surface sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-headline-md">check_circle</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">{s.brandName}</span>
          </div>
          <button
            onClick={handleReturnHome}
            className="hover:opacity-85 active:scale-95 transition-all p-2 flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </header>

        <main className="flex-1 px-page-margin pt-6 pb-32 flex flex-col items-center">
          {/* Success Title */}
          <div className="flex flex-col items-center text-center mb-6 w-full">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-3 text-emerald-600">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">{s.bookingConfirmed}</h1>
            <p className="text-on-surface-variant text-sm mt-0.5">{s.bookingConfirmedDesc}</p>
          </div>

          {/* Token Ticket Card */}
          <div className="w-full bg-white border border-outline-variant rounded-2xl p-6 mb-5 shadow-sm text-center relative overflow-hidden">
            <span className="font-label-lg text-xs text-primary uppercase tracking-widest font-bold block mb-1">
              {s.queueToken}
            </span>
            <div className="text-5xl font-black text-slate-900 tracking-tight font-mono">
              {token || "..."}
            </div>

            {/* LIVE QUEUE TRACKER PILL */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs px-2">
                <span className="text-slate-500 font-medium">Currently Serving:</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {liveServingToken || "Next Guest"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs px-2">
                <span className="text-slate-500 font-medium">Your Position in Queue:</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  #{queuePos} in line ({queuePos > 1 ? `${queuePos - 1} ahead` : "You're next!"})
                </span>
              </div>
            </div>
          </div>

          {/* Details Bento */}
          <div className="w-full space-y-3 mb-6">
            {/* Facility & Service */}
            <div className="bg-slate-50 border border-outline-variant rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">{providerIcon}</span>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {serviceName}
                </p>
                <h3 className="font-bold text-base text-slate-900">{provider.name}</h3>
                <p className="text-xs text-slate-500">{displayType}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    provider.address || provider.name + ", New Delhi"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline mt-1.5"
                >
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span className="line-clamp-1">{provider.address || "Directions on Google Maps"}</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              </div>
            </div>

            {/* Date, Time & Desk */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-outline-variant rounded-2xl p-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{s.dateLabel}</p>
                <p className="font-bold text-sm text-slate-900">{formatDate()}</p>
              </div>
              <div className="bg-slate-50 border border-outline-variant rounded-2xl p-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{s.timeLabel}</p>
                <p className="font-bold text-sm text-slate-900">{slot}</p>
              </div>
            </div>

            {/* Guest Info */}
            <div className="bg-slate-50 border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{s.guestNameLabel}</p>
                <p className="font-bold text-sm text-slate-900">{name || activeBooking.name || "Guest User"}</p>
              </div>
              <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center material-symbols-outlined text-lg">
                person
              </span>
            </div>

            {/* Google Calendar Link Button */}
            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 shadow-sm transition"
            >
              <span className="material-symbols-outlined text-sm text-blue-600">event</span>
              Add to Google Calendar
            </a>
          </div>

          {/* WhatsApp Simulation Bubble */}
          <div
            className={`w-full mb-6 transition-all duration-700 ease-out ${
              showReminder ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="relative bg-[#D1FAE5] text-[#065F46] p-4 rounded-2xl rounded-br-none shadow-sm flex gap-3 items-start border border-[#A7F3D0]">
              <span className="material-symbols-outlined text-[#059669] shrink-0">chat</span>
              <p className="text-xs leading-relaxed">
                {s.whatsappPrefix} <strong className="font-bold">{provider.name}</strong> for{" "}
                <strong className="font-bold">{serviceName}</strong> at{" "}
                <strong className="font-bold">{slot}</strong>. Token:{" "}
                <strong className="font-bold font-mono">{token}</strong>.
              </p>
            </div>
            <div className="text-[10px] text-slate-400 text-right mt-1.5 font-medium">{s.justNow}</div>
          </div>
        </main>

        {/* Bottom Actions */}
        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-container-max bg-surface border-t border-outline-variant p-4 flex flex-col gap-2 z-50">
          <button
            onClick={handleReturnHome}
            className="w-full h-12 bg-primary text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            {s.bookAnother}
          </button>
        </footer>
      </div>
    </>
  );
}
