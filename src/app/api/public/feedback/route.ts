import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";
import { sendNotification } from "@/lib/notifications";

const publicFeedbackSchema = z.object({
  bookingId: z.string().min(1),
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

// Unauthenticated by design — the customer never logs in to leave feedback.
// A good score (>=4) triggers a Google review request automatically; a low
// score never does, per the PRD's reputation-management rule. Low scores
// surface to the agency instead via the dashboard's recent feedback list.
export async function POST(request: NextRequest) {
  try {
    const body = publicFeedbackSchema.parse(await request.json());

    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { customer: true, feedback: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.feedback) {
      return NextResponse.json({ error: "Feedback already submitted for this trip" }, { status: 409 });
    }

    const shouldRequestReview = body.overallRating >= 4;

    const feedback = await prisma.feedback.create({
      data: {
        agencyId: booking.agencyId,
        bookingId: booking.id,
        customerId: booking.customerId,
        overallRating: body.overallRating,
        hotelRating: body.hotelRating ?? null,
        driverRating: body.driverRating ?? null,
        guideRating: body.guideRating ?? null,
        activityRating: body.activityRating ?? null,
        cleanlinessRating: body.cleanlinessRating ?? null,
        punctualityRating: body.punctualityRating ?? null,
        staffRating: body.staffRating ?? null,
        whatWentWell: body.whatWentWell || null,
        whatCanImprove: body.whatCanImprove || null,
        wouldRecommend: body.wouldRecommend ?? null,
        reviewRequested: shouldRequestReview,
      },
    });

    if (shouldRequestReview) {
      const agency = await prisma.agency.findUnique({ where: { id: booking.agencyId } });
      const recipient = booking.customer.email || booking.customer.phone;
      if (recipient && agency?.googleReviewUrl) {
        await sendNotification({
          agencyId: booking.agencyId,
          channel: booking.customer.email ? "EMAIL" : "WHATSAPP",
          templateKey: "GOOGLE_REVIEW_REQUEST",
          recipient,
          bookingId: booking.id,
          variables: {
            customer_name: booking.customer.fullName,
            google_review_url: agency.googleReviewUrl,
          },
        });
      }
    }

    return NextResponse.json({ feedback, reviewRequested: shouldRequestReview }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
