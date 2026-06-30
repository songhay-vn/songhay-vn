export interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[]
}

function serializeJsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url,
    })),
  }

  return (
    <script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  )
}
