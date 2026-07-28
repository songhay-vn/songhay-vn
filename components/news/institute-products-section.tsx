import Image from "next/image"

import { SectionHeading } from "./section-heading"

const INSTITUTE_PRODUCTS = [
  {
    src: "/san-pham/z7812739468535_e1e1b4f595f14b77428f45fde987e17e.jpg",
    alt: "Sản phẩm của viện hàn lâm 1",
  },
  {
    src: "/san-pham/z7812738687067_07b7f87d76ccfde40755a094f950eae8.jpg",
    alt: "Sản phẩm của viện hàn lâm 2",
  },
  {
    src: "/san-pham/z7812738604084_b9afd759b2e4d3fcd7dd53de4ff34dfd.jpg",
    alt: "Sản phẩm của viện hàn lâm 3",
  },
  {
    src: "/san-pham/z7812738571251_e7d7aee6346878819e8a8363092a30b2.jpg",
    alt: "Sản phẩm của viện hàn lâm 4",
  },
]

const ZALO_URL = "http://zalo.me/1461723500320922510?src=qr&f=1"

export function InstituteProductsSection() {
  return (
    <section className="space-y-3">
      <a
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <SectionHeading title="Sản phẩm từ nghiên cứu của Viện Hàn Lâm KH&CN Việt Nam" />
      </a>
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {INSTITUTE_PRODUCTS.map((product) => (
          <a
            key={product.src}
            href={ZALO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
          >
            <Image
              src={product.src}
              alt={product.alt}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 170px"
              className="object-cover"
            />
          </a>
        ))}
      </div>
    </section>
  )
}
