"use client"

import { useState } from "react"
import type { ProductRow } from "@/app/admin/data-loaders"
import type { MediaAsset } from "@/components/admin/media-picker/types"
import { Button } from "@/components/ui/button"
import { AdminProductCard } from "./products-tab/admin-product-card"
import { AddProductDialog } from "./products-tab/add-product-dialog"
import { EditProductDialog } from "./products-tab/edit-product-dialog"
import { SidebarSettingsDialog } from "./products-tab/sidebar-settings-dialog"

type ProductsTabProps = {
  products: ProductRow[]
  mediaAssets?: MediaAsset[]
  currentUserId?: string
}

export function ProductsTab({
  products,
  mediaAssets = [],
  currentUserId = "",
}: ProductsTabProps) {
  const [filterType, setFilterType] = useState<"ALL" | "SCIENCE_PRODUCT" | "VIET_GIFT">("ALL")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSidebarSettingsOpen, setIsSidebarSettingsOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)

  const scienceCount = products.filter((p) => p.type === "SCIENCE_PRODUCT").length
  const vietGiftCount = products.filter((p) => p.type === "VIET_GIFT").length
  const displayedProducts = products.filter((p) => {
    if (filterType === "ALL") return true
    return p.type === filterType
  })

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Quản lý sản phẩm & Quà Việt</h2>
          <p className="text-sm text-zinc-500">
            Quản lý danh sách sản phẩm khoa học viện hàn lâm và các bài PR Quà Việt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsSidebarSettingsOpen(true)}
            className="font-semibold"
          >
            Tùy chỉnh Sidebar
          </Button>
          <AddProductDialog
            isOpen={isAddOpen}
            onOpenChange={setIsAddOpen}
            mediaAssets={mediaAssets}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        <button
          type="button"
          onClick={() => setFilterType("ALL")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition ${
            filterType === "ALL"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Tất cả ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("SCIENCE_PRODUCT")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition ${
            filterType === "SCIENCE_PRODUCT"
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Sản phẩm Viện ({scienceCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("VIET_GIFT")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition ${
            filterType === "VIET_GIFT"
              ? "bg-amber-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Quà Việt PR ({vietGiftCount})
        </button>
      </div>

      {/* Products Grid */}
      {displayedProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-md border border-zinc-200">
          <p className="text-zinc-600 font-medium">Chưa có sản phẩm nào trong mục này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedProducts.map((product) => (
            <AdminProductCard
              key={product.id}
              product={product}
              onEdit={setEditingProduct}
            />
          ))}
        </div>
      )}

      {/* Edit Product Modal */}
      <EditProductDialog
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        mediaAssets={mediaAssets}
        currentUserId={currentUserId}
      />

      {/* Sidebar Settings Modal */}
      <SidebarSettingsDialog
        isOpen={isSidebarSettingsOpen}
        onOpenChange={setIsSidebarSettingsOpen}
        products={products}
      />
    </div>
  )
}
