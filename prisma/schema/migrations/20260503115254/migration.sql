-- AlterTable
ALTER TABLE "room" ALTER COLUMN "code" SET DEFAULT ('RM' || upper(substr(md5(random()::text), 1, 8)));

-- AddForeignKey
ALTER TABLE "player_setting" ADD CONSTRAINT "player_setting_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
