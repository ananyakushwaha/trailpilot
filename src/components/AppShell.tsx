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
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/customers", label: "Customers" },
  { href: "/itineraries", label: "Itineraries", roles: ITINERARY_ROLES },
  { href: "/bookings", label: "Bookings", roles: BOOKING_VIEW_ROLES },
  { href: "/vendors", label: "Vendors", roles: OPERATIONS_ROLES },
  { href: "/analytics", label: "Analytics", roles: BOOKING_VIEW_ROLES },
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
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white sm:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <span className="text-lg font-semibold tracking-tight text-indigo-600">TrailOS</span>
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
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 text-xs font-medium text-slate-500 hover:text-red-600"
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
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 bg-slate-50 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
