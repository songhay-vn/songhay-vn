import { Suspense, type ReactNode } from "react"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { SiteMainContainer } from "./site-main-container"
import { MostRead } from "./most-read"
import { ClientSideWidgets } from "./client-side-widgets"
import { ZaloChatButton } from "./zalo-chat-button"
import { CategoryArticleSections } from "./category-article-sections"
import type { CategoryWithChildren } from "@/lib/queries"

type NewsLayoutProps = {
  children: ReactNode
  navCategories?: CategoryWithChildren[]
  trendingPosts?: Array<{
    id: string
    title: string
    thumbnailUrl: string | null
    views: number
    slug: string
    category: {
      slug: string
    }
  }>
  topBanner?: ReactNode
  mainBanner?: ReactNode
  className?: string
  containerClassName?: string
  gridClassName?: string
  showSidebar?: boolean
  showZalo?: boolean
  showBottomCategorySections?: boolean
}

export function NewsLayout({
  children,
  navCategories = [],
  trendingPosts,
  topBanner,
  mainBanner,
  className,
  containerClassName = "flex flex-col gap-5 py-5 md:py-8",
  gridClassName = "grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]",
  showSidebar = true,
  showZalo = true,
  showBottomCategorySections = true,
}: NewsLayoutProps) {
  return (
    <div className={`min-h-screen bg-zinc-50 text-zinc-900 ${className || ""}`}>
      {topBanner}
      <SiteHeader navCategories={navCategories} />

      <SiteMainContainer className={containerClassName}>
        {mainBanner}
        <div className={gridClassName}>
          {/* Main Content */}
          <main className="flex flex-col gap-6">
            {children}
            {showBottomCategorySections ? (
              <Suspense
                fallback={
                  <div className="h-60 animate-pulse rounded-lg bg-zinc-100" />
                }
              >
                <CategoryArticleSections />
              </Suspense>
            ) : null}
          </main>

          {/* Sidebar */}
          {showSidebar && (
            <aside className="flex flex-col gap-4">
              {trendingPosts && trendingPosts.length > 0 && (
                <MostRead
                  posts={trendingPosts.map((post) => ({
                    id: post.id,
                    title: post.title,
                    thumbnailUrl: post.thumbnailUrl,
                    views: post.views,
                    slug: post.slug,
                    categorySlug: post.category.slug,
                  }))}
                />
              )}
              <ClientSideWidgets />
            </aside>
          )}
        </div>
      </SiteMainContainer>

      <SiteFooter navCategories={navCategories} />

      {showZalo && <ZaloChatButton />}
    </div>
  )
}
