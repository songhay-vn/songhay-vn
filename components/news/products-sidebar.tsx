import Image from "next/image"
import Link from "next/link"
import { getProductsForSidebar } from "@/lib/queries"

export async function ProductsSidebar() {
  const { products, totalCount } = await getProductsForSidebar()

  if (products.length === 0) return null

  return (
    <section className="space-y-3 border-t border-zinc-200 bg-white p-4">
      <h3 className="text-lg font-bold text-zinc-900">Sản Phẩm Khoa Học</h3>
      <ul className="space-y-3">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex gap-3 border-b border-zinc-200 pb-3 last:border-b-0 last:pb-0"
          >
            <Link
              href={`/san-pham/${product.slug}`}
              className="flex gap-3 w-full group"
            >
              <div className="relative w-24 aspect-[12/7] flex-shrink-0 bg-zinc-100 overflow-hidden">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="96px"
                  loading="lazy"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="line-clamp-2 text-sm font-bold leading-snug text-zinc-800 transition group-hover:text-rose-600">
                  {product.name}
                </h4>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {totalCount > 5 && (
        <div className="pt-2 text-center border-t border-zinc-100">
          <Link
            href="/san-pham"
            className="inline-block text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition"
          >
            Xem thêm tất cả sản phẩm →
          </Link>
        </div>
      )}
    </section>
  )
}
