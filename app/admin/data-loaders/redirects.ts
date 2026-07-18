import type { AdminTab } from "@/app/admin/data-types"
import { memoizeWithTtl } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors"

const ADMIN_CACHE_TTL_SECONDS = 10

export type RedirectRow = {
  id: string
  fromPath: string
  toPath: string
  isActive: boolean
  note: string | null
  createdAt: Date
}

/**
 * Backward-compat auto-heal: migrates posts that were set to DRAFT by the old version
 * of the redirect action (which used editorialStatus: "DRAFT") to the new shape
 * (editorialStatus: "PUBLISHED", isPublished: false, isDraft: false).
 *
 * This runs silently in the background on each redirects tab load.
 * It's a no-op once all posts are already in the new format.
 */
async function healLegacyRedirectedPosts(): Promise<void> {
  try {
    // Find all active redirects and collect their fromPaths
    const activeRedirects = await prisma.redirect.findMany({
      where: { isActive: true },
      select: { fromPath: true },
    })
    if (activeRedirects.length === 0) return

    // Parse each fromPath into (categorySlug, postSlug) pairs
    const pairs = activeRedirects
      .map((r) => {
        const parts = r.fromPath.split("/").filter(Boolean)
        return parts.length === 2 ? { categorySlug: parts[0], postSlug: parts[1] } : null
      })
      .filter((p): p is { categorySlug: string; postSlug: string } => p !== null)
    if (pairs.length === 0) return

    // Find posts in the old DRAFT state that match any active redirect fromPath
    const legacyPosts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        isDraft: true,
        editorialStatus: "DRAFT",
        OR: pairs.map(({ categorySlug, postSlug }) => ({
          slug: postSlug,
          category: { slug: categorySlug },
        })),
      },
      select: { id: true },
    })
    if (legacyPosts.length === 0) return

    // Migrate them to the new shape: stay in Published tab but hidden from public
    await prisma.post.updateMany({
      where: { id: { in: legacyPosts.map((p) => p.id) } },
      data: {
        editorialStatus: "PUBLISHED",
        isDraft: false,
        isPublished: false,
      },
    })
  } catch {
    // Best-effort: never let healing errors break the redirects tab
  }
}

export async function getRedirectsData(activeTab: AdminTab): Promise<RedirectRow[]> {
  if (activeTab !== "redirects") return []

  // Run auto-heal in background without blocking the data load
  void healLegacyRedirectedPosts()

  return memoizeWithTtl("admin:redirects", ADMIN_CACHE_TTL_SECONDS, async () => {
    return prisma.redirect
      .findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fromPath: true,
          toPath: true,
          isActive: true,
          note: true,
          createdAt: true,
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) return []
        throw error
      })
  })
}
