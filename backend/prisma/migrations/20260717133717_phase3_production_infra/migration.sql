-- CreateEnum
CREATE TYPE "VerificationTokenPurpose" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');

-- DropForeignKey
ALTER TABLE "moderation_cases" DROP CONSTRAINT "moderation_cases_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_reporterId_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_subjectId_fkey";

-- AlterTable
ALTER TABLE "photos" ADD COLUMN     "byteSizeBytes" INTEGER,
ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "thumbnailGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "thumbnailStorageKey" TEXT,
ADD COLUMN     "width" INTEGER;

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "purpose" "VerificationTokenPurpose" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_tokenHash_key" ON "verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "verification_tokens_userId_purpose_idx" ON "verification_tokens"("userId", "purpose");

-- CreateIndex
CREATE INDEX "audit_logs_subjectId_idx" ON "audit_logs"("subjectId");

-- CreateIndex
CREATE INDEX "blocks_blockedId_idx" ON "blocks"("blockedId");

-- Partial unique index: at most one primary photo per profile, enforced by the database
-- itself rather than only by ProfilesService.addPhoto()'s un-transacted update-then-create
-- sequence (a real race window — see SECURITY_AUDIT.md L-3 / DATABASE_AUDIT.md DB-6).
-- Prisma's schema DSL can't express a partial index, so this is hand-added here.
CREATE UNIQUE INDEX "photos_one_primary_per_profile" ON "photos"("profileId") WHERE "isPrimary" = true;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
