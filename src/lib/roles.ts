import { UserRole } from "@/generated/prisma/client";

// Roles that may manage the agency profile, team members and billing.
export const AGENCY_ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "AGENCY_OWNER"];

// Roles that work leads day to day.
export const LEAD_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "AGENCY_OWNER",
  "SALES_EXECUTIVE",
];

// Roles that can see the full customer directory (not just their own trip).
export const CUSTOMER_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "AGENCY_OWNER",
  "SALES_EXECUTIVE",
  "OPERATIONS_EXECUTIVE",
];

// Roles that build itineraries and quotations.
export const ITINERARY_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "AGENCY_OWNER",
  "SALES_EXECUTIVE",
];

// Roles that run day-to-day operations: bookings, vendors, payments, checklists.
export const OPERATIONS_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "AGENCY_OWNER",
  "OPERATIONS_EXECUTIVE",
];

// Roles allowed to view bookings (ops + sales).
export const BOOKING_VIEW_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "AGENCY_OWNER",
  "SALES_EXECUTIVE",
  "OPERATIONS_EXECUTIVE",
];

// Roles allowed to create/edit bookings (a sales exec converts a won lead
// into a booking; ops then runs it day to day).
export const BOOKING_WRITE_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "AGENCY_OWNER",
  "SALES_EXECUTIVE",
  "OPERATIONS_EXECUTIVE",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  AGENCY_OWNER: "Agency Owner",
  SALES_EXECUTIVE: "Sales Executive",
  OPERATIONS_EXECUTIVE: "Operations Executive",
  HOTEL_PARTNER: "Hotel Partner",
  DRIVER_GUIDE: "Driver / Guide",
  CUSTOMER_PORTAL_USER: "Customer",
};

// Roles an Agency Owner is allowed to create from the team management screen.
export const INVITABLE_STAFF_ROLES: UserRole[] = [
  "AGENCY_OWNER",
  "SALES_EXECUTIVE",
  "OPERATIONS_EXECUTIVE",
  "HOTEL_PARTNER",
];
