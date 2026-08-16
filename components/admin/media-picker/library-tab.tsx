"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { MediaAsset } from "./types"
import { Attachment, AttachmentMedia, AttachmentTrigger } from "@/components/ui/attachment"
import {
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type LibraryTabProps = {
  mediaAssets: MediaAsset[]
  currentUserId?: string
  onSelect: (asset: MediaAsset) => void
  selectionMode?: "single" | "multiple"
  selectedAssetIds?: string[]
  onToggleSelect?: (asset: MediaAsset) => void
  selectedCount?: number
  onConfirmSelection?: () => void
  onClearSelection?: () => void
}

export function LibraryTab({
  mediaAssets,
  currentUserId,
  onSelect,
  selectionMode = "single",
  selectedAssetIds = [],
  onToggleSelect,
  selectedCount = 0,
  onConfirmSelection,
  onClearSelection,
}: LibraryTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE")
  const [uploaderFilter, setUploaderFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const pageSize = 18

  const uploaders = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string }>()
    mediaAssets.forEach((asset) => {
      if (asset.uploader) {
        map.set(asset.uploader.id, asset.uploader)
      }
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [mediaAssets])

  const filteredMedia = useMemo(() => {
    return mediaAssets.filter((asset) => {
      if (asset.assetType !== mediaType) return false
      if (uploaderFilter !== "all" && asset.uploader?.id !== uploaderFilter) return false

      const search = searchTerm.trim().toLowerCase()
      if (!search) return true

      const text = `${asset.displayName || ""} ${asset.filename} ${asset.url}`.toLowerCase()
      return text.includes(search)
    })
  }, [mediaAssets, mediaType, uploaderFilter, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredMedia.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedMedia = filteredMedia.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="flex flex-col flex-1 bg-white min-h-0">
      {/* Clean, compact search & filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-zinc-200 px-4 py-2.5 bg-zinc-50/50">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 z-10" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setPage(1)
              setSearchTerm(e.target.value)
            }}
            className="pl-9 h-9 rounded-md bg-white border-zinc-200 text-sm"
            placeholder="Tìm theo tên tệp..."
          />
        </div>

        <div className="relative">
          <ImageIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none z-10" />
          <Select
            className="h-9 w-28 rounded-md bg-white border-zinc-200 pl-8 pr-7 text-xs font-semibold"
            value={mediaType}
            onChange={(e) => {
              setPage(1)
              setMediaType(e.target.value as "IMAGE" | "VIDEO")
            }}
          >
            <option value="IMAGE">Ảnh</option>
            <option value="VIDEO">Video</option>
          </Select>
        </div>

        <div className="relative">
          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none z-10" />
          <Select
            className="h-9 w-36 rounded-md bg-white border-zinc-200 pl-8 pr-7 text-xs font-semibold"
            value={uploaderFilter}
            onChange={(e) => {
              setPage(1)
              setUploaderFilter(e.target.value)
            }}
          >
            <option value="all">Tất cả người đăng</option>
            {currentUserId && <option value={currentUserId}>Của tôi</option>}
            {uploaders
              .filter((u) => u.id !== currentUserId)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </Select>
        </div>
      </div>

      {/* Pure Visual Masonry Gallery */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-4 xl:columns-5 gap-3 p-4">
          {pagedMedia.map((asset) => {
            const isSelected = selectedAssetIds.includes(asset.id)
            const displayName = asset.displayName || asset.filename

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  if (selectionMode === "multiple") {
                    onToggleSelect?.(asset)
                    return
                  }
                  onSelect(asset)
                }}
                className={cn(
                  "group relative w-full mb-3 block break-inside-avoid overflow-hidden rounded-md border text-left transition-all cursor-pointer bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950",
                  isSelected
                    ? "border-zinc-950 ring-4 ring-zinc-950/20"
                    : "border-zinc-200 hover:border-zinc-400"
                )}
                title={displayName}
              >
                {asset.assetType === "IMAGE" ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={asset.url}
                    alt={displayName}
                    loading="lazy"
                    className="w-full h-auto block object-cover"
                  />
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center p-3 text-center bg-zinc-950 text-white">
                    <VideoIcon className="h-10 w-10 text-zinc-400 mb-1.5" />
                    <span className="line-clamp-2 text-xs font-semibold text-zinc-200 px-2">
                      {displayName}
                    </span>
                  </div>
                )}

                {/* Hover overlay with filename */}
                <div className="absolute inset-x-0 bottom-0 z-10 bg-zinc-950/90 px-2.5 py-1.5 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                  <p className="truncate text-xs font-medium text-white">
                    {displayName}
                  </p>
                </div>

                {/* Selection Badge */}
                {isSelected ? (
                  <div className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-sm bg-zinc-950 text-white">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                ) : null}
              </button>
            )
          })}

          {filteredMedia.length === 0 && (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-zinc-500 space-y-3">
              <div className="p-3 bg-zinc-100 rounded-md">
                <Filter className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="text-sm font-bold text-zinc-900">Không tìm thấy media nào.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Minimal Footer */}
      {(filteredMedia.length > 0 || selectedCount > 0) && (
        <div className="border-t border-zinc-200 bg-zinc-50/50 px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-zinc-600 text-xs font-semibold">
                Trang {safePage} / {totalPages} ({filteredMedia.length} tệp)
              </p>
              {selectionMode === "multiple" ? (
                <p className="text-zinc-900 text-xs font-bold">
                  Đã chọn: {selectedCount}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={safePage <= 1}
                onClick={() => setPage((v) => Math.max(1, v - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Trước
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 gap-1 bg-zinc-900 text-xs text-white"
                disabled={safePage >= totalPages}
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
              >
                Sau
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {selectionMode === "multiple" ? (
            <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200/60 pt-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                disabled={selectedCount === 0}
                onClick={onClearSelection}
              >
                Bỏ chọn
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-zinc-900 text-white text-xs h-8"
                disabled={selectedCount === 0}
                onClick={onConfirmSelection}
              >
                {selectedCount === 0 ? "Chèn media" : `Chèn ${selectedCount} media`}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
