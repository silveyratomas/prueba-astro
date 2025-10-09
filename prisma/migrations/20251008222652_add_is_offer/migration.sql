-- AlterTable
ALTER TABLE "public"."Category" ADD COLUMN     "isOffer" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "isOffer" BOOLEAN NOT NULL DEFAULT false;
