-- AlterTable
ALTER TABLE "player_setting" ADD COLUMN     "game_nickname" VARCHAR(50),
ADD COLUMN     "game_tag" VARCHAR(20);

-- AlterTable
ALTER TABLE "room" ALTER COLUMN "code" SET DEFAULT ('RM' || upper(substr(md5(random()::text), 1, 8)));
