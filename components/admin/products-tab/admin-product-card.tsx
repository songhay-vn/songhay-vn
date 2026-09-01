"use client"

import Image from "next/image"
import { Edit3, EyeOff, Globe, Trash2 } from "lucide-react"

import type { ProductRow } from "@/app/admin/data-loaders"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { deleteProduct, toggleProductIndex } from "@/app/admin/actions/products"

type AdminProductCardProps = {
  product: ProductRow
  onEdit: (product: ProductRow) => void
}

export function AdminProductCard({ product, onEdit }: AdminProductCardProps) {
  const isVietGift = product.type === "VIET_GIFT"
  const linkPrefix = isVietGift ? "/qua-viet" : "/san-pham"
  const viewCount = product.viewCount ?? 0
  const clickCount = product.zaloClickCount ?? 0
  const ctr = viewCount > 0 ? ((clickCount / viewCount) * 100).toFixed(1) : "0.0"

  return (
    <Card className="flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-0 relative aspect-[16/9] bg-zinc-100 border-b border-zinc-200">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 left-2">
          <Badge
            variant="outline"
            className={
              isVietGift
                ? "bg-amber-500 text-white border-transparent shadow-sm"
                : "bg-blue-600 text-white border-transparent shadow-sm"
            }
          >
            {isVietGift ? "Quà Việt" : "Sản phẩm Viện"}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <Badge
            variant={product.isIndexed ? "default" : "secondary"}
            className={
              product.isIndexed
                ? "bg-emerald-600 text-white"
                : "bg-zinc-600 text-white"
            }
          >
            {product.isIndexed ? (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" /> Đã lập chỉ mục
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <EyeOff className="h-3 w-3" /> Chưa lập chỉ mục
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        <CardTitle className="text-base font-bold text-zinc-900 line-clamp-2">
          {product.name}
        </CardTitle>
        <p className="text-xs text-zinc-400 mt-1 font-mono">
          {linkPrefix}/{product.slug}
        </p>
        {product.galleryUrls && product.galleryUrls.length > 0 && (
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            + {product.galleryUrls.length} ảnh bộ sưu tập
          </p>
        )}

        {/* PR Performance Stats for VietGift */}
        {isVietGift && (
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-zinc-50 p-1.5 rounded border border-zinc-100">
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Lượt xem</span>
                <span className="font-bold text-zinc-900 text-sm">{viewCount}</span>
              </div>
              <div className="bg-zinc-50 p-1.5 rounded border border-zinc-100">
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Click Zalo</span>
                <span className="font-bold text-blue-600 text-sm">{clickCount}</span>
              </div>
              <div className="bg-zinc-50 p-1.5 rounded border border-zinc-100">
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">CTR</span>
                <span className="font-bold text-emerald-600 text-sm">{ctr}%</span>
              </div>
            </div>
            {product.zaloUrl && (
              <p className="mt-2 text-xs text-zinc-500 truncate" title={product.zaloUrl}>
                <span className="font-semibold text-zinc-700">Zalo NSX:</span> {product.zaloUrl}
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-zinc-100 gap-2 mt-auto">
        <form action={toggleProductIndex}>
          <input type="hidden" name="productId" value={product.id} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="text-xs"
            title={
              product.isIndexed
                ? "Hủy lập chỉ mục Search Console"
                : "Yêu cầu lập chỉ mục Search Console"
            }
          >
            {product.isIndexed ? "Hủy chỉ mục" : "Lập chỉ mục"}
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(product)}
          >
            <Edit3 className="h-3.5 w-3.5 mr-1" />
            Sửa
          </Button>

          <form
            action={deleteProduct}
            onSubmit={(e) => {
              if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) {
                e.preventDefault()
              }
            }}
          >
            <input type="hidden" name="productId" value={product.id} />
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </CardFooter>
    </Card>
  )
}
