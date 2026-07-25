import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBooking } from "../context/BookingContext";
import { strings } from "../lib/strings";

export function Card({ children, className = "", ...props }) {
  return <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 ${className}`} {...props}>{children}</div>;
}

export function Button({ children, className = "", ...props }) {
  return <button className={`rounded-2xl bg-primary px-5 py-3.5 font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 ${className}`} {...props}>{children}</button>;
}

export function Screen({ children, className = "" }) {
  const { language } = useBooking();
  const isRtl = language === "ur";
  return <main dir={isRtl ? "rtl" : "ltr"} className={`min-h-screen bg-background p-0 ${className}`}>{children}</main>;
}

export function BottomNavBar() {
  const pathname = usePathname();
  const { language } = useBooking();
  const activeLang = language || "en";
  const s = strings[activeLang];
  
  const tabs = [
    { key: "home", name: s.navHome, icon: "home", href: "/service" },
    { key: "bookings", name: s.navBookings, icon: "event_note", href: "/bookings" },
    { key: "support", name: s.navSupport, icon: "support_agent", href: "#" },
    { key: "account", name: s.navAccount, icon: "person", href: "#" },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-container-max mx-auto flex justify-around items-center px-4 py-3 pb-6 bg-surface-container-lowest shadow-[0_-4px_12px_rgba(0,0,0,0.04)] rounded-t-2xl z-50 border-t border-outline-variant/30 select-none">
      {tabs.map((tab) => {
        // Tab is active if pathname matches exactly, or if Home is matched by subroutes
        const isActive = pathname === tab.href || (tab.key === "home" && (pathname === "/service" || pathname === "/providers" || pathname === "/slots"));
        
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`flex flex-col items-center justify-center p-2 min-touch-target transition duration-200 cursor-pointer ${
              isActive
                ? "bg-secondary-container text-on-secondary-container rounded-full px-4 py-1.5 scale-95"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
            <span className="font-label-sm text-label-sm mt-0.5">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
