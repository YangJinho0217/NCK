-- AlterTable
ALTER TABLE "room" ALTER COLUMN "code" SET DEFAULT ('RM' || upper(substr(md5(random()::text), 1, 8)));

-- CreateTable
CREATE TABLE "player" (
    "id" SERIAL NOT NULL,
    "login_id" VARCHAR(100) NOT NULL,
    "nick_name" VARCHAR(100) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_setting" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "league_id" VARCHAR(100),
    "tier" VARCHAR(20),
    "rank" VARCHAR(10),
    "puuid" VARCHAR(300),
    "total_play_game" INTEGER NOT NULL DEFAULT 0,
    "liked_position" JSONB NOT NULL DEFAULT '{"top": false, "jungle": false, "mid": false, "adc": false, "support": false, "allround": false}',
    "unliked_position" JSONB NOT NULL DEFAULT '{"top": false, "jungle": false, "mid": false, "adc": false, "support": false, "allround": false}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_login_id_idx" ON "player"("login_id");

-- CreateIndex
CREATE INDEX "player_setting_player_id_idx" ON "player_setting"("player_id");
