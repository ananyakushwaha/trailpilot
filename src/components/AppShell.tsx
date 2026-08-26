"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/generated/prisma/client";
import {
  AGENCY_ADMIN_ROLES,
  BOOKING_VIEW_ROLES,
  ITINERARY_ROLES,
  OPERATIONS_ROLES,
  ROLE_LABELS,
} from "@/lib/roles";

type NavItem = {
  href: string;
  label: string;
  roles?: UserRole[];
  premium?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["SUPER_ADMIN", "AGENCY_OWNER", "SALES_EXECUTIVE", "OPERATIONS_EXECUTIVE", "HOTEL_PARTNER"] },
  { href: "/leads", label: "Leads", roles: ["SUPER_ADMIN", "AGENCY_OWNER", "SALES_EXECUTIVE"] },
  { href: "/customers", label: "Customers", roles: ["SUPER_ADMIN", "AGENCY_OWNER", "SALES_EXECUTIVE", "OPERATIONS_EXECUTIVE"] },
  { href: "/itineraries", label: "Itineraries", roles: ITINERARY_ROLES },
  { href: "/bookings", label: "Bookings", roles: BOOKING_VIEW_ROLES },
  { href: "/vendors", label: "Vendors", roles: OPERATIONS_ROLES },
  { href: "/analytics", label: "Analytics", roles: BOOKING_VIEW_ROLES, premium: true },
  { href: "/upgrade", label: "Upgrade to Premium" },
  { href: "/agency", label: "Agency Settings", roles: AGENCY_ADMIN_ROLES },
];

export function AppShell({
  user,
  agencyName,
  children,
}: {
  user: { name: string; email: string; role: UserRole };
  agencyName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role),
  );

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-[#071a33] text-white sm:flex">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <span className="text-lg font-semibold tracking-tight text-white">✈ TrailOS<span className="text-blue-400">™</span></span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-300 hover:bg-blue-950/70 hover:text-white"
                }`}
              >
                <span className="flex items-center justify-between gap-2">{item.label}{item.premium && <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">Pro</span>}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 text-xs font-medium text-slate-400 hover:text-red-300"
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="sm:hidden text-lg font-semibold text-indigo-600">TrailOS</div>
          <span className="text-sm font-medium text-slate-500">{agencyName}</span>
        </header>
        <nav className="flex gap-4 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 text-sm sm:hidden">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap font-medium ${
                pathname.startsWith(item.href) ? "text-indigo-700" : "text-slate-500"
              }`}
            >
                {item.label}{item.premium && <span className="ml-1 text-[9px] text-amber-600">PRO</span>}
            </Link>
          ))}
        </nav>
        <main className="flex-1 bg-slate-50 px-4 py-6 sm:px-8"><div className="min-h-[calc(100vh-8rem)]">{children}</div><footer className="mt-10 border-t border-slate-200 py-4 text-center text-xs text-slate-400">Powered by <span className="font-semibold text-slate-500">TrailPilot™</span></footer></main>
      </div>
    </div>
  );
}
