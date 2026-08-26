CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PREMIUM');
ALTER TABLE "agencies" ADD COLUMN "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE';
