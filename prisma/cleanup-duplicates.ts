/**
 * Targeted cleanup for known ghost drafts + published duplicates.
 * Identified by prisma/inspect-suffix-posts.ts on 2026-05-19.
 *
 * Usage:
 *   Dry-run:  bunx tsx prisma/cleanup-duplicates.ts
 *   Apply:    bunx tsx prisma/cleanup-duplicates.ts --apply
 */

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"

dotenv.config()

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || "" }),
})

const apply = process.argv.includes("--apply")

// Ghost preview drafts — never real content, permanently delete
const GHOST_DRAFT_IDS = [
  "cmpbapk32000204l2lw2hmk1z", // cach-nau-chao-...-1 (DRAFT)
  "cmp8eve0f000204jmilwpxp1i", // toi-mau-xanh-...-2 (DRAFT)
  "cmp9v3yq2000204k0hwhr4ghl", // top-10-vien-duong-...-2 (DRAFT)
]

// Published duplicates — same content submitted twice; base slug is canonical.
// Soft-delete (trash) so you can verify before permanent removal.
const PUBLISHED_DUPLICATE_IDS = [
  "cmp8f0uxt000404jmp9n8kq57", // toi-mau-xanh-...-1 (PUBLISHED duplicate)
  "cmp9tzynf000004lajt2b19rv", // toi-tha-song-...-1 (PUBLISHED duplicate)
  "cmp9v64zu000404k066gtiuv7", // top-10-vien-duong-...-1 (PUBLISHED duplicate)
  "cmpbarpn3000404l248t6w6cu", // cach-nau-chao-...-3 (PUBLISHED duplicate)
]

async function main() {
  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN"}`)

  // --- Verify records exist before touching anything ---
  const ghosts = await prisma.post.findMany({
    where: { id: { in: GHOST_DRAFT_IDS } },
    select: { id: true, slug: true, editorialStatus: true, isDraft: true },
  })
  const dupes = await prisma.post.findMany({
    where: { id: { in: PUBLISHED_DUPLICATE_IDS } },
    select: { id: true, slug: true, editorialStatus: true, isPublished: true, category: { select: { slug: true } } },
  })

  console.log("\n--- Ghost drafts to permanently delete ---")
  for (const p of ghosts) {
    console.log(`  ${apply ? "DELETE" : "WOULD DELETE"}: ${p.slug} [${p.editorialStatus}]`)
  }

  console.log("\n--- Published duplicates to trash ---")
  for (const p of dupes) {
    console.log(`  ${apply ? "TRASH" : "WOULD TRASH"}: ${p.slug} [${p.editorialStatus}]`)
  }

  if (!apply) {
    console.log("\nRun with --apply to execute the above changes.")
    await prisma.$disconnect()
    return
  }

  // 1. Permanently delete ghost drafts
  if (ghosts.length > 0) {
    const result = await prisma.post.deleteMany({
      where: { id: { in: ghosts.map((p) => p.id) } },
    })
    console.log(`\n✅ Deleted ${result.count} ghost draft(s).`)
  }

  // 2. Soft-delete (trash) the published duplicates
  if (dupes.length > 0) {
    const result = await prisma.post.updateMany({
      where: { id: { in: dupes.map((p) => p.id) } },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isPublished: false,
        isFeatured: false,
        isTrending: false,
      },
    })
    console.log(`✅ Trashed ${result.count} published duplicate(s).`)
    console.log("\nAdd these redirects to next.config.mjs if needed:")
    for (const p of dupes) {
      const catSlug = p.category?.slug ?? "unknown"
      // derive base slug by stripping -N suffix
      const baseSlug = p.slug.replace(/-\d+$/, "")
      console.log(
        `  { source: "/${catSlug}/${p.slug}", destination: "/${catSlug}/${baseSlug}", permanent: true },`
      )
    }
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
