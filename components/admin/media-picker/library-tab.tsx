"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { MediaAsset } from "./types"
import { Attachment, AttachmentMedia, AttachmentTrigger } from "@/components/ui/attachment"
import { Search, Image as ImageIcon, Video as VideoIcon, User, ChevronLeft, ChevronRight, Filter, Check } from "lucide-react"
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
  const pageSize = 12

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

  const uploaderLabel = useMemo(() => {
    if (uploaderFilter === "all") return "Tất cả người đăng"
    if (uploaderFilter === currentUserId) return "Của tôi"
    return uploaders.find((u) => u.id === uploaderFilter)?.name || "Người đăng đã chọn"
  }, [currentUserId, uploaderFilter, uploaders])


  const totalPages = Math.max(1, Math.ceil(filteredMedia.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedMedia = filteredMedia.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="flex flex-col flex-1 bg-white min-h-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3 bg-muted/20">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setPage(1)
              setSearchTerm(e.target.value)
            }}
            className="pl-10 h-10 rounded-lg bg-white"
            placeholder="Tìm theo tên file hoặc URL..."
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
            <Select
              className="h-10 w-35 rounded-lg bg-white pl-10 pr-8"
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
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
            <Select
              className="h-10 w-40 rounded-lg bg-white pl-10 pr-8"
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
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="grid min-h-full grid-cols-2 content-start gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {pagedMedia.map((asset) => {
            const isSelected = selectedAssetIds.includes(asset.id)

            return (
              <Attachment
                key={asset.id}
                orientation="vertical"
                className={cn(
                  "group overflow-hidden border-input bg-muted/20 shadow-sm transition-colors hover:border-zinc-300 p-0 rounded-lg",
                  isSelected && "border-zinc-900 ring-2 ring-zinc-900/20"
                )}
              >
                <AttachmentTrigger
                  onClick={() => {
                    if (selectionMode === "multiple") {
                      onToggleSelect?.(asset)
                      return
                    }
                    onSelect(asset)
                  }}
                  aria-label={`Chọn ${asset.displayName || asset.filename}`}
                />
                <AttachmentMedia variant="image" className="w-full aspect-square relative rounded-none bg-transparent">
                  {asset.assetType === "IMAGE" ? (
                    <Image src={asset.url} alt={asset.displayName || asset.filename} width={200} height={200} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                      <div className="mb-2 p-2 bg-muted text-muted-foreground transition-colors group-hover/attachment:bg-muted/80 group-hover/attachment:text-foreground">
                        <VideoIcon className="h-6 w-6" />
                      </div>
                      <span className="line-clamp-2 text-[10px] font-bold text-muted-foreground group-hover/attachment:text-foreground">
                        {asset.displayName || asset.filename}
                      </span>
                    </div>
                  )}
                </AttachmentMedia>
                <div className="absolute top-2 left-2 z-20 rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur-sm opacity-0 transition-opacity group-hover/attachment:opacity-100">
                  {asset.uploader?.name || "Ẩn danh"}
                </div>
                {selectionMode === "multiple" && isSelected ? (
                  <div className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                ) : null}
              </Attachment>
            )
          })}

          {filteredMedia.length === 0 && (
            <div className="col-span-full flex min-h-[30vh] flex-col items-center justify-center text-muted-foreground space-y-3">
              <div className="p-4 bg-muted/50 rounded-full">
                <Filter className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold">Không tìm thấy media nào khớp.</p>
              <p className="text-xs text-muted-foreground">
                Tổng số trong hệ thống: {mediaAssets.length}.
                Đang lọc: {mediaType === "IMAGE" ? "Ảnh" : "Video"} - {uploaderLabel}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {(filteredMedia.length > 0 || selectedCount > 0) && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Trang {safePage} / {totalPages}</p>
              {selectionMode === "multiple" ? (
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  Đã chọn {selectedCount}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 font-bold gap-1.5"
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
                className="h-8 font-bold gap-1.5 bg-zinc-900"
                disabled={safePage >= totalPages}
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
              >
                Sau
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {selectionMode === "multiple" ? (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedCount === 0}
                onClick={onClearSelection}
              >
                Bỏ chọn
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-zinc-900"
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
