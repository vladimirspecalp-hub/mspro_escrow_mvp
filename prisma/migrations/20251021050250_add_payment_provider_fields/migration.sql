-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'mock',
ADD COLUMN     "provider_payment_id" TEXT,
ADD COLUMN     "provider_transaction_id" TEXT;
