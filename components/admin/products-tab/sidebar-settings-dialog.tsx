"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ArrowDown, ArrowUp } from "lucide-react"

import type { ProductRow } from "@/app/admin/data-loaders"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateBulkSidebarSettings } from "@/app/admin/actions/products"

type SidebarSettingsDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  products: ProductRow[]
}

export function SidebarSettingsDialog({
  isOpen,
  onOpenChange,
  products,
}: SidebarSettingsDialogProps) {
  const [sidebarSelection, setSidebarSelection] = useState<Record<string, boolean>>({})
  const [sidebarOrder, setSidebarOrder] = useState<Record<string, number>>({})

  useEffect(() => {
    if (isOpen) {
      const initialSelection: Record<string, boolean> = {}
      const initialOrder: Record<string, number> = {}
      const shown = products.filter((p) => p.showOnSidebar).sort((a, b) => a.sortOrder - b.sortOrder)
      shown.forEach((p, i) => {
        initialOrder[p.id] = i + 1
      })
      products.forEach((p, i) => {
        initialSelection[p.id] = p.showOnSidebar
        if (initialOrder[p.id] === undefined) initialOrder[p.id] = 999 + i
      })
      setSidebarSelection(initialSelection)
      setSidebarOrder(initialOrder)
    }
  }, [isOpen, products])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tùy chỉnh Sidebar</DialogTitle>
          <DialogDescription>
            Chọn sản phẩm hiển thị trên thanh bên và thứ tự của chúng.
          </DialogDescription>
        </DialogHeader>

        <form
          action={updateBulkSidebarSettings}
          onSubmit={(e) => {
            const form = e.currentTarget
            const formData = new FormData(form)
            const productIds = formData.getAll("productIds") as string[]
            const usedOrders = new Set()

            for (const id of productIds) {
              const isVisible = formData.get(`visibility_${id}`) === "true"
              if (!isVisible) continue

              const order = formData.get(`order_${id}`) as string
              if (usedOrders.has(order)) {
                e.preventDefault()
                alert("Lỗi: Các sản phẩm hiển thị trên thanh bên không được có cùng số thứ tự (trùng lặp vị trí).")
                return
              }
              usedOrders.add(order)
            }
            onOpenChange(false)
          }}
          className="space-y-4 mt-2"
        >
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="products">Chọn sản phẩm</TabsTrigger>
              <TabsTrigger value="order">Sắp xếp hiển thị</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-2 border rounded hover:bg-zinc-50">
                  <input type="hidden" name="productIds" value={product.id} />
                  <input type="hidden" name={`order_${product.id}`} value={sidebarOrder[product.id] || 0} />

                  <input
                    type="checkbox"
                    name={`visibility_${product.id}`}
                    value="true"
                    checked={sidebarSelection[product.id] || false}
                    onChange={(e) => setSidebarSelection((prev) => ({ ...prev, [product.id]: e.target.checked }))}
                    className="w-4 h-4 text-rose-600 rounded border-gray-300 shrink-0"
                  />

                  <div className="w-10 h-10 relative rounded overflow-hidden bg-zinc-100 shrink-0">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                  </div>

                  <span className="text-sm font-medium line-clamp-1">{product.name}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="order" className="space-y-2">
              {(() => {
                const sorted = products
                  .filter((p) => sidebarSelection[p.id])
                  .sort((a, b) => (sidebarOrder[a.id] || 0) - (sidebarOrder[b.id] || 0))

                return sorted.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3 p-2 border rounded hover:bg-zinc-50">
                    <div className="w-10 h-10 relative rounded overflow-hidden bg-zinc-100 shrink-0">
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                    </div>

                    <span className="text-sm font-medium line-clamp-1 flex-1">{product.name}</span>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index === 0}
                        onClick={() => {
                          const list = [...sorted]
                          const temp = list[index]
                          list[index] = list[index - 1]
                          list[index - 1] = temp

                          const newOrder = { ...sidebarOrder }
                          list.forEach((p, i) => {
                            newOrder[p.id] = i + 1
                          })
                          setSidebarOrder(newOrder)
                        }}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index === sorted.length - 1}
                        onClick={() => {
                          const list = [...sorted]
                          const temp = list[index]
                          list[index] = list[index + 1]
                          list[index + 1] = temp

                          const newOrder = { ...sidebarOrder }
                          list.forEach((p, i) => {
                            newOrder[p.id] = i + 1
                          })
                          setSidebarOrder(newOrder)
                        }}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              })()}
              {products.filter((p) => sidebarSelection[p.id]).length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">Chưa chọn sản phẩm nào để hiển thị.</p>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white pb-2 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
