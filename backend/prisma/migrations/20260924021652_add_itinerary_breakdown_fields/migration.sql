-- AlterTable
ALTER TABLE "itineraries" ADD COLUMN     "accommodationTier" TEXT,
ADD COLUMN     "carbonBreakdown" JSONB,
ADD COLUMN     "costBreakdown" JSONB,
ADD COLUMN     "transportMode" TEXT;
