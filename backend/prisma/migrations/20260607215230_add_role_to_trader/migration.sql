-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TRADER', 'ADMIN');

-- AlterTable
ALTER TABLE "Trader" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'TRADER';
