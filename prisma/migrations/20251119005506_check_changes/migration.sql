-- AlterTable
ALTER TABLE "public"."StoreCustomer" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "preferredContact" TEXT;
