import { Suspense, type ReactNode } from "react"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { SiteMainContainer } from "./site-main-container"
import { TrendingSidebar } from "./trending-sidebar"
import { ClientSideWidgets } from "./client-side-widgets"
import { ZaloChatButton } from "./zalo-chat-button"
import { CategoryArticleSections } from "./category-article-sections"
import { LatestArticleSection } from "./latest-article-section"
import { DontMissWidget } from "./dont-miss-widget"
import { InstituteProductsSection } from "./institute-products-section"
import { SectionHeading } from "./section-heading"
import type { CategoryWithChildren, PostListItem } from "@/lib/queries"

type NewsLayoutProps = {
  children: ReactNode
  navCategories?: CategoryWithChildren[]
  topBanner?: ReactNode
  mainBanner?: ReactNode
  className?: string
  containerClassName?: string
  gridClassName?: string
  showSidebar?: boolean
  customSidebar?: ReactNode
  showZalo?: boolean
  showDontMissSection?: boolean
  showInstituteProducts?: boolean
  showBottomCategorySections?: boolean
  showLatestPosts?: boolean
  latestPosts?: PostListItem[]
  latestPostsLimit?: number
}

export function NewsLayout({
  children,
  navCategories = [],
  topBanner,
  mainBanner,
  className,
  containerClassName = "flex flex-col gap-5 py-5 md:py-8",
  gridClassName = "grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]",
  showSidebar = true,
  customSidebar,
  showZalo = true,
  showDontMissSection = true,
  showInstituteProducts = true,
  showBottomCategorySections = false,
  showLatestPosts = true,
  latestPosts,
  latestPostsLimit,
}: NewsLayoutProps) {
  return (
    <div className={`min-h-screen bg-zinc-50 text-zinc-900 ${className || ""}`}>
      {topBanner}
      <Suspense fallback={<div className="h-20 bg-red-700 md:bg-white animate-pulse" />}>
        <SiteHeader navCategories={navCategories} />
      </Suspense>

      <SiteMainContainer className={containerClassName}>
        {mainBanner}
        <div className={gridClassName}>
          {/* Main Content */}
          <main className="flex flex-col gap-6">
            {children}
            {showDontMissSection ? (
              <>
                <section className="space-y-3">
                  <SectionHeading title="Đừng bỏ lỡ!" />
                  <DontMissWidget />
                </section>
                {showInstituteProducts && <InstituteProductsSection />}
              </>
            ) : null}
            {showBottomCategorySections ? (
              <>
                {showLatestPosts && (
                  <Suspense
                    fallback={
                      <div className="h-60 animate-pulse rounded-lg bg-zinc-100" />
                    }
                  >
                    <LatestArticleSection posts={latestPosts} limit={latestPostsLimit} />
                  </Suspense>
                )}
                <Suspense
                  fallback={
                    <div className="h-60 animate-pulse rounded-lg bg-zinc-100" />
                  }
                >
                  <CategoryArticleSections />
                </Suspense>
              </>
            ) : null}
          </main>

          {/* Sidebar */}
          {showSidebar && (
            <aside className="flex flex-col gap-4">
              {customSidebar ? (
                customSidebar
              ) : (
                <>
                  <Suspense
                    fallback={
                      <div className="h-64 animate-pulse rounded-lg bg-zinc-100" />
                    }
                  >
                    <TrendingSidebar />
                  </Suspense>
                  <ClientSideWidgets />
                </>
              )}
            </aside>
          )}
        </div>
      </SiteMainContainer>

      <Suspense fallback={<div className="h-40 bg-zinc-100 animate-pulse" />}>
        <SiteFooter navCategories={navCategories} />
      </Suspense>

      {showZalo && <ZaloChatButton />}
    </div>
  )
}
