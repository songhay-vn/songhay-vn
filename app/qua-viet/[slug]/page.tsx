import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { getVietGiftBySlug, getNavCategories, getAllIndexedVietGifts } from "@/lib/queries"
import { normalizeArticleHtml } from "@/lib/html"
import { NewsLayout } from "@/components/news/news-layout"
import { ProductGallery } from "@/components/news/product-gallery"
import { VietGiftContactSection } from "@/components/news/viet-gift-contact-section"
import { VietGiftSidebar } from "@/components/news/viet-gift-sidebar"
import { getSiteUrl, SITE_NAME } from "@/lib/seo"

type VietGiftDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const products = await getAllIndexedVietGifts()
  if (products.length === 0) {
    return [{ slug: "_placeholder" }]
  }
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export async function generateMetadata({
  params,
}: VietGiftDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getVietGiftBySlug(slug)

  if (!product) {
    return {
      title: `Không tìm thấy sản phẩm | ${SITE_NAME}`,
    }
  }

  const siteUrl = getSiteUrl()
  const canonicalUrl = `${siteUrl}/qua-viet/${product.slug}`

  return {
    title: `${product.name} | Quà Việt | ${SITE_NAME}`,
    description: product.description
      ? product.description.replace(/<[^>]+>/g, "").slice(0, 160)
      : `Thông tin chi tiết sản phẩm Quà Việt: ${product.name}`,
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
      title: `${product.name} - Quà Việt`,
      description: product.description
        ? product.description.replace(/<[^>]+>/g, "").slice(0, 160)
        : `Thông tin chi tiết sản phẩm Quà Việt: ${product.name}`,
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

export default async function VietGiftDetailPage({
  params,
}: VietGiftDetailPageProps) {
  const { slug } = await params
  const [product, navCategories] = await Promise.all([
    getVietGiftBySlug(slug),
    getNavCategories(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <NewsLayout
      navCategories={navCategories}
      customSidebar={<VietGiftSidebar showSearchOnMobile={true} />}
    >
      <article className="space-y-6 bg-white p-4 sm:p-6 border border-zinc-200 font-serif overflow-hidden break-words">
        {/* Breadcrumb */}
        <nav className="text-xs font-semibold text-zinc-500 flex flex-wrap items-center gap-1.5 font-sans">
          <Link href="/" className="hover:text-rose-600 transition">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/qua-viet" className="hover:text-rose-600 transition">
            Quà Việt
          </Link>
          <span>/</span>
          <span className="text-zinc-800 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Title */}
        <h1 className="text-3xl sm:text-4xl leading-tight font-black text-zinc-900 break-words font-sans">
          {product.name}
        </h1>

        {/* Product Gallery */}
        <ProductGallery
          name={product.name}
          primaryImageUrl={product.imageUrl}
          galleryUrls={product.galleryUrls}
        />

        {/* Contact with Manufacturer Button (with Tracking) */}
        <VietGiftContactSection
          productId={product.id}
          productName={product.name}
          productSlug={product.slug}
          zaloUrl={product.zaloUrl}
        />

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
