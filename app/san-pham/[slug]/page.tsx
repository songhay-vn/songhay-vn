import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { getProductBySlug, getNavCategories, getAllIndexedProducts } from "@/lib/queries"
import { normalizeArticleHtml } from "@/lib/html"
import { NewsLayout } from "@/components/news/news-layout"
import { ProductGallery } from "@/components/news/product-gallery"
import { getSiteUrl, SITE_NAME } from "@/lib/seo"

const ZALO_URL = "http://zalo.me/1461723500320922510?src=qr&f=1"

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const products = await getAllIndexedProducts()
  if (products.length === 0) {
    return [{ slug: "_placeholder" }]
  }
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: `Không tìm thấy sản phẩm | ${SITE_NAME}`,
    }
  }

  const siteUrl = getSiteUrl()
  const canonicalUrl = `${siteUrl}/san-pham/${product.slug}`

  return {
    title: `${product.name} | ${SITE_NAME}`,
    description: product.description
      ? product.description.replace(/<[^>]+>/g, "").slice(0, 160)
      : `Thông tin chi tiết sản phẩm ${product.name}`,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: product.isIndexed
      ? undefined
      : {
          index: false,
          follow: true,
        },
    openGraph: {
      title: product.name,
      description: product.description
        ? product.description.replace(/<[^>]+>/g, "").slice(0, 160)
        : `Thông tin chi tiết sản phẩm ${product.name}`,
      url: canonicalUrl,
      images: [
        {
          url: product.imageUrl,
          alt: product.name,
        },
      ],
    },
  }
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params
  const [product, navCategories] = await Promise.all([
    getProductBySlug(slug),
    getNavCategories(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <NewsLayout navCategories={navCategories}>
      <article className="space-y-6 bg-white p-4 sm:p-6 border border-zinc-200 font-serif overflow-hidden break-words">
        {/* Breadcrumb */}
        <nav className="text-xs font-semibold text-zinc-500 flex flex-wrap items-center gap-1.5">
          <Link href="/" className="hover:text-rose-600 transition">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/san-pham" className="hover:text-rose-600 transition">
            Sản phẩm
          </Link>
          <span>/</span>
          <span className="text-zinc-800 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Title */}
        <h1 className="text-3xl sm:text-4xl leading-tight font-black text-zinc-900 break-words">
          {product.name}
        </h1>

        {/* Product Gallery */}
        <ProductGallery
          name={product.name}
          primaryImageUrl={product.imageUrl}
          galleryUrls={product.galleryUrls}
        />

        {/* Contact Button */}
        <div className="py-2">
          <a
            href={ZALO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
              <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
            </svg>
            Liên hệ tư vấn qua Zalo
          </a>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="space-y-3 border-t border-zinc-200 pt-6">
            <div
              className="article-content ck-content max-w-none text-black"
              dangerouslySetInnerHTML={{ __html: normalizeArticleHtml(product.description) }}
            />
          </div>
        )}
      </article>
    </NewsLayout>
  )
}
