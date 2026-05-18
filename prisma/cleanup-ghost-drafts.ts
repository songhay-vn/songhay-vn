/**
 * One-shot cleanup: delete orphaned preview ghost drafts.
 *
 * A ghost draft is a post created by "createPostForPreview" that was never
 * properly submitted — identifiable because:
 *   - Its slug ends in -N (e.g. "my-post-1", "my-post-2")
 *   - It is isDraft: true
 *   - A PUBLISHED post with the base slug (or a lower -N variant) already exists
 *
 * Usage:
 *   Dry-run:  bunx tsx prisma/cleanup-ghost-drafts.ts
 *   Apply:    bunx tsx prisma/cleanup-ghost-drafts.ts --apply
 */

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"

dotenv.config()

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || "" }),
})

const apply = process.argv.includes("--apply")

async function main() {
  console.log(`Mode: ${apply ? "APPLY (deleting from DB)" : "DRY-RUN (no changes)"}`)
  console.log("Fetching all posts...\n")

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      isDraft: true,
      isPublished: true,
      isDeleted: true,
      editorialStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  // Build slug → post map for lookup
  const slugMap = new Map<string, typeof posts[number]>()
  for (const p of posts) {
    slugMap.set(p.slug, p)
  }

  const toDelete: typeof posts = []
  const safe: typeof posts = []

  for (const post of posts) {
    // Only look at posts with a -N suffix
    const match = post.slug.match(/^(.*)-(\d+)$/)
    if (!match) continue

    const baseSlug = match[1]
    const basePost = slugMap.get(baseSlug)

    // Ghost draft: suffix post is a draft, base slug has a published article
    if (post.isDraft && !post.isDeleted && basePost && basePost.isPublished) {
      toDelete.push(post)
      console.log(
        `${apply ? "DELETE" : "WOULD DELETE"}: "${post.slug}" (draft) — real published article is "${baseSlug}"`
      )
    } else {
      safe.push(post)
    }
  }

  console.log(`\n--- Summary ---`)
  console.log(`Total posts checked: ${posts.length}`)
  console.log(`Ghost drafts found:  ${toDelete.length}`)
  console.log(`Left untouched:      ${posts.length - toDelete.length}`)

  if (toDelete.length === 0) {
    console.log("\nNothing to delete.")
    await prisma.$disconnect()
    return
  }

  if (!apply) {
    console.log("\nRun with --apply to permanently delete the above ghost drafts.")
    await prisma.$disconnect()
    return
  }

  // Delete ghost drafts permanently (no trash — they were never real posts)
  const ids = toDelete.map((p) => p.id)
  const result = await prisma.post.deleteMany({ where: { id: { in: ids } } })
  console.log(`\n✅ Deleted ${result.count} ghost draft(s).`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
