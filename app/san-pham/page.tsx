import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { getAllIndexedProducts, getNavCategories } from "@/lib/queries"
import { NewsLayout } from "@/components/news/news-layout"
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
        <div className="border-b border-zinc-200 bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900">
            Sản Phẩm Khoa Học
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Tổng hợp sản phẩm khoa học và công nghệ uy tín.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
            <p className="text-zinc-500">Hiện chưa có sản phẩm nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/san-pham/${product.slug}`}
                className="group flex flex-col bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="relative aspect-[16/9] w-full bg-zinc-100 overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h2 className="font-bold text-zinc-900 group-hover:text-rose-600 transition line-clamp-2">
                    {product.name}
                  </h2>
                  <span className="mt-4 text-xs font-semibold text-rose-600 group-hover:underline">
                    Xem chi tiết →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </NewsLayout>
  )
}
