import { Suspense } from "react"
import { ProductsSidebar } from "./products-sidebar"
import { ClientSideWidgets } from "./client-side-widgets"
import { VietGiftSearchForm } from "./viet-gift-search-form"

type VietGiftSidebarProps = {
  currentSearchQuery?: string
  showSearchOnMobile?: boolean
}

export function VietGiftSidebar({
  currentSearchQuery,
  showSearchOnMobile = false,
}: VietGiftSidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Search specialities - No heading. Hidden on mobile if already on top */}
      <section
        className={`${
          showSearchOnMobile ? "block" : "hidden lg:block"
        } border border-zinc-200 bg-white p-3 shadow-xs`}
      >
        <VietGiftSearchForm defaultValue={currentSearchQuery} />
      </section>

      {/* Sản phẩm khoa học viện hàn lâm (đẩy xuống dưới) */}
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-lg bg-zinc-100 border border-zinc-200" />
        }
      >
        <ProductsSidebar />
      </Suspense>

      {/* Client widgets (lịch âm, thời tiết) */}
      <ClientSideWidgets />
    </div>
  )
}
