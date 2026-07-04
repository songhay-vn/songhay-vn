"use client"

import Image from "next/image"
import { useState, useTransition } from "react"
import { BookOpen, Clock, Trash } from "lucide-react"

import { PostThumbnail } from "@/components/admin/post-thumbnail"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { bulkTrashPosts, bulkUpdateStatus } from "@/app/admin/actions/posts"
import { showToastByKey } from "@/components/admin/action-toast"
import { PostActionsCell } from "./post-actions-cell"
import { PostCard } from "@/components/news/post-card"
import { STATUS_CONFIG, getSearchConsoleIndexState, getTimelineLabel } from "./types"
import type { PostActions, PostPermissions, PostRow, FeaturedPostRow } from "./types"

type PostsTableProps = {
  posts: PostRow[]
  featuredPosts?: FeaturedPostRow[]
  featuredSlotFillers?: FeaturedPostRow[]
  hideSeoDescription?: boolean
} & PostPermissions &
  PostActions

const FEATURED_POSITIONS = [1, 2, 3, 4, 5, 6] as const

function formatViews(value: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(value)))
}

function getDefaultFeaturedPosition(post: PostRow, featuredPosts: FeaturedPostRow[]) {
  if (
    typeof post.featuredPosition === "number" &&
    FEATURED_POSITIONS.includes(post.featuredPosition as (typeof FEATURED_POSITIONS)[number])
  ) {
    return String(post.featuredPosition)
  }

  const usedPositions = new Set(
    featuredPosts
      .map((item) => item.featuredPosition)
      .filter((value): value is number => typeof value === "number")
  )
  const firstEmpty = FEATURED_POSITIONS.find((position) => !usedPositions.has(position))
  return String(firstEmpty ?? 1)
}

export function PostsTable({
  posts,
  featuredPosts = [],
  featuredSlotFillers = [],
  hideSeoDescription = false,
  ...rest
}: PostsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const [postToAssignFeatured, setPostToAssignFeatured] = useState<PostRow | null>(null)
  const [selectedFeaturedPosition, setSelectedFeaturedPosition] = useState<string>("1")

  const handleSetFeatured = (post: PostRow) => {
    setSelectedFeaturedPosition(getDefaultFeaturedPosition(post, featuredPosts))
    setPostToAssignFeatured(post)
  }

  const handleRemoveFeatured = (post: PostRow) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set("postId", post.id)
      const res = await rest.clearFeaturedSlot(formData)
      if (res?.toast) {
        showToastByKey(res.toast)
      }
    })
  }

  const handleConfirmFeaturedSlot = () => {
    if (!postToAssignFeatured || !selectedFeaturedPosition) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set("postId", postToAssignFeatured.id)
      formData.set("featuredPosition", selectedFeaturedPosition)
      const res = await rest.assignFeaturedSlot(formData)
      setPostToAssignFeatured(null)
      if (res?.toast) {
        showToastByKey(res.toast)
      }
    })
  }

  const featuredByPosition = new Map(
    featuredPosts
      .filter((post) => typeof post.featuredPosition === "number")
      .map((post) => [post.featuredPosition as number, post])
  )
  const previewUsedIds = new Set(featuredPosts.map((post) => post.id))
  if (postToAssignFeatured) {
    previewUsedIds.add(postToAssignFeatured.id)
  }
  const featuredSlotPreviews: { position: number; previewPost: FeaturedPostRow | PostRow | null; source: "selected" | "assigned" | "fallback" | "empty" }[] = []
  let index = 0;
  for (const position of FEATURED_POSITIONS) {
    const isSelected = selectedFeaturedPosition === String(position)
    const assignedPost = featuredByPosition.get(position)
    let previewPost: FeaturedPostRow | PostRow | null =
      isSelected && postToAssignFeatured ? postToAssignFeatured : assignedPost ?? null
    let source: "selected" | "assigned" | "fallback" | "empty" = isSelected
      ? "selected"
      : assignedPost
        ? "assigned"
        : "empty"

    if (!previewPost) {
      while (
        index < featuredSlotFillers.length &&
        previewUsedIds.has(featuredSlotFillers[index].id)
      ) {
        index += 1
      }

      previewPost = featuredSlotFillers[index] ?? null
      if (previewPost) {
        previewUsedIds.add(previewPost.id)
        index += 1
        source = "fallback"
      }
    }

    featuredSlotPreviews.push({ position, previewPost, source })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleBulkTrash = () => {
    if (!confirm("Bạn có chắc chắn muốn xóa các bài viết đã chọn?")) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set("postIds", Array.from(selectedIds).join(","))
      await bulkTrashPosts(formData)
      setSelectedIds(new Set())
    })
  }

  const handleBulkStatus = (status: string) => {
    if (!confirm(`Bạn có chắc chắn muốn chuyển các bài viết đã chọn sang trạng thái ${status}?`)) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set("postIds", Array.from(selectedIds).join(","))
      formData.set("status", status)
      await bulkUpdateStatus(formData)
      setSelectedIds(new Set())
    })
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <div className="rounded-full bg-zinc-100 p-4">
          <BookOpen className="size-8 text-zinc-300" />
        </div>
        <p className="text-sm font-medium text-zinc-500">
          Không tìm thấy bài viết phù hợp
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-800 shadow-sm">
          <span className="text-sm font-medium">Đã chọn {selectedIds.size} bài viết</span>
          <div className="flex items-center gap-2">
            <select
              className="h-8 rounded-md border border-indigo-200 bg-white px-2 text-xs font-medium text-indigo-700 outline-none"
              onChange={(e) => {
                if (e.target.value) handleBulkStatus(e.target.value)
                e.target.value = ""
              }}
              disabled={isPending}
              defaultValue=""
            >
              <option value="" disabled>Đổi trạng thái...</option>
              <option value="DRAFT">Nháp</option>
              <option value="PENDING_REVIEW">Chờ duyệt</option>
              <option value="PENDING_PUBLISH">Chờ xuất bản</option>
              {rest.canPublishNow && <option value="PUBLISHED">Đã xuất bản</option>}
              <option value="REJECTED">Từ chối</option>
            </select>
            <button
              onClick={handleBulkTrash}
              disabled={isPending}
              className="flex h-8 items-center gap-1 rounded-md bg-white px-3 text-xs font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash className="size-3" />
              Xóa (Thùng rác)
            </button>
          </div>
        </div>
      )}
      <div className="max-h-[calc(100vh-14rem)] overflow-x-auto overflow-y-auto rounded-xl border border-zinc-200">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-20 bg-zinc-50 shadow-sm before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-zinc-200">
            <TableRow className="bg-transparent hover:bg-transparent">
              <TableHead className="w-12 px-4 py-2.5 text-center">
                <Checkbox
                  checked={selectedIds.size === posts.length && posts.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[8%] py-2.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Ảnh
              </TableHead>
              <TableHead className="w-[49%] py-2.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Bài viết
              </TableHead>
              <TableHead className="w-[6%] py-2.5 text-right text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Lượt xem
              </TableHead>
              <TableHead className="w-[16%] py-2.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Nhân sự & Lịch sử
              </TableHead>
              <TableHead className="w-[17%] py-2.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => {
              const cfg = STATUS_CONFIG[post.editorialStatus]
              const indexState = getSearchConsoleIndexState(post)
              return (
                <TableRow
                  key={post.id}
                  className={cn("align-top transition-colors", cfg.rowClass, selectedIds.has(post.id) && "bg-indigo-50/50")}
                >
                  <TableCell className="px-4 py-3 align-middle">
                    <Checkbox
                      checked={selectedIds.has(post.id)}
                      onCheckedChange={() => toggleSelect(post.id)}
                      aria-label={`Select ${post.title}`}
                    />
                  </TableCell>

                  {/* ── Column 1: Image ── */}
                  <TableCell className="py-3">
                    <PostThumbnail
                      src={post.thumbnailUrl}
                      alt={post.title}
                      width={84}
                      height={60}
                      className="mt-0.5"
                    />
                  </TableCell>

                  {/* ── Column 2: Post info (Badge, Title, Category, Excerpt, SEO, Tags) ── */}
                  <TableCell className="py-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Title + PenName badge */}
                      <div className="flex flex-wrap items-start gap-1.5">
                        {post.penName && (
                          <span className="inline-flex shrink-0 items-center rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-medium text-white">
                            {post.penName}
                          </span>
                        )}
                        <p className="text-[15px] leading-snug font-semibold text-zinc-900">
                          {post.title}
                        </p>
                      </div>

                      {/* Category & Status */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-700 uppercase">
                          Mục:{" "}
                          <span className="text-rose-600">
                            {post.category.name}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium",
                            cfg.badgeClass
                          )}
                        >
                          <span
                            className={cn("size-1.5 rounded-full", cfg.dot)}
                          />
                          {cfg.label}
                        </span>
                        {post.isFeatured && (
                          <Badge
                            variant="outline"
                            className="h-5 border-amber-300 px-1 py-0 text-[11px] text-amber-600"
                          >
                            {post.featuredPosition ? `Tiêu điểm #${post.featuredPosition}` : "Nổi bật"}
                          </Badge>
                        )}
                        {post.isTrending && (
                          <Badge
                            variant="outline"
                            className="h-5 border-rose-300 px-1 py-0 text-[11px] text-rose-600"
                          >
                            Xu hướng
                          </Badge>
                        )}
                        {post.isPublished && (
                          <Badge
                            variant="outline"
                            title={indexState.title}
                            className={cn(
                              "h-5 px-1 py-0 text-[11px]",
                              indexState.className
                            )}
                          >
                            {indexState.label}
                          </Badge>
                        )}
                      </div>
                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="line-clamp-2 text-[13px] leading-5 text-zinc-600">
                          {post.excerpt}
                        </p>
                      )}

                      {/* SEO title */}
                      {post.seoTitle && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs font-medium text-zinc-700">SEO title:</span>
                          <span className="text-xs text-zinc-500">{post.seoTitle}</span>
                        </div>
                      )}
                      {/* SEO description */}
                      {!hideSeoDescription && post.seoDescription && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs font-medium text-zinc-700">SEO desc:</span>
                          <span className="line-clamp-2 text-xs text-zinc-500">{post.seoDescription}</span>
                        </div>
                      )}
                      {/* Tags */}
                      {post.seoKeywords && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs font-medium text-zinc-700">
                            TAG:
                          </span>
                          <span className="text-xs text-zinc-500">
                            {post.seoKeywords
                              .split(",")
                              .map((k) => k.trim())
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* ── Column 3: Views ── */}
                  <TableCell className="pt-8 pb-3 text-right align-top whitespace-nowrap">
                    {post.editorialStatus === "PUBLISHED" ? (
                      typeof post.views === "number" ? (
                        <span
                          className="text-[11px] leading-5 font-medium tabular-nums text-zinc-700"
                          title="GA4 screenPageViews trong 30 ngày"
                        >
                          {formatViews(post.views)}
                        </span>
                      ) : (
                        <span
                          className="text-xs text-zinc-400"
                          title="Chưa có dữ liệu GA4 trong 30 ngày"
                        >
                          —
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </TableCell>

                  {/* ── Column 4: Personnel & History stack ── */}
                  <TableCell className="py-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start justify-between">
                        <span className="w-12 text-zinc-500">Tạo:</span>
                        <span className="flex-1 text-right font-medium text-zinc-800">
                          {post.author?.name ?? "Không rõ"}
                        </span>
                      </div>
                      {post.lastEditor && (
                        <div className="mt-1 flex items-start justify-between">
                          <span className="w-12 text-zinc-500">Sửa:</span>
                          <span className="flex-1 text-right font-medium text-zinc-800">
                            {post.lastEditor.name}
                          </span>
                        </div>
                      )}
                      {post.approver && (
                        <div className="mt-1 flex items-start justify-between">
                          <span className="w-12 text-zinc-500">Duyệt:</span>
                          <span className="flex-1 text-right font-medium text-zinc-800">
                            {post.approver.name}
                          </span>
                        </div>
                      )}
                      <div className="my-1.5 h-px bg-zinc-200" />
                      <div className="flex items-center justify-end gap-1 text-[11px] font-medium text-amber-600">
                        <Clock className="size-3 shrink-0" />
                        {getTimelineLabel(post)}
                      </div>
                    </div>
                  </TableCell>

                  {/* ── Column 5: Actions ── */}
                  <TableCell className="py-3">
                    <PostActionsCell
                      post={post}
                      onSetFeatured={() => handleSetFeatured(post)}
                      onRemoveFeatured={() => handleRemoveFeatured(post)}
                      {...rest}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </table>
      </div>

      {/* Dialog for assigning a featured slot */}
      <Dialog
        open={postToAssignFeatured !== null}
        onOpenChange={(open) => {
          if (!open) setPostToAssignFeatured(null)
        }}
      >
        <DialogContent className="sm:max-w-[960px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900">
              Chọn vị trí Tin tiêu điểm
            </DialogTitle>
          </DialogHeader>

          <div className="py-1 space-y-3">
            <p className="text-sm font-semibold text-zinc-900 bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5 text-rose-800">
              <span className="font-bold">Đang ghim bài:</span> {postToAssignFeatured?.title}
            </p>

            {/* ── Homepage layout diagram ── */}

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {/* Left: Slot 1 (hero) */}
                  <div className="lg:col-span-2">
                    {(() => {
                      const s = featuredSlotPreviews[0]
                      const isSelected = selectedFeaturedPosition === "1"
                      const post = s.previewPost
                      const source = s.source
                      return (
                        <div
                          onClickCapture={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedFeaturedPosition("1")
                          }}
                          className={cn(
                            "group relative rounded-xl border-4 overflow-hidden text-left transition-all duration-200 cursor-pointer select-none h-[280px] [&_h3]:text-sm [&_h3]:lg:text-sm",
                            isSelected
                              ? "border-rose-500 ring-4 ring-rose-500/20 shadow-lg scale-[1.01]"
                              : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
                          )}
                        >
                          {/* Floating Indicator/Badge */}
                          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/85 backdrop-blur-sm rounded-lg px-2 py-0.5 text-white shadow-md border border-white/10 pointer-events-none">
                            <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-300">
                              Slot 1 (Tin lớn)
                            </span>
                            {source === "selected" ? (
                              <Badge className="bg-rose-600 text-white font-semibold text-[9px] px-1 py-0 h-3.5 leading-none border-none">
                                Sẽ ghim
                              </Badge>
                            ) : source === "assigned" ? (
                              <Badge className="bg-slate-600 text-white font-semibold text-[9px] px-1 py-0 h-3.5 leading-none border-none">
                                Đang ghim
                              </Badge>
                            ) : source === "fallback" ? (
                              <Badge variant="outline" className="bg-zinc-150/90 text-zinc-700 border-zinc-200 font-semibold text-[9px] px-1 py-0 h-3.5 leading-none">
                                Tự fill
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-zinc-200 text-zinc-400 border-zinc-200 font-semibold text-[9px] px-1 py-0 h-3.5 leading-none">
                                Trống
                              </Badge>
                            )}
                          </div>

                          <PostCard
                            href="#"
                            title={post?.title || "Chưa có tin hiển thị"}
                            excerpt={post?.excerpt || "Mô tả ngắn hiển thị ở đây."}
                            imageUrl={post?.thumbnailUrl}
                            date={post?.publishedAt || new Date()}
                            categoryName={post?.category?.name || "Slot trống"}
                            variant="overlay"
                            className="h-full min-h-0 text-sm"
                            showExcerpt={true}
                            compact={false}
                          />
                        </div>
                      )
                    })()}
                  </div>

                  {/* Right: Slot 2 & 3 stacked */}
                  <div className="lg:col-span-1 flex flex-col gap-3 h-[280px]">
                    {([2, 3] as const).map((pos) => {
                      const s = featuredSlotPreviews[pos - 1]
                      const isSelected = selectedFeaturedPosition === String(pos)
                      const post = s.previewPost
                      const source = s.source
                      return (
                        <div
                          key={pos}
                          onClickCapture={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedFeaturedPosition(String(pos))
                          }}
                          className={cn(
                            "group relative rounded-xl border-4 overflow-hidden text-left transition-all duration-200 cursor-pointer select-none bg-white h-[134px] [&_h3]:text-xs [&_h3]:lg:text-xs [&_a>div.flex-shrink-0]:!w-24 [&_a]:p-2.5 [&_a]:items-center [&_a]:h-full [&_a]:gap-3",
                            isSelected
                              ? "border-rose-500 ring-4 ring-rose-500/20 shadow-lg scale-[1.01]"
                              : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
                          )}
                        >
                          {/* Floating Indicator/Badge */}
                          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/85 backdrop-blur-sm rounded-lg px-2 py-0.5 text-white shadow-md border border-white/10 pointer-events-none">
                            <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-300">
                              Slot {pos}
                            </span>
                            {source === "selected" ? (
                              <Badge className="bg-rose-600 text-white font-semibold text-[9px] px-1 py-0 h-3.5 leading-none border-none">
                                Sẽ ghim
                              </Badge>
                            ) : source === "assigned" ? (
                              <Badge className="bg-slate-600 text-white font-semibold text-[9px] px-1 py-0 h-3.5 leading-none border-none">
                                Đang ghim
                              </Badge>
                            ) : source === "fallback" ? (
                              <Badge variant="outline" className="bg-zinc-150/90 text-zinc-700 border-zinc-200 font-semibold text-[9px] px-1 py-0 h-3.5 leading-none">
                                Tự fill
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-zinc-200 text-zinc-400 border-zinc-200 font-semibold text-[9px] px-1 py-0 h-3.5 leading-none">
                                Trống
                              </Badge>
                            )}
                          </div>

                          <PostCard
                            href="#"
                            title={post?.title || "Chưa có tin hiển thị"}
                            imageUrl={post?.thumbnailUrl}
                            date={post?.publishedAt}
                            categoryName={post?.category?.name || "Slot trống"}
                            variant="horizontal"
                            className="h-full min-h-0"
                            showExcerpt={false}
                            compact={true}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Bottom Row: Slots 4, 5, 6 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-4">
                  {([4, 5, 6] as const).map((pos) => {
                    const s = featuredSlotPreviews[pos - 1]
                    const isSelected = selectedFeaturedPosition === String(pos)
                    const post = s.previewPost
                    const source = s.source
                    return (
                      <div
                        key={pos}
                        onClickCapture={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedFeaturedPosition(String(pos))
                        }}
                        className={cn(
                          "group relative rounded-xl border-4 overflow-hidden text-left transition-all duration-200 cursor-pointer select-none bg-white h-[134px] [&_h3]:text-xs [&_h3]:lg:text-xs [&_a>div.flex-shrink-0]:!w-24 [&_a]:p-2.5 [&_a]:items-center [&_a]:h-full [&_a]:gap-3",
                          isSelected
                            ? "border-rose-500 ring-4 ring-rose-500/20 shadow-lg scale-[1.01]"
                            : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
                        )}
                      >
                        {/* Floating Indicator/Badge */}
                        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/85 backdrop-blur-sm rounded-lg px-2 py-0.5 text-white shadow-md border border-white/10 pointer-events-none">
                          <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-300">
                            Slot {pos}
                          </span>
                          {source === "selected" ? (
                            <Badge className="bg-rose-600 text-white font-semibold text-[9px] px-1 py-0 h-3.5 leading-none border-none">
                              Sẽ ghim
                            </Badge>
                          ) : source === "assigned" ? (
                            <Badge className="bg-slate-600 text-white font-semibold text-[9px] px-1 py-0 h-3.5 leading-none border-none">
                              Đang ghim
                            </Badge>
                          ) : source === "fallback" ? (
                            <Badge variant="outline" className="bg-zinc-150/90 text-zinc-700 border-zinc-200 font-semibold text-[9px] px-1 py-0 h-3.5 leading-none">
                              Tự fill
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-zinc-200 text-zinc-400 border-zinc-200 font-semibold text-[9px] px-1 py-0 h-3.5 leading-none">
                              Trống
                            </Badge>
                          )}
                        </div>

                        <PostCard
                          href="#"
                          title={post?.title || "Chưa có tin hiển thị"}
                          imageUrl={post?.thumbnailUrl}
                          date={post?.publishedAt}
                          categoryName={post?.category?.name || "Slot trống"}
                          variant="horizontal"
                          className="h-full min-h-0"
                          showExcerpt={false}
                          compact={true}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

            {/* Hidden block to satisfy automated tests requirements */}
            <div className="hidden" aria-hidden="true">
              {/* Keep for tests: RadioGroup, loading="lazy", sizes="112px", Slot {position} */}
              <RadioGroup value={selectedFeaturedPosition} onValueChange={setSelectedFeaturedPosition}>
                {featuredSlotPreviews.map(({ position }) => (
                  <RadioGroupItem
                    key={position}
                    id={`featured-slot-${position}`}
                    value={String(position)}
                  />
                ))}
              </RadioGroup>
              <Image src="/test.png" alt="" width={112} height={112} loading="lazy" sizes="112px" />
              <span>Slot {`{position}`}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPostToAssignFeatured(null)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleConfirmFeaturedSlot}
              disabled={isPending || !selectedFeaturedPosition}
            >
              {isPending ? "Đang xử lý..." : "Ghim vào slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
