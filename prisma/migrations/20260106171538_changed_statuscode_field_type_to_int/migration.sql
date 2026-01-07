/*
  Warnings:

  - The `statusCode` column on the `MonitorLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "MonitorLog" DROP COLUMN "statusCode",
ADD COLUMN     "statusCode" INTEGER;
