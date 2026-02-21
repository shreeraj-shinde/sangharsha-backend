-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "confidenceScore" DOUBLE PRECISION,
ADD COLUMN     "parsedData" JSONB,
ADD COLUMN     "parsingMethod" TEXT,
ADD COLUMN     "rawText" TEXT;
