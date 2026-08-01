-- DropForeignKey
ALTER TABLE "PostHistory" DROP CONSTRAINT "PostHistory_actorId_fkey";

-- DropForeignKey
ALTER TABLE "PostHistory" DROP CONSTRAINT "PostHistory_postId_fkey";

-- DropTable
DROP TABLE "PostHistory";

