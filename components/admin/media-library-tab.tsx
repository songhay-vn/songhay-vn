"use client"
import Image from "next/image"
import Link from "next/link"
import { type FormEvent, useState } from "react"
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentMedia,
} from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadTab } from "./media-picker/upload-tab"

type MediaUsageContext = "thumbnail" | "content" | "og-image"

type MediaUsageItem = {
  postId: string
  title: string
  slug: string
  categorySlug: string | null
  isDeleted: boolean
  isLiveVisible: boolean
  contexts: MediaUsageContext[]
}

type MediaUsageSummary = {
  count: number
  items: MediaUsageItem[]
}

type MediaAssetRow = {
  id: string
  assetType: "IMAGE" | "VIDEO"
  visibility: "PRIVATE" | "SHARED"
  url: string
  displayName: string | null
  filename: string
  mimeType: string
  sizeBytes: number
  uploadedAt: Date
  uploader: {
    id: string
    name: string
    email?: string
  }
  usage?: MediaUsageSummary
}

type MediaLibraryTabProps = {
  isAdmin: boolean
  rows: MediaAssetRow[]
}

const MEDIA_LIBRARY_PAGE_SIZE = 12
const EMPTY_MEDIA_USAGE: MediaUsageSummary = {
  count: 0,
  items: [],
}

function toMb(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
}

function getAssetUsage(asset: MediaAssetRow | null | undefined) {
  return asset?.usage || EMPTY_MEDIA_USAGE
}

function getUsageContextLabel(context: MediaUsageContext) {
  if (context === "thumbnail") {
    return "ảnh đại diện"
  }

  if (context === "og-image") {
    return "OG image"
  }

  return "nội dung bài"
}

function getUsageContextSummary(usage: MediaUsageSummary) {
  return [...new Set(usage.items.flatMap((item) => item.contexts))]
    .map((context) => getUsageContextLabel(context))
    .join(", ")
}

function getUsageItemSummary(item: MediaUsageItem) {
  return item.contexts.map((context) => getUsageContextLabel(context)).join(", ")
}

function getUsagePreviewItems(usage: MediaUsageSummary) {
  return usage.items.slice(0, 2)
}

function getPostPath(item: MediaUsageItem) {
  if (!item.categorySlug) {
    return `/${item.slug}`
  }

  return `/${item.categorySlug}/${item.slug}`
}

function getUsageItemHref(item: MediaUsageItem) {
  if (item.isDeleted) {
    return null
  }

  if (item.isLiveVisible && item.categorySlug) {
    return getPostPath(item)
  }

  return `/admin/preview/${item.postId}`
}

function getUsageItemLinkLabel(item: MediaUsageItem) {
  if (item.isDeleted) {
    return "Bài trong thùng rác"
  }

  return item.isLiveVisible ? "Xem bài" : "Xem preview"
}

function getInitialUploaderOptions(rows: MediaAssetRow[]) {
  const map = new Map<string, { id: string; name: string; email: string }>()

  for (const row of rows) {
    if (!row.uploader?.id) {
      continue
    }

    map.set(row.uploader.id, {
      id: row.uploader.id,
      name: row.uploader.name,
      email: row.uploader.email || "-",
    })
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"))
}

type MediaFilterType = "image" | "video"

function getRowsByFilterType(rows: MediaAssetRow[], filterType: MediaFilterType) {
  return rows.filter((item) =>
    filterType === "video" ? item.assetType === "VIDEO" : item.assetType === "IMAGE"
  )
}

export function MediaLibraryTab({ isAdmin, rows }: MediaLibraryTabProps) {
  const initialFilterType: MediaFilterType = "image"
  const initialRows = getRowsByFilterType(rows, initialFilterType)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<MediaAssetRow | null>(null)
  const [filterType, setFilterType] = useState<MediaFilterType>(initialFilterType)
  const [uploaderFilter, setUploaderFilter] = useState("all")
  const [searchValue, setSearchValue] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = MEDIA_LIBRARY_PAGE_SIZE
  const [isLoading, setIsLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(
    Math.max(1, Math.ceil(initialRows.length / pageSize))
  )
  const [uploaderOptions, setUploaderOptions] = useState<
    Array<{ id: string; name: string; email: string }>
  >(getInitialUploaderOptions(rows))
  const [items, setItems] = useState<MediaAssetRow[]>(initialRows.slice(0, pageSize))
  const deleteAsset =
    deleteDialogId !== null
      ? items.find((item) => item.id === deleteDialogId) || null
      : null
  const deleteAssetUsage = getAssetUsage(deleteAsset)
  const deleteAssetUsageSummary = getUsageContextSummary(deleteAssetUsage)
  const previewAssetUsage = getAssetUsage(previewAsset)
  const previewAssetUsageSummary = getUsageContextSummary(previewAssetUsage)

  async function loadMedia(next: {
    filterType: MediaFilterType
    searchValue: string
    page: number
    uploaderFilter: string
  }) {
    setIsLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(next.page),
        pageSize: String(pageSize),
      })

      if (next.searchValue.trim().length > 0) {
        params.set("search", next.searchValue.trim())
      }

      if (isAdmin && next.uploaderFilter !== "all") {
        params.set("uploaderId", next.uploaderFilter)
      }
      params.set("includeUsage", "1")

      const endpoint =
        next.filterType === "video"
          ? "/api/uploads/video"
          : "/api/uploads/image"
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: "GET",
      })

      if (!response.ok) {
        setItems([])
        setTotalPages(1)
        return
      }

      const payload = (await response.json()) as {
        items: MediaAssetRow[]
        uploaderOptions?: Array<{ id: string; name: string; email: string }>
        pagination: {
          totalPages: number
        }
      }

      setItems(payload.items)
      if (isAdmin) {
        setUploaderOptions(payload.uploaderOptions || [])
      }
      setTotalPages(Math.max(1, payload.pagination.totalPages || 1))
    } catch {
      setItems([])
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(assetId: string) {
    setDeletingId(assetId)
    let shouldCloseDialog = true

    try {
      const selectedAsset = items.find((item) => item.id === assetId)
      const forceDelete = getAssetUsage(selectedAsset).count > 0
      const response = await fetch(`/api/media/${assetId}${forceDelete ? "?force=1" : ""}`, {
        method: "DELETE",
      })

      if (response.status === 409) {
        const payload = (await response.json()) as {
          error?: string
          usage?: MediaUsageSummary
        }

        if (payload.usage) {
          setItems((current) =>
            current.map((item) =>
              item.id === assetId
                ? {
                  ...item,
                  usage: payload.usage,
                }
                : item
            )
          )
        }

        shouldCloseDialog = false
        return
      }

      if (!response.ok) {
        window.location.assign(
          "/admin?tab=media-library&toast=media_delete_failed"
        )
        return
      }

      await loadMedia({ filterType, searchValue, page, uploaderFilter })
      window.history.replaceState(
        {},
        "",
        "/admin?tab=media-library&toast=media_deleted"
      )
    } catch {
      window.location.assign(
        "/admin?tab=media-library&toast=media_delete_failed"
      )
    } finally {
      setDeletingId(null)
      if (shouldCloseDialog) {
        setDeleteDialogId(null)
      }
    }
  }

  async function handleFilterChange(value: MediaFilterType) {
    setFilterType(value)
    setPage(1)
    await loadMedia({ filterType: value, searchValue, page: 1, uploaderFilter })
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    await loadMedia({ filterType, searchValue, page: 1, uploaderFilter })
  }

  async function goToPage(nextPage: number) {
    const bounded = Math.max(1, Math.min(nextPage, totalPages))
    setPage(bounded)
    await loadMedia({ filterType, searchValue, page: bounded, uploaderFilter })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">Kho dữ liệu media</p>
      <Tabs defaultValue="library" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-lg bg-muted p-1">
          <TabsTrigger value="library" className="rounded-md px-6 py-2.5">
            Danh sách quy chuẩn
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="rounded-md px-6 py-2.5 font-bold text-primary"
          >
            + Tải lên mới
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="upload"
          className="m-0 overflow-hidden rounded-md border border-zinc-200 bg-white"
        >
          <UploadTab
            hideSaveToLibrary
            submitText="Đẩy lên Kho Media"
            onSelect={() =>
              window.location.assign(
                "/admin?tab=media-library&toast=media_uploaded"
              )
            }
          />
        </TabsContent>

        <TabsContent value="library" className="m-0 space-y-4">
          <form
            onSubmit={handleSearchSubmit}
            className="grid gap-2 rounded-md border border-zinc-200 bg-white p-3 md:grid-cols-[180px_1fr_auto] md:items-end lg:grid-cols-[180px_260px_1fr_auto]"
          >
            <div className="space-y-1.5">
              <Label htmlFor="mediaFilterType">Lọc loại media</Label>
              <Select
                id="mediaFilterType"
                value={filterType}
                onChange={(event) => {
                  const nextType =
                    event.target.value === "video"
                      ? "video"
                      : "image"
                  void handleFilterChange(nextType)
                }}
              >
                <option value="image">Ảnh</option>
                <option value="video">Video</option>
              </Select>
            </div>
            {isAdmin ? (
              <div className="space-y-1.5">
                <Label htmlFor="mediaFilterUploader">
                  Lọc theo người upload
                </Label>
                <Select
                  id="mediaFilterUploader"
                  value={uploaderFilter}
                  onChange={async (event) => {
                    const nextValue = event.target.value
                    setUploaderFilter(nextValue)
                    setPage(1)
                    await loadMedia({
                      filterType,
                      searchValue,
                      page: 1,
                      uploaderFilter: nextValue,
                    })
                  }}
                >
                  <option value="all">Tất cả người upload</option>
                  {uploaderOptions.map((uploader) => (
                    <option key={uploader.id} value={uploader.id}>
                      {uploader.name} ({uploader.email})
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="mediaSearch">Tìm media</Label>
              <Input
                id="mediaSearch"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Tìm theo tên đặt hoặc tên file..."
              />
            </div>
            <Button type="submit" variant="secondary">
              <Search className="size-4" />
              Tìm
            </Button>
          </form>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
          ) : null}
          {!isLoading && items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có media phù hợp.
            </p>
          ) : null}

          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-3">
            {items.map((asset) => (
              <div
                key={asset.id}
                className="group relative mb-3 block break-inside-avoid overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 text-left transition-colors hover:border-zinc-400 cursor-pointer"
                onClick={() => setPreviewAsset(asset)}
              >
                {asset.assetType === "IMAGE" ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={asset.url}
                    alt={asset.displayName || asset.filename}
                    loading="lazy"
                    className="w-full h-auto block object-cover"
                  />
                ) : (
                  <video
                    src={asset.url}
                    controls
                    preload="metadata"
                    className="w-full h-auto bg-black/80 object-contain"
                  />
                )}

                {/* Flat hover overlay with filename */}
                <div className="absolute inset-x-0 bottom-0 z-10 bg-zinc-950/90 px-2.5 py-1.5 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                  <p className="truncate text-xs font-medium text-white">
                    {asset.displayName || asset.filename}
                  </p>
                </div>

                {/* Delete button on hover */}
                <div className="absolute top-2 right-2 z-20 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteDialogId(asset.id)
                    }}
                    disabled={deletingId === asset.id}
                    aria-label={`Xóa ${asset.displayName || asset.filename}`}
                    title="Xóa tệp này"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <AlertDialog
            open={deleteDialogId !== null}
            onOpenChange={(open) => !open && setDeleteDialogId(null)}
          >
            <AlertDialogContent className="sm:max-w-xl">
              <AlertDialogHeader className="place-items-start text-left">
                <AlertDialogTitle>
                  {deleteAssetUsage.count > 0
                    ? "Media này đang được dùng trong bài viết"
                    : "Xóa media khỏi kho dữ liệu?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteAssetUsage.count > 0
                    ? `Media "${deleteAsset?.displayName || deleteAsset?.filename || "đã chọn"}" đang được ${deleteAssetUsage.count} bài dùng ở ${deleteAssetUsageSummary}.`
                    : "Hành động này sẽ xóa tệp media đã chọn và không thể hoàn tác."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {deleteAssetUsage.count > 0 ? (
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border bg-amber-50/60 p-3">
                  {deleteAssetUsage.items.map((item) => (
                    <div
                      key={item.postId}
                      className="rounded-md border bg-white/80 p-2"
                    >
                      {getUsageItemHref(item) ? (
                        <Link
                          href={getUsageItemHref(item) || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-zinc-900">
                          {item.title}
                        </p>
                      )}
                      {item.isDeleted ? (
                        <p className="text-[11px] text-muted-foreground">
                          Bài đang nằm trong thùng rác
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {item.isLiveVisible ? getPostPath(item) : `/admin/preview/${item.postId}`}
                      </p>
                      <p className="text-xs text-amber-900">
                        Dùng ở:{" "}
                        {item.contexts
                          .map((context) => getUsageContextLabel(context))
                          .join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deletingId !== null}>
                  Hủy
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deleteDialogId === null || deletingId !== null}
                  onClick={() => {
                    if (deleteDialogId !== null) {
                      void handleDelete(deleteDialogId)
                    }
                  }}
                >
                  {deletingId !== null
                    ? "Đang xóa..."
                    : deleteAssetUsage.count > 0
                      ? "Vẫn xóa media"
                      : "Xóa"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog
            open={previewAsset !== null}
            onOpenChange={(open) => !open && setPreviewAsset(null)}
          >
            <DialogContent
              className="max-h-[90vh] overflow-hidden"
              style={{ width: "min(92vw, 72rem)", maxWidth: "none" }}
            >
              <DialogHeader>
                <DialogTitle>
                  {previewAsset?.displayName ||
                    previewAsset?.filename ||
                    "Xem trước media"}
                </DialogTitle>
                <DialogDescription>
                  {previewAsset
                    ? `${previewAsset.mimeType} · ${toMb(previewAsset.sizeBytes)} · tải bởi ${previewAsset.uploader.name}`
                    : ""}
                </DialogDescription>
              </DialogHeader>

              {previewAsset ? (
                <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                  <div className="relative h-[42vh] overflow-hidden rounded-lg border bg-zinc-50 p-2 sm:h-[52vh] lg:h-[56vh]">
                    {previewAsset.assetType === "IMAGE" ? (
                      <Image
                        src={previewAsset.url}
                        alt={previewAsset.displayName || previewAsset.filename}
                        width={1200}
                        height={800}
                        className="h-full w-full object-contain"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />
                    ) : (
                      <video
                        src={previewAsset.url}
                        controls
                        preload="metadata"
                        className="h-full w-full bg-black object-contain"
                      />
                    )}
                  </div>

                  <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
                    <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-1">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tên hiển thị</p>
                        <p className="text-sm font-medium text-zinc-900">{previewAsset.displayName || "Không đặt tên"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tên file</p>
                        <p className="wrap-break-word text-sm font-medium text-zinc-900">{previewAsset.filename}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Loại</p>
                        <p className="text-sm font-medium text-zinc-900">{previewAsset.assetType === "IMAGE" ? "Ảnh" : "Video"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Visibility</p>
                        <p className="text-sm font-medium text-zinc-900">{previewAsset.visibility === "SHARED" ? "Chia sẻ" : "Riêng tư"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Định dạng</p>
                        <p className="text-sm font-medium text-zinc-900">{previewAsset.mimeType}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dung lượng</p>
                        <p className="text-sm font-medium text-zinc-900">{toMb(previewAsset.sizeBytes)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Người tải</p>
                        <p className="text-sm font-medium text-zinc-900">{previewAsset.uploader.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Thời gian tải lên</p>
                        <p className="text-sm font-medium text-zinc-900">{new Date(previewAsset.uploadedAt).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-amber-950">Đang dùng ở {previewAssetUsage.count} bài</p>
                        {previewAssetUsageSummary ? <p className="text-xs text-amber-950/80">{previewAssetUsageSummary}</p> : null}
                      </div>
                      {previewAssetUsage.items.length > 0 ? (
                        <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
                          {getUsagePreviewItems(previewAssetUsage).map((item) => (
                            <div key={item.postId} className="rounded-md border bg-white/80 p-2">
                              {getUsageItemHref(item) ? (
                                <Link
                                  href={getUsageItemHref(item) || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="line-clamp-1 text-sm font-semibold text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
                                >
                                  {item.title}
                                </Link>
                              ) : (
                                <p className="line-clamp-1 text-sm font-semibold text-zinc-900">{item.title}</p>
                              )}
                              <p className="text-xs text-muted-foreground">{getUsageItemSummary(item)} · {getUsageItemLinkLabel(item)}</p>
                            </div>
                          ))}
                          {previewAssetUsage.count > getUsagePreviewItems(previewAssetUsage).length ? (
                            <p className="text-xs text-amber-950/80">+{previewAssetUsage.count - getUsagePreviewItems(previewAssetUsage).length} bài khác</p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-amber-950/80">Media này chưa được dùng ở bài viết nào.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-sm text-muted-foreground">
              Trang {page}/{totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1 || isLoading}
                onClick={() => void goToPage(page - 1)}
              >
                <ChevronLeft className="size-4" />
                Trước
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => void goToPage(page + 1)}
              >
                Sau
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
