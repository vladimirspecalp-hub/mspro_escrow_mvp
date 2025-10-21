-- AlterEnum
ALTER TYPE "DealStatus" ADD VALUE 'PENDING_REVIEW';

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "action_context" JSONB,
ADD COLUMN     "user_agent" TEXT;
