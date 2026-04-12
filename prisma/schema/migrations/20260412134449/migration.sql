-- CreateTable
CREATE TABLE "room" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL DEFAULT ('RM' || upper(substr(md5(random()::text), 1, 8))),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_code_key" ON "room"("code");
