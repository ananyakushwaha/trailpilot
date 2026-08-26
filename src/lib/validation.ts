import { z } from "zod";

export const leadSourceValues = [
  "INSTAGRAM",
  "REFERRAL",
  "WEBSITE",
  "WALK_IN",
  "WHATSAPP",
  "OTHER",
] as const;

export const leadStatusValues = [
  "NEW",
  "CONTACTED",
  "PROPOSAL_SENT",
  "NEGOTIATING",
  "WON",
  "LOST",
] as const;

export const leadInputSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  phone: z.string().min(6, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  destination: z.string().optional(),
  travelStartDate: z.string().optional().nullable(),
  travelEndDate: z.string().optional().nullable(),
  adults: z.coerce.number().int().min(1).default(1),
  children: z.coerce.number().int().min(0).default(0),
  budgetRange: z.string().optional(),
  hotelPreference: z.string().optional(),
  transportRequirement: z.string().optional(),
  source: z.enum(leadSourceValues).default("OTHER"),
  status: z.enum(leadStatusValues).default("NEW"),
  assignedToId: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
  internalNotes: z.string().optional(),
  lostReason: z.string().optional(),
});

export const customerInputSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(6, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  govIdType: z.string().optional(),
  govIdNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  foodPreference: z.string().optional(),
  hotelPreference: z.string().optional(),
  transportPreference: z.string().optional(),
  medicalNotes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export const vendorCategoryValues = [
  "HOTEL",
  "HOMESTAY",
  "DRIVER",
  "GUIDE",
  "ACTIVITY_PROVIDER",
  "TRANSPORT",
  "LOCAL_COORDINATOR",
] as const;

export const vendorInputSchema = z.object({
  name: z.string().min(2, "Vendor name is required"),
  category: z.enum(vendorCategoryValues),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional(),
  priceRangeNotes: z.string().optional(),
  gstDetails: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  paymentTerms: z.string().optional(),
  availabilityNotes: z.string().optional(),
  internalComments: z.string().optional(),
});

export const itineraryDayInputSchema = z.object({
  dayNumber: z.coerce.number().int().min(1),
  title: z.string().min(1),
  activities: z.string().optional().default(""),
  pickupDropNotes: z.string().optional(),
  hotelStay: z.string().optional(),
  inclusions: z.string().optional(),
  exclusions: z.string().optional(),
  importantInstructions: z.string().optional(),
});

export const itineraryInputSchema = z.object({
  title: z.string().min(2, "Title is required"),
  destination: z.string().min(1, "Destination is required"),
  numDays: z.coerce.number().int().min(1),
  numNights: z.coerce.number().int().min(0),
  travelStartDate: z.string().optional().nullable(),
  travelEndDate: z.string().optional().nullable(),
  travellerCount: z.coerce.number().int().min(1).default(1),
  budgetCategory: z.string().optional(),
  hotelCategory: z.string().optional(),
  tripType: z.string().optional(),
  interests: z.string().optional(),
  transportMode: z.string().optional(),
  specialNotes: z.string().optional(),
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "FINAL"]).default("DRAFT"),
  isTemplate: z.boolean().optional().default(false),
  days: z.array(itineraryDayInputSchema).default([]),
});

export const aiItineraryDraftInputSchema = z.object({
  destination: z.string().min(1),
  numDays: z.coerce.number().int().min(1),
  numNights: z.coerce.number().int().min(0),
  travellerCount: z.coerce.number().int().min(1).default(2),
  budgetCategory: z.string().optional(),
  hotelCategory: z.string().optional(),
  tripType: z.string().optional(),
  interests: z.string().optional(),
  transportMode: z.string().optional(),
  specialNotes: z.string().optional(),
});

export const bookingStatusValues = [
  "DRAFT",
  "QUOTATION_SENT",
  "CONFIRMED",
  "ADVANCE_RECEIVED",
  "VENDORS_ASSIGNED",
  "ACTIVE_TRIP",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const bookingInputSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  leadId: z.string().optional().nullable(),
  itineraryId: z.string().optional().nullable(),
  destination: z.string().min(1, "Destination is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  packageAmount: z.coerce.number().min(0),
  status: z.enum(bookingStatusValues).default("DRAFT"),
  internalNotes: z.string().optional(),
});

export const bookingVendorInputSchema = z.object({
  vendorId: z.string().min(1),
  agreedCost: z.coerce.number().min(0).optional().nullable(),
  advancePaid: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

export const paymentDirectionValues = ["CUSTOMER_IN", "VENDOR_OUT"] as const;
export const paymentMethodValues = ["CASH", "UPI", "BANK_TRANSFER", "RAZORPAY", "OTHER"] as const;

export const paymentInputSchema = z.object({
  direction: z.enum(paymentDirectionValues),
  bookingVendorId: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  method: z.enum(paymentMethodValues).default("CASH"),
  reference: z.string().optional(),
  note: z.string().optional(),
  paidAt: z.string().optional(),
});

export const feedbackInputSchema = z.object({
  overallRating: z.coerce.number().int().min(1).max(5),
  hotelRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  driverRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  guideRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  activityRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  cleanlinessRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  punctualityRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  staffRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  whatWentWell: z.string().optional(),
  whatCanImprove: z.string().optional(),
  wouldRecommend: z.boolean().optional().nullable(),
});
