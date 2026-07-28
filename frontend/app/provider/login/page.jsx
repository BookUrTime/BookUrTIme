"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../../../context/BookingContext";
import { Screen } from "../../../components/UI";

export default function ProviderLoginPage() {
  const router = useRouter();
  const { switchRole } = useBooking();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      setIsLoading(true);
      // Demo: any credentials pass after a brief delay
      setTimeout(() => {
        switchRole("provider", router);
      }, 800);
    }
  };

  return (
    <Screen className="flex flex-col min-h-screen bg-background relative overflow-hidden p-0 max-w-container-max mx-auto">
      {/* Background Ornaments */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary opacity-[0.03] rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-secondary opacity-[0.03] rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="pt-12 pb-8 px-page-margin shrink-0">
        <div className="flex flex-col gap-2">
          <span className="font-label-lg text-label-lg text-primary tracking-widest font-bold">PROVIDER PORTAL</span>
          <h1 className="font-display-sm text-display-sm text-on-surface">Sign in to your dashboard</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage your queue, view appointments, and track guest flow.
          </p>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-grow px-page-margin flex flex-col justify-center">
        <form onSubmit={handleLogin} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-5">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-on-primary-container text-[32px]">admin_panel_settings</span>
          </div>

          <div>
            <label className="block font-label-lg text-label-lg mb-1 ml-1 text-on-surface-variant font-semibold">
              Email / Provider ID
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-surface-bright border border-outline-variant rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-on-surface font-semibold"
              placeholder="provider@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block font-label-lg text-label-lg mb-1 ml-1 text-on-surface-variant font-semibold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-surface-bright border border-outline-variant rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-on-surface font-semibold"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={!email.trim() || !password.trim() || isLoading}
            className="w-full h-[52px] bg-primary text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">login</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-6 opacity-60">
          Demo mode — any credentials will grant access.
        </p>
      </main>

      {/* Footer */}
      <footer className="p-page-margin pb-12 shrink-0">
        <button
          onClick={() => switchRole("guest", router)}
          className="w-full text-center font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          ← Back to booking
        </button>
      </footer>
    </Screen>
  );
}
