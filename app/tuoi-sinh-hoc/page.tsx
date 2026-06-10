import { Suspense } from "react"
import type { Metadata } from "next"

import { BioAgeWidget } from "@/components/news/bio-age-widget"
import { SiteEngagement } from "@/components/news/site-engagement"
import { getNavCategories } from "@/lib/queries"
import { NewsLayout } from "@/components/news/news-layout"

export const metadata: Metadata = {
  title: "Máy tính tuổi sinh học",
  description: "Ước tính tuổi sinh học dựa trên giấc ngủ, vận động và mức căng thẳng.",
  alternates: {
    canonical: "/tuoi-sinh-hoc",
  },
}

export default async function BioAgePage() {
  const navCategories = await getNavCategories()

  return (
    <NewsLayout navCategories={navCategories} className="bg-white">
      <div className="space-y-12">
        <div className="space-y-6">
          <h1 className="text-3xl font-black text-zinc-900">Máy tính tuổi sinh học</h1>
          <BioAgeWidget />
        </div>

        <Suspense fallback={<div className="h-60 animate-pulse rounded-lg bg-zinc-100" />}>
          <SiteEngagement />
        </Suspense>
      </div>
    </NewsLayout>
  )
}
