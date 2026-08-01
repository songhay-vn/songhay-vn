import type { Metadata } from "next"

import { getAllIndexedProducts, getNavCategories } from "@/lib/queries"
import { NewsLayout } from "@/components/news/news-layout"
import { PostCard } from "@/components/news/post-card"
import { getSiteUrl, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Tất cả sản phẩm khoa học | ${SITE_NAME}`,
  description: "Danh sách sản phẩm khoa học và công nghệ từ Viện Hàn Lâm KH&CN Việt Nam.",
  alternates: {
    canonical: `${getSiteUrl()}/san-pham`,
  },
}

export default async function ProductsListingPage() {
  const [products, navCategories] = await Promise.all([
    getAllIndexedProducts(),
    getNavCategories(),
  ])

  return (
    <NewsLayout navCategories={navCategories}>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900">
          Sản Phẩm Khoa Học
        </h1>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white border border-zinc-200">
            <p className="text-zinc-500">Hiện chưa có sản phẩm nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <PostCard
                key={product.id}
                href={`/san-pham/${product.slug}`}
                title={product.name}
                imageUrl={product.imageUrl}
                aspectRatio="square"
                showExcerpt={false}
                className="bg-white border border-zinc-200 p-4"
              />
            ))}
          </div>
        )}
      </div>
    </NewsLayout>
  )
}
