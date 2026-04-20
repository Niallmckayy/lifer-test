-- AlterTable
ALTER TABLE "Client" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Client" ADD COLUMN "stripePriceId" TEXT;
ALTER TABLE "Client" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Client" ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'active';
