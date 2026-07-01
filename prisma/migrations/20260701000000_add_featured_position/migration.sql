ALTER TABLE "Post" ADD COLUMN "featuredPosition" INTEGER;

WITH ranked_featured AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      ORDER BY "publishedAt" DESC, "createdAt" DESC, "id" ASC
    ) AS "position"
  FROM "Post"
  WHERE "isFeatured" = true
    AND "isPublished" = true
    AND "isDeleted" = false
)
UPDATE "Post"
SET "featuredPosition" = ranked_featured."position"
FROM ranked_featured
WHERE "Post"."id" = ranked_featured."id"
  AND ranked_featured."position" BETWEEN 1 AND 6;

UPDATE "Post"
SET "isFeatured" = false
WHERE "isFeatured" = true
  AND "featuredPosition" IS NULL;

CREATE UNIQUE INDEX "Post_featuredPosition_key" ON "Post"("featuredPosition");
