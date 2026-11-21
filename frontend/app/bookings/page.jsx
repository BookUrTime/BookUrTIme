"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../../context/BookingContext";
import { Screen, BottomNavBar } from "../../components/UI";
import { providers } from "../../lib/dummyData";
import { formatDate } from "../../lib/formatDate";
import { strings } from "../../lib/strings";

export default function BookingsPage() {
  const router = useRouter();
  const { isHydrated, bookings, cancelAppointment, viewBookingDetails, language } = useBooking();
  const activeLang = language || "en";
  const s = strings[activeLang];
  const [confirmCancelId, setConfirmCancelId] = useState("");

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const handleViewTicket = (id) => {
    viewBookingDetails(id);
    router.push("/confirmation");
  };

  const handleStartBooking = () => {
    router.push("/service");
  };

  const providerTypeLabels = {
    hospital: { en: "Hospital", hi: "अस्पताल", te: "ఆసుపత్రి", ta: "மருத்துவமனை", bn: "হাসপাতাল", ur: "ہسپتال" },
    aadhaar: { en: "Aadhaar", hi: "आधार", te: "ఆధార్", ta: "ஆதார்", bn: "আধার", ur: "آدھار" },
    bank: { en: "Bank", hi: "बैंक", te: "బ్యాంక్", ta: "வங்கி", bn: "ব্যাংক", ur: "بینک" },
  };

  const serviceIcons = {
    hospital: "local_hospital",
    aadhaar: "fingerprint",
    bank: "account_balance",
  };

  const getWaitBadgeClass = (providerType, providerId) => {
    // Look up actual wait time from provider data
    const prov = providers.find((p) => p.id === providerId);
    const minutes = prov ? prov.waitMinutes : 20;
    if (minutes < 15) {
      return "bg-secondary-container text-on-secondary-container";
    } else if (minutes <= 30) {
      return "bg-tertiary-container/10 text-tertiary";
    } else {
      return "bg-error-container text-on-error-container";
    }
  };

  // Use shared formatDate utility
  const formatBookingDate = (dateString) => {
    return formatDate(dateString);
  };

  return (
    <Screen className="flex flex-col min-h-screen bg-slate-50 relative overflow-x-hidden p-0 w-full">
      {/* Top App Bar Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 w-full border-b border-slate-200/80 z-50">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 tracking-tight text-xl">{s.brandName}</span>
          </div>
          <button
            onClick={handleStartBooking}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl active:scale-95 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-600/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base font-bold">add_circle</span>
            <span>{s.bookNew}</span>
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-32 pt-6">
        {/* Headings */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            {s.myBookings}
          </h2>
          <p className="text-sm text-slate-500">
            {s.bookingsDesc}
          </p>
        </div>

        {/* Dynamic Appointments List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings && bookings.length > 0 ? (
            bookings.map((booking) => {
              const icon = serviceIcons[booking.providerType] || "local_hospital";
              const prov = providers.find((p) => p.id === booking.providerId);
              const waitMinutes = prov ? prov.waitMinutes : null;
              const waitBadgeClass = getWaitBadgeClass(booking.providerType, booking.providerId);
              return (
                <div
                  key={booking.id}
                  onClick={() => handleViewTicket(booking.id)}
                  className="bg-white rounded-2xl p-5 border border-outline-variant/60 shadow-sm hover:border-primary transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top Row: Provider & Token */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">{icon}</span>
                      </div>
                      <div>
                        <h3 className="font-headline-md text-[18px] text-on-surface font-semibold group-hover:text-primary transition-colors leading-tight">
                          {booking.providerName}
                        </h3>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                          {providerTypeLabels[booking.providerType]?.[activeLang] || providerTypeLabels[booking.providerType]?.en || booking.providerType}
                        </p>
                        {booking.serviceName && (
                          <span className="inline-block text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded mt-1">
                            {booking.serviceName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-primary block leading-none mb-1">
                          {s.tokenLabel}
                        </span>
                        <span className="font-extrabold text-slate-900 text-lg leading-none">
                          {booking.token}
                        </span>
                      </div>
                      {waitMinutes !== null && (
                        <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${waitBadgeClass}`}>
                          {waitMinutes} {s.min}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Appointment Details */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 text-sm mt-2 select-none">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-medium block">{s.dateLabel}</span>
                      <strong className="text-slate-800 font-semibold">{formatBookingDate(booking.date)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-medium block">{s.timeSlotLabel}</span>
                      <strong className="text-slate-800 font-semibold">{booking.slot}</strong>
                    </div>
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="flex gap-3 justify-end mt-4">
                    {confirmCancelId === booking.id ? (
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-red-600 font-medium mr-1 select-none">{s.cancelThisQuestion}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmCancelId("");
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                        >
                          {s.noBtn}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await cancelAppointment(booking.id);
                              setConfirmCancelId("");
                            } catch (error) {
                              alert(error.message || "Unable to cancel this booking.");
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition cursor-pointer"
                        >
                          {s.yesCancelBtn}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card details navigation
                            setConfirmCancelId(booking.id);
                          }}
                          className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition duration-150 cursor-pointer"
                        >
                          {s.cancelBtn}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTicket(booking.id);
                          }}
                          className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl shadow-sm hover:opacity-95 active:scale-[0.98] transition duration-150 cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">confirmation_number</span>
                          {s.viewTicket}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State Card */
            <div className="bg-white rounded-2xl p-8 border border-outline-variant text-center flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-slate-300 text-5xl">event_busy</span>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{s.noActiveBookingsTitle}</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                 {s.noActiveBookingsDesc}
                </p>
              </div>
              <button
                onClick={handleStartBooking}
                className="mt-2 bg-primary text-white px-6 py-3 rounded-full font-semibold shadow-md hover:opacity-95 active:scale-98 transition duration-150 cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>{s.startBookingNow}</span>
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
