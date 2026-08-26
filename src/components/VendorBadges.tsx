export const VENDOR_CATEGORY_LABELS: Record<string, string> = {
  HOTEL: "Hotel",
  HOMESTAY: "Homestay",
  DRIVER: "Driver",
  GUIDE: "Guide",
  ACTIVITY_PROVIDER: "Activity Provider",
  TRANSPORT: "Transport",
  LOCAL_COORDINATOR: "Local Coordinator",
};

export const VENDOR_CATEGORY_OPTIONS = Object.entries(VENDOR_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function VendorCategoryBadge({ category }: { category: string }) {
  return (
    <span className="badge bg-slate-100 text-slate-700">
      {VENDOR_CATEGORY_LABELS[category] ?? category}
    </span>
  );
}
