DROP INDEX IF EXISTS "Post_isDeleted_isPublished_views_publishedAt_idx";

ALTER TABLE "Post" DROP COLUMN IF EXISTS "views";
