import { NewsLayout } from "@/components/news/news-layout"

export default function PostLoading() {
  return (
    <NewsLayout
      className="bg-white"
      containerClassName="py-8"
      gridClassName="grid gap-8 md:grid-cols-[1fr_320px]"
      showDontMissSection={false}
      showBottomCategorySections={false}
      showSidebar={false}
    >
      <article className="space-y-6">
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse bg-zinc-200" />
          <div className="h-10 w-4/5 animate-pulse bg-zinc-200" />
          <div className="h-6 w-full animate-pulse bg-zinc-100" />
          <div className="h-4 w-1/3 animate-pulse bg-zinc-100" />
        </div>
        <div className="h-80 w-full animate-pulse border border-zinc-200 bg-zinc-100" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-4 w-full animate-pulse bg-zinc-100" />
          ))}
        </div>
      </article>
    </NewsLayout>
  )
}
