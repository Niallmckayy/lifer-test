-- AlterTable
ALTER TABLE "ChangeRequest" ADD COLUMN "draftPreviewUrl" TEXT;
ALTER TABLE "ChangeRequest" ADD COLUMN "githubBranch" TEXT;
ALTER TABLE "ChangeRequest" ADD COLUMN "githubPrNumber" INTEGER;
ALTER TABLE "ChangeRequest" ADD COLUMN "githubPrUrl" TEXT;

-- AlterTable
ALTER TABLE "Website" ADD COLUMN "githubBranch" TEXT DEFAULT 'main';
ALTER TABLE "Website" ADD COLUMN "githubRepo" TEXT;
ALTER TABLE "Website" ADD COLUMN "vercelProjectId" TEXT;
ALTER TABLE "Website" ADD COLUMN "vercelTeamId" TEXT;
