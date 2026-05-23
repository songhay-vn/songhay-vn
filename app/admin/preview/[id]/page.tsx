import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ArticlePageShell } from "@/components/news/article-page-shell"
import {
  injectInlineAdAfterSecondParagraph,
  normalizeArticleHtml,
} from "@/lib/html"
import { requireCmsUser } from "@/lib/auth"
import { canViewAllPosts } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { getNavCategories, getTrendingPosts } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Xem trước bài viết",
  robots: { index: false, follow: false },
}

type PreviewPageProps = {
  params: Promise<{ id: string }>
}

// Shared logic in lib/html.ts

export default async function AdminPreviewPage({ params }: PreviewPageProps) {
  const currentUser = await requireCmsUser()

  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      author: { select: { name: true, email: true } },
      comments: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!post) {
    redirect("/admin?tab=personal-archive")
  }

  if (!canViewAllPosts(currentUser.role) && post.authorId !== currentUser.id) {
    redirect("/admin?tab=personal-archive&toast=post_action_forbidden")
  }

  if (post.isDeleted) {
    redirect("/admin?tab=trash")
  }

  const [trendingPosts, navCategories] = await Promise.all([
    getTrendingPosts(),
    getNavCategories(),
  ])

  const articleHtml = injectInlineAdAfterSecondParagraph(
    normalizeArticleHtml(post.content)
  )
  const fullUrl = `/${post.category.slug}/${post.slug}`

  return (
    <ArticlePageShell
      navCategories={navCategories}
      article={post}
      articleHtml={articleHtml}
      fullUrl={fullUrl}
      trendingPosts={trendingPosts}
      dateValue={post.updatedAt}
      showSocialShare={false}
      commentFormMode="preview"
      topBanner={
        <div className="flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-400 px-2 py-0.5 text-xs font-bold tracking-wide text-amber-900 uppercase">
              Chế độ xem trước
            </span>
            <span className="text-amber-800">
              {post.isPublished
                ? "Bài đã xuất bản, đây là bản render trong CMS để so nhanh layout news."
                : "Bài viết này chưa được xuất bản, nên đang mở ở chế độ preview với layout news thật."}
            </span>
          </div>
          <Link
            href={`/admin/edit/${post.id}`}
            className="shrink-0 rounded border border-amber-400 bg-white px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            ← Quay lại sửa bài
          </Link>
        </div>
      }
    />
  )
}
