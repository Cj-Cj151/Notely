-- CreateEnum
CREATE TYPE "NoteCategory" AS ENUM ('GENERAL', 'JOURNAL', 'RESEARCH', 'DRAFT');

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "category" "NoteCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;
