/**
 * One-shot migration: strip -N collision suffixes from post slugs.
 *
 * Usage:
 *   Dry-run (no DB writes):  bunx tsx prisma/fix-slug-suffixes.ts
 *   Apply:                   bunx tsx prisma/fix-slug-suffixes.ts --apply
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
  console.log(`Mode: ${apply ? "APPLY (writing to DB)" : "DRY-RUN (no changes)"}`)
  console.log("Fetching all posts...\n")

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      slug: true,
      isPublished: true,
      category: { select: { slug: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  // Build a quick slug → id map for collision detection against current DB state
  const slugMap = new Map<string, string>() // slug -> postId
  for (const p of posts) {
    slugMap.set(p.slug, p.id)
  }

  const fixed: Array<{
    id: string
    oldSlug: string
    newSlug: string
    categorySlug: string
    isPublished: boolean
  }> = []

  const skipped: Array<{ id: string; slug: string; reason: string }> = []

  for (const post of posts) {
    // Match slugs ending in -<digits> e.g. "my-post-2" or "my-post-123"
    const match = post.slug.match(/^(.*)-(\d+)$/)
    if (!match) continue

    const baseSlug = match[1]

    // Check if base slug is free (not used by a DIFFERENT post)
    const occupiedBy = slugMap.get(baseSlug)
    if (occupiedBy && occupiedBy !== post.id) {
      skipped.push({
        id: post.id,
        slug: post.slug,
        reason: `base slug "${baseSlug}" is occupied by another post (${occupiedBy})`,
      })
      continue
    }

    // Safe to take the base slug
    if (apply) {
      await prisma.post.update({
        where: { id: post.id },
        data: { slug: baseSlug },
      })
    }

    // Update our in-memory map so subsequent posts see the updated state
    slugMap.delete(post.slug)
    slugMap.set(baseSlug, post.id)

    fixed.push({
      id: post.id,
      oldSlug: post.slug,
      newSlug: baseSlug,
      categorySlug: post.category.slug,
      isPublished: post.isPublished,
    })

    console.log(
      `${apply ? "FIXED" : "WOULD FIX"}: "${post.slug}" → "${baseSlug}"${
        post.isPublished ? " [published]" : ""
      }`
    )
  }

  console.log(`\n--- Summary ---`)
  console.log(`Total posts checked:  ${posts.length}`)
  console.log(`Fixed (or would fix): ${fixed.length}`)
  console.log(`Skipped:              ${skipped.length}`)

  if (skipped.length > 0) {
    console.log("\n--- Skipped (legitimate collisions — left unchanged) ---")
    for (const s of skipped) {
      console.log(`  ${s.slug}: ${s.reason}`)
    }
  }

  const publishedFixed = fixed.filter((f) => f.isPublished)
  if (publishedFixed.length > 0) {
    console.log(
      "\n--- Add these redirects to next.config.mjs → redirects() ---"
    )
    console.log("// Paste inside the async redirects() array:\n")
    for (const f of publishedFixed) {
      console.log(
        `  { source: "/${f.categorySlug}/${f.oldSlug}", destination: "/${f.categorySlug}/${f.newSlug}", permanent: true },`
      )
    }
  } else {
    console.log(
      "\nNo published posts were affected — no redirects needed."
    )
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
