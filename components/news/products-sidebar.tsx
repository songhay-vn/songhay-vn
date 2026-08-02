import Link from "next/link"
import { getProductsForSidebar } from "@/lib/queries"
import { PostCard } from "./post-card"

export async function ProductsSidebar() {
  const { products, totalCount } = await getProductsForSidebar()

  if (products.length === 0) return null

  return (
    <section className="space-y-4 border border-zinc-200 bg-white p-4">
      <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-2">Sản Phẩm Khoa Học</h3>
      <div className="space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0"
          >
            <PostCard
              href={`/san-pham/${product.slug}`}
              title={product.name}
              imageUrl={product.imageUrl}
              aspectRatio="square"
              showExcerpt={false}
            />
          </div>
        ))}
      </div>
      <div className="pt-2 text-center border-t border-zinc-100">
        <Link
          href="/san-pham"
          className="inline-block text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition"
        >
          Xem thêm tất cả sản phẩm →
        </Link>
      </div>
    </section>
  )
}
