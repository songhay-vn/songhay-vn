-- CreateTable
CREATE TABLE "PenName" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "avatarPublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PenName_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PenName_normalizedName_key" ON "PenName"("normalizedName");

-- CreateIndex
CREATE INDEX "PenName_name_idx" ON "PenName"("name");

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "penNameId" TEXT;

-- Backfill PenName rows from legacy Post.penName snapshots.
WITH normalized_posts AS (
    SELECT
        btrim("penName") AS display_name,
        lower(regexp_replace(btrim("penName"), '\s+', ' ', 'g')) AS normalized_name
    FROM "Post"
    WHERE "penName" IS NOT NULL AND btrim("penName") <> ''
),
distinct_pen_names AS (
    SELECT DISTINCT ON (normalized_name)
        normalized_name,
        display_name
    FROM normalized_posts
    ORDER BY normalized_name, display_name
)
INSERT INTO "PenName" ("id", "name", "normalizedName")
SELECT
    'pen_' || substr(md5(normalized_name), 1, 24),
    display_name,
    normalized_name
FROM distinct_pen_names
ON CONFLICT ("normalizedName") DO NOTHING;

UPDATE "Post" AS p
SET "penNameId" = pn."id"
FROM "PenName" AS pn
WHERE
    p."penName" IS NOT NULL
    AND lower(regexp_replace(btrim(p."penName"), '\s+', ' ', 'g')) = pn."normalizedName";

-- CreateIndex
CREATE INDEX "Post_penNameId_idx" ON "Post"("penNameId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_penNameId_fkey" FOREIGN KEY ("penNameId") REFERENCES "PenName"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default permission for practical admin role.
INSERT INTO "RolePermission" ("id", "role", "action", "createdAt", "updatedAt")
VALUES ('rp_edit_pen_name_editor_in_chief', 'EDITOR_IN_CHIEF', 'edit-pen-name', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("role", "action") DO NOTHING;
