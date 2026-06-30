import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import { CommentForm } from "@/components/news/comment-form"
import { SocialShare } from "@/components/news/social-share"
import { NewsLayout } from "@/components/news/news-layout"
import { FormattedDate } from "@/components/news/formatted-date"
import type { CategoryWithChildren } from "@/lib/queries"
import { getPenNameInitials } from "@/lib/pen-names"

type ArticlePageShellProps = {
  navCategories: CategoryWithChildren[]
  article: {
    id: string
    title: string
    excerpt: string
    penName: string | null
    penNameProfile?: {
      name: string
      avatarUrl: string | null
    } | null
    thumbnailUrl: string | null
    videoEmbedUrl: string | null
    category: {
      name: string
      slug: string
    }
    comments: Array<{
      id: string
      authorName: string
      content: string
    }>
  }
  articleHtml: string
  fullUrl: string
  dateValue: Date | string | null
  viewCount?: number | null
  topBanner?: ReactNode
  mainBanner?: ReactNode
  showSocialShare?: boolean
  commentFormMode?: "live" | "preview" | "hidden"
}

function ArticleAuthorByline({
  penName,
  avatarUrl,
}: {
  penName: string
  avatarUrl: string | null
}) {
  return (
    <div className="flex items-center gap-2.5 text-left font-sans">
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-xs font-bold text-zinc-600">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`Ảnh đại diện ${penName}`}
            width={40}
            height={40}
            sizes="40px"
            className="size-full object-cover"
          />
        ) : (
          getPenNameInitials(penName)
        )}
      </span>
      <span className="text-sm font-bold text-zinc-900">{penName}</span>
    </div>
  )
}

function renderCommentForm(
  mode: ArticlePageShellProps["commentFormMode"],
  postId: string
) {
  if (mode === "live") {
    return <CommentForm postId={postId} currentUser={null} />
  }

  if (mode === "preview") {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-700">
        Bản xem trước dùng layout bài báo thật, nhưng chưa mở gửi bình luận.
      </div>
    )
  }

  return null
}

function formatViewCount(viewCount: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(viewCount)))
}

export function ArticlePageShell({
  navCategories,
  article,
  articleHtml,
  fullUrl,
  dateValue,
  viewCount,
  topBanner,
  mainBanner,
  showSocialShare = true,
  commentFormMode = "live",
}: ArticlePageShellProps) {
  const displayPenName = article.penNameProfile?.name || article.penName
  const displayPenNameAvatarUrl = article.penNameProfile?.avatarUrl || null
  const hasViewCount =
    typeof viewCount === "number" && Number.isFinite(viewCount)

  return (
    <NewsLayout
      navCategories={navCategories}
      topBanner={topBanner}
      mainBanner={mainBanner}
      className="bg-white"
      containerClassName="flex flex-col gap-6 py-8 md:py-10"
      gridClassName="grid gap-8 md:grid-cols-[1fr_320px]"
      showBottomCategorySections={true}
    >
      <div className="relative">
        {showSocialShare ? (
          <div className="absolute top-0 -left-20 hidden h-full lg:block">
            <SocialShare
              title={article.title}
              url={fullUrl}
              variant="sidebar"
            />
          </div>
        ) : null}

        <article className="mx-auto flex w-full max-w-xl flex-col gap-6 overflow-hidden font-serif break-words">
          <header className="flex flex-col gap-3">
            <Link
              href={`/${article.category.slug}`}
              className="text-sm font-bold text-rose-600"
            >
              {article.category.name}
            </Link>
            <h1 className="text-4xl leading-tight font-black text-zinc-900">
              {article.title}
            </h1>
            {displayPenName ? (
              <ArticleAuthorByline
                penName={displayPenName}
                avatarUrl={displayPenNameAvatarUrl}
              />
            ) : null}
            <p className="text-xl leading-relaxed font-bold text-zinc-950">
              {article.excerpt.trim()}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-black">
              <span>
                <FormattedDate value={dateValue} />
              </span>
              {hasViewCount ? (
                <>
                  <span
                    className="size-1 rounded-full bg-zinc-400"
                    aria-hidden="true"
                  />
                  <span>{formatViewCount(viewCount)} lượt xem</span>
                </>
              ) : null}
            </div>
          </header>

          <Image
            src={article.thumbnailUrl || "/placeholder-news.svg"}
            alt={article.title}
            width={1200}
            height={700}
            className="aspect-[12/7] h-auto w-full border border-zinc-200 object-cover"
            priority
          />

          <div
            className="article-content ck-content max-w-none text-black"
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />

          {article.videoEmbedUrl ? (
            <div className="overflow-hidden border border-zinc-200">
              <iframe
                src={article.videoEmbedUrl}
                title={`Video cho bài viết: ${article.title}`}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}

          {showSocialShare ? (
            <SocialShare title={article.title} url={fullUrl} />
          ) : null}

          <section className="space-y-3 border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-xl font-bold">Bình luận gần đây</h2>
            {article.comments.length === 0 ? (
              <p className="text-sm text-black">Chưa có bình luận hiển thị.</p>
            ) : (
              article.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border border-zinc-200 bg-white p-3"
                >
                  <p className="text-sm font-semibold">{comment.authorName}</p>
                  <p className="text-sm text-black">{comment.content}</p>
                </div>
              ))
            )}
          </section>

          {renderCommentForm(commentFormMode, article.id)}
        </article>
      </div>
    </NewsLayout>
  )
}
