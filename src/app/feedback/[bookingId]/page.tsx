"use client";

import { use, useEffect, useState } from "react";

type PublicBooking = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  agencyName: string;
  customerName: string;
  alreadySubmitted: boolean;
  hasHotel: boolean;
  hasDriver: boolean;
  hasGuide: boolean;
  hasActivity: boolean;
};

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-slate-700">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-2xl ${n <= value ? "text-amber-400" : "text-slate-200"}`}
            aria-label={`${n} star`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PublicFeedbackPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [overallRating, setOverallRating] = useState(0);
  const [hotelRating, setHotelRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [guideRating, setGuideRating] = useState(0);
  const [activityRating, setActivityRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);
  const [whatWentWell, setWhatWentWell] = useState("");
  const [whatCanImprove, setWhatCanImprove] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/bookings/${bookingId}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setBooking(data.booking);
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (overallRating === 0) {
      setError("Please rate your overall experience.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          overallRating,
          hotelRating: hotelRating || null,
          driverRating: driverRating || null,
          guideRating: guideRating || null,
          activityRating: activityRating || null,
          cleanlinessRating: cleanlinessRating || null,
          punctualityRating: punctualityRating || null,
          staffRating: staffRating || null,
          whatWentWell,
          whatCanImprove,
          wouldRecommend,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit feedback");
        return;
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <CenteredMessage>Loading...</CenteredMessage>;
  }
  if (notFound || !booking) {
    return <CenteredMessage>We couldn&apos;t find this trip.</CenteredMessage>;
  }
  if (booking.alreadySubmitted || submitted) {
    return (
      <CenteredMessage>
        <h1 className="text-xl font-semibold text-slate-900">Thank you!</h1>
        <p className="mt-2 text-sm text-slate-600">
          {submitted && overallRating >= 4
            ? "We're so glad you enjoyed your trip. We've sent you a link to leave a Google review — thank you for supporting us!"
            : "Your feedback has been recorded. Thank you for helping us improve."}
        </p>
      </CenteredMessage>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-sm font-medium text-indigo-600">{booking.agencyName}</p>
        <h1 className="text-xl font-semibold text-slate-900">How was your trip?</h1>
        <p className="mt-1 text-sm text-slate-500">
          {booking.destination} · {booking.customerName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <StarRating label="Overall trip rating" value={overallRating} onChange={setOverallRating} />
        {booking.hasHotel && (
          <StarRating label="Hotel rating" value={hotelRating} onChange={setHotelRating} />
        )}
        {booking.hasDriver && (
          <StarRating label="Driver rating" value={driverRating} onChange={setDriverRating} />
        )}
        {booking.hasGuide && (
          <StarRating label="Guide rating" value={guideRating} onChange={setGuideRating} />
        )}
        {booking.hasActivity && (
          <StarRating label="Activity rating" value={activityRating} onChange={setActivityRating} />
        )}
        <StarRating label="Cleanliness" value={cleanlinessRating} onChange={setCleanlinessRating} />
        <StarRating label="Punctuality" value={punctualityRating} onChange={setPunctualityRating} />
        <StarRating label="Staff behaviour" value={staffRating} onChange={setStaffRating} />

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">What went well?</span>
          <textarea
            className="textarea"
            value={whatWentWell}
            onChange={(e) => setWhatWentWell(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">What can we improve?</span>
          <textarea
            className="textarea"
            value={whatCanImprove}
            onChange={(e) => setWhatCanImprove(e.target.value)}
          />
        </label>

        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Would you recommend us?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWouldRecommend(true)}
              className={wouldRecommend === true ? "btn-primary" : "btn-secondary"}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setWouldRecommend(false)}
              className={wouldRecommend === false ? "btn-primary" : "btn-secondary"}
            >
              No
            </button>
          </div>
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Submitting..." : "Submit feedback"}
        </button>
      </form>
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>{children}</div>
    </div>
  );
}
