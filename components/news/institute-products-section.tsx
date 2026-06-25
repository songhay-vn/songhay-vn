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

export function InstituteProductsSection() {
  return (
    <section className="space-y-3">
      <SectionHeading title="Sản phẩm của viện hàn lâm" />
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {INSTITUTE_PRODUCTS.map((product) => (
          <div
            key={product.src}
            className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
          >
            <Image
              src={product.src}
              alt={product.alt}
              fill
              sizes="(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 170px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
