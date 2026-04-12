/*
  Warnings:

  - Added the required column `name` to the `room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "room" ADD COLUMN     "name" VARCHAR(100) NOT NULL,
ALTER COLUMN "code" SET DEFAULT ('RM' || upper(substr(md5(random()::text), 1, 8)));
