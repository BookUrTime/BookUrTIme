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
  const { language, switchRole } = useBooking();
  const activeLang = language || "en";
  const s = strings[activeLang];
  
  const tabs = [
    { key: "home", name: s.navHome || "Explore", icon: "explore", href: "/" },
    { key: "bookings", name: s.navBookings || "My Bookings", icon: "event_note", href: "/bookings" },
    { key: "business", name: "Business App", icon: "devices", href: "/business" },
    { key: "support", name: s.navSupport || "Support", icon: "support_agent", href: "https://wa.me/919876543210" },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-container-max mx-auto h-[72px] flex justify-around items-center px-2 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.06)] rounded-t-2xl z-50 border-t border-slate-200 select-none">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.key === "home" &&
            (pathname === "/" || pathname === "/slots" || pathname === "/providers" || pathname === "/service"));

        return (
          <Link
            key={tab.key}
            href={tab.href}
            onClick={() => {
              if (tab.key === "business") {
                switchRole("business");
              } else if (tab.key === "home" || tab.key === "bookings") {
                switchRole("guest");
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 min-touch-target transition duration-200 cursor-pointer ${
              isActive
                ? "bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 scale-95"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
            <span className="font-label-sm text-[11px] leading-none mt-1 font-medium">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
