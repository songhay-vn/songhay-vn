import Image from "next/image"
import { SectionHeading } from "./section-heading"

const VIEN_HAN_LAM_PRODUCTS = [
  {
    src: "/san-pham/z7812738571251_e7d7aee6346878819e8a8363092a30b2.jpg",
    alt: "Sản phẩm Viện Hàn Lâm KH&CN Việt Nam 1",
  },
  {
    src: "/san-pham/z7812738604084_b9afd759b2e4d3fcd7dd53de4ff34dfd.jpg",
    alt: "Sản phẩm Viện Hàn Lâm KH&CN Việt Nam 2",
  },
  {
    src: "/san-pham/z7812738687067_07b7f87d76ccfde40755a094f950eae8.jpg",
    alt: "Sản phẩm Viện Hàn Lâm KH&CN Việt Nam 3",
  },
  {
    src: "/san-pham/z7812739468535_e1e1b4f595f14b77428f45fde987e17e.jpg",
    alt: "Sản phẩm Viện Hàn Lâm KH&CN Việt Nam 4",
  },
]

export function VienHanLamProducts() {
  return (
    <section className="space-y-4">
      <SectionHeading title="Sản phẩm Viện Hàn Lâm KH&CN Việt Nam" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {VIEN_HAN_LAM_PRODUCTS.map((product) => (
          <a
            key={product.src}
            href="http://zalo.me/1461723500320922510?src=qr&f=1"
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-square w-full">
              <Image
                src={product.src}
                alt={product.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 260px"
              />
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
