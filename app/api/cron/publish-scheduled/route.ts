import { NextResponse, connection } from "next/server"
import { prisma } from "@/lib/prisma"
import { clearDataCache } from "@/lib/data-cache"
import { revalidatePost } from "@/app/admin/actions-helpers"
import {
  enqueuePublishedPostSearchConsoleJobs,
  scheduleSearchConsoleDrain,
} from "@/lib/search-console-queue"

export async function GET(request: unknown) {
  await connection()
  const req = request as Request
  try {
    const authHeader = req.headers.get("authorization")
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    const postsToPublish = await prisma.post.findMany({
      where: {
        editorialStatus: "PENDING_PUBLISH",
        scheduledPublishAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        category: {
          select: {
            slug: true,
          }
        },
        slug: true,
      }
    })

    if (postsToPublish.length === 0) {
      return NextResponse.json({ message: "No posts to publish" })
    }

    await prisma.post.updateMany({
      where: {
        id: { in: postsToPublish.map(p => p.id) },
      },
      data: {
        editorialStatus: "PUBLISHED",
        isPublished: true,
        isDraft: false,
        publishedAt: new Date(),
        scheduledPublishAt: null, // Clear it out once published
      },
    })

    // Revalidate paths for all published posts
    for (const post of postsToPublish) {
      await revalidatePost(post.slug, post.category?.slug, {
        isVisibilityChange: true,
        warmPublicRoutes: true,
      })
      if (post.category?.slug) {
        await enqueuePublishedPostSearchConsoleJobs({
          postId: post.id,
          categorySlug: post.category.slug,
          slug: post.slug,
        })
      }
    }
    scheduleSearchConsoleDrain()
    
    clearDataCache()

    return NextResponse.json({ 
      message: `Published ${postsToPublish.length} posts successfully`,
      count: postsToPublish.length 
    })
  } catch (error) {
    console.error("Cron publish error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
