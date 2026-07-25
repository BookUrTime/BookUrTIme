"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../../../context/BookingContext";
import { Screen } from "../../../components/UI";
import { formatDate } from "../../../lib/formatDate";

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { bookings, cancelAppointment } = useBooking();
  const [confirmCancelId, setConfirmCancelId] = useState("");

  const serviceIcons = {
    hospital: "local_hospital",
    aadhaar: "fingerprint",
    bank: "account_balance",
  };



  // Status badge helper
  const getStatusBadge = () => {
    return (
      <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
        Confirmed
      </span>
    );
  };

  // Stats calculation
  const totalBookings = bookings.length;
  const todayBookings = bookings.filter((b) => {
    if (!b.date) return true;
    return new Date(b.date).toDateString() === new Date().toDateString();
  }).length;
  const uniqueProviders = new Set(bookings.map((b) => b.providerId)).size;

  return (
    <Screen className="flex flex-col min-h-screen bg-background relative overflow-x-hidden p-0 max-w-container-max mx-auto">
      {/* Top App Bar */}
      <header className="bg-surface sticky top-0 w-full max-w-container-max mx-auto h-16 z-50 flex items-center justify-between px-page-margin border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">admin_panel_settings</span>
          </div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Provider Dashboard</h1>
        </div>
        <button
          onClick={() => router.push("/provider/login")}
          className="text-on-surface-variant hover:text-primary transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-page-margin pb-8 pt-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-stack-lg">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 text-center">
            <p className="font-display-sm text-[28px] text-primary font-bold">{totalBookings}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Total</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 text-center">
            <p className="font-display-sm text-[28px] text-secondary font-bold">{todayBookings}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Today</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 text-center">
            <p className="font-display-sm text-[28px] text-tertiary font-bold">{uniqueProviders}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Providers</p>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-stack-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-stack-sm">All Appointments</h2>
          <p className="font-body-md text-on-surface-variant">
            Manage queue tokens and patient bookings across all providers.
          </p>
        </div>

        {/* Appointments Table */}
        {bookings.length > 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 bg-surface-container-low border-b border-outline-variant/30">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Patient</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Provider</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Token</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Time</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Status</span>
            </div>

            {/* Rows */}
            {bookings.map((booking) => {
              const icon = serviceIcons[booking.providerType] || "local_hospital";
              return (
                <div
                  key={booking.id}
                  className="flex flex-col sm:grid sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 sm:gap-4 px-5 py-4 border-b border-outline-variant/20 last:border-b-0 hover:bg-surface-container-low/50 transition-colors"
                >
                  {/* Patient */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                      <span className="material-symbols-outlined text-lg">person</span>
                    </div>
                    <div>
                      <p className="font-label-lg text-on-surface font-semibold">{booking.name || "Guest User"}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{formatDate(booking.date)}</p>
                    </div>
                  </div>

                  {/* Provider */}
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
                    <div>
                      <p className="font-label-lg text-on-surface">{booking.providerName}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant capitalize">{booking.providerType}</p>
                    </div>
                  </div>

                  {/* Token */}
                  <div className="flex items-center">
                    <span className="font-label-lg text-on-surface font-extrabold tracking-tight">{booking.token}</span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center">
                    <span className="font-label-lg text-on-surface">{booking.slot}</span>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    {confirmCancelId === booking.id ? (
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => setConfirmCancelId("")}
                          className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant border border-outline-variant hover:bg-surface-container-high rounded-lg transition cursor-pointer"
                        >
                          No
                        </button>
                        <button
                          onClick={() => {
                            cancelAppointment(booking.id);
                            setConfirmCancelId("");
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-on-error bg-error hover:opacity-90 rounded-lg transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        {getStatusBadge()}
                        <button
                          onClick={() => setConfirmCancelId(booking.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container transition-colors cursor-pointer"
                          title="Remove booking"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant text-center flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-outline text-5xl">inbox</span>
            <div>
              <h3 className="font-bold text-on-surface text-lg">No bookings yet</h3>
              <p className="text-sm text-on-surface-variant mt-1 max-w-xs mx-auto">
                Patient bookings will appear here once appointments are scheduled.
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="mt-2 bg-primary text-on-primary px-6 py-3 rounded-full font-semibold shadow-md hover:opacity-95 active:scale-[0.98] transition duration-150 cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">open_in_new</span>
              <span>Open Patient Booking</span>
            </button>
          </div>
        )}
      </main>
    </Screen>
  );
}
