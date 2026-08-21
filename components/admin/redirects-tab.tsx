"use client"

import { useState, useMemo, startTransition } from "react"
import {
  ArrowRight,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  ExternalLink,
  ChevronsUpDown,
} from "lucide-react"
import { getOptimizedImageUrl } from "@/lib/cloudinary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Card, CardContent } from "@/components/ui/card"

import { Checkbox } from "@/components/ui/checkbox"
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

// ─── Types ───────────────────────────────────────────────────────────────────

type RedirectRow = {
  id: string
  fromPath: string
  toPath: string
  isActive: boolean
  note: string | null
  createdAt: Date
}

type PostOption = {
  slug: string
  categorySlug: string
  title: string
  path: string
  thumbnailUrl: string | null
}

type RedirectsTabProps = {
  redirects: RedirectRow[]
  publishedPosts: PostOption[]
  createRedirect: (formData: FormData) => Promise<void>
  deleteRedirect: (formData: FormData) => Promise<void>
  toggleRedirect: (formData: FormData) => Promise<void>
}

// ─── Post Combobox — uses Popover + Command (same as PenNameSelect) ──────────

function PostCombobox({
  id,
  name,
  label,
  placeholder,
  posts,
  value,
  onChange,
}: {
  id: string
  name: string
  label: string
  placeholder: string
  posts: PostOption[]
  value: string
  onChange: (path: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = posts.find((p) => p.path === value) ?? null

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full flex items-center justify-between px-3 min-w-0 overflow-hidden"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 mr-2 text-left overflow-hidden">
              {selected ? (
                <>
                  {selected.thumbnailUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getOptimizedImageUrl(selected.thumbnailUrl, { width: 48, height: 48, crop: "fill" })}
                        alt=""
                        loading="lazy"
                        className="size-6 shrink-0 rounded object-cover bg-zinc-100 border border-zinc-200"
                      />
                    </>
                  ) : (
                    <div className="size-6 shrink-0 rounded bg-zinc-100 border border-zinc-200" />
                  )}
                  <span className="truncate text-sm font-medium text-zinc-900 max-w-[260px] sm:max-w-[320px]">
                    {selected.title}
                  </span>
                </>
              ) : (
                <span className="text-zinc-400 font-normal">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Tìm tiêu đề bài..." />
            <CommandList className="max-h-64">
              <CommandEmpty>Không tìm thấy bài nào.</CommandEmpty>
              <CommandGroup>
                {posts.map((post) => (
                  <CommandItem
                    key={post.path}
                    value={post.title}
                    onSelect={() => {
                      onChange(post.path)
                      setOpen(false)
                    }}
                    className="w-full flex items-start gap-2.5 py-2.5 px-3 cursor-pointer"
                  >
                    {post.thumbnailUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getOptimizedImageUrl(post.thumbnailUrl, { width: 72, height: 72, crop: "fill" })}
                          alt=""
                          loading="lazy"
                          className="size-9 shrink-0 rounded object-cover bg-zinc-100 border border-zinc-100"
                        />
                      </>
                    ) : (
                      <div className="size-9 shrink-0 rounded bg-zinc-50 border border-zinc-200" />
                    )}
                    <div className="flex w-full min-w-0 flex-col gap-0.5">
                      <span className="block text-sm font-medium whitespace-normal break-words text-zinc-900 leading-snug">
                        {post.title}
                      </span>
                      <span className="block text-xs text-zinc-400 break-all leading-normal font-mono">
                        {post.path}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected && (
        <p className="text-xs text-zinc-400 pl-0.5">{selected.path}</p>
      )}
    </div>
  )
}

// ─── Add Redirect Dialog ──────────────────────────────────────────────────────

function AddRedirectDialog({
  posts,
  createRedirect,
}: {
  posts: PostOption[]
  createRedirect: (formData: FormData) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [fromPath, setFromPath] = useState("")
  const [toPath, setToPath] = useState("")

  const canSubmit = fromPath && toPath && fromPath !== toPath

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) {
      setFromPath("")
      setToPath("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Thêm redirect
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm redirect 301 mới</DialogTitle>
        </DialogHeader>
        <form action={createRedirect} className="space-y-4 pt-2">
          <PostCombobox
            id="fromPath"
            name="fromPath"
            label="Từ bài (nguồn — sẽ bị redirect đi)"
            placeholder="Chọn bài nguồn..."
            posts={posts}
            value={fromPath}
            onChange={setFromPath}
          />

          {fromPath && (
            <div className="flex items-center justify-center gap-2 text-zinc-400">
              <ArrowRight className="size-5" />
              <span className="text-xs">301 Redirect về</span>
            </div>
          )}

          <PostCombobox
            id="toPath"
            name="toPath"
            label="Về bài (đích — bài Pillar)"
            placeholder="Chọn bài đích..."
            posts={posts}
            value={toPath}
            onChange={setToPath}
          />

          {fromPath === toPath && fromPath && (
            <p className="text-xs text-rose-600">
              Bài nguồn và bài đích không thể giống nhau.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="note">Ghi chú (tuỳ chọn)</Label>
            <Input
              id="note"
              name="note"
              placeholder="Ví dụ: cannibalization fix — tam thất VHL"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Huỷ
            </Button>
            <PendingSubmitButton
              type="submit"
              size="sm"
              disabled={!canSubmit}
              pendingText="Đang lưu..."
            >
              Lưu redirect
            </PendingSubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Tab ────────────────────────────────────────────────────────────────

export function RedirectsTab({
  redirects,
  publishedPosts,
  createRedirect,
  deleteRedirect,
  toggleRedirect,
}: RedirectsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteRepublish, setDeleteRepublish] = useState(false)
  const [toggleConfirmRow, setToggleConfirmRow] = useState<RedirectRow | null>(null)
  const [toggleRepublish, setToggleRepublish] = useState(false)

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return redirects
    return redirects.filter(
      (r) =>
        r.fromPath.toLowerCase().includes(q) ||
        r.toPath.toLowerCase().includes(q) ||
        (r.note || "").toLowerCase().includes(q)
    )
  }, [redirects, searchQuery])

  const grouped = useMemo(() => {
    const groups: Record<string, typeof redirects> = {}
    for (const r of filtered) {
      if (!groups[r.toPath]) {
        groups[r.toPath] = []
      }
      groups[r.toPath].push(r)
    }
    return Object.entries(groups).map(([toPath, items]) => ({
      toPath,
      items,
    }))
  }, [filtered])

  const activeCount = redirects.filter((r) => r.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Quản lý Redirect 301</h2>
          <p className="text-sm text-zinc-500">
            {redirects.length} redirect · {activeCount} đang hoạt động
          </p>
        </div>
        <AddRedirectDialog posts={publishedPosts} createRedirect={createRedirect} />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <Input
          className="pl-8"
          placeholder="Tìm theo URL hoặc ghi chú..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {redirects.length === 0 && (
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 py-12 text-center">
          <ArrowRight className="mx-auto size-10 text-zinc-300" />
          <p className="mt-3 font-medium text-zinc-600">Chưa có redirect nào</p>
          <p className="mt-1 text-sm text-zinc-400">
            Thêm redirect để gom link juice về bài Pillar SEO
          </p>
        </div>
      )}

      {/* Redirect list */}
      {grouped.length > 0 && (
        <div className="space-y-4">
          {grouped.map(({ toPath, items }) => (
            <Card key={toPath} className="overflow-hidden border-zinc-200 bg-white rounded-md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/75 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Bài Pillar đích:
                  </span>
                  <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700 font-mono">
                    <span className="truncate">{toPath}</span>
                    <a
                      href={toPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-emerald-400 hover:text-emerald-600"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 font-medium">
                  {items.length} bài chuyển hướng
                </Badge>
              </div>

              <CardContent className="p-0 divide-y divide-zinc-100">
                {items.map((row) => (
                  <div
                    key={row.id}
                    className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-opacity ${
                      row.isActive ? "" : "opacity-60 bg-zinc-50/30"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 text-sm">
                      <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1">
                        <span className="truncate font-mono text-xs text-rose-700">
                          {row.fromPath}
                        </span>
                        <a
                          href={row.fromPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-rose-400 hover:text-rose-600"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      </div>

                      <Badge
                        variant={row.isActive ? "default" : "outline"}
                        className={`shrink-0 text-[10px] h-5 px-1.5 font-medium ${
                          row.isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : "text-zinc-400"
                        }`}
                      >
                        {row.isActive ? "Đang chạy" : "Tắt"}
                      </Badge>

                      {row.note && (
                        <span className="truncate text-xs text-zinc-500 max-w-[200px]" title={row.note}>
                          📝 {row.note}
                        </span>
                      )}

                      <span className="text-[10px] text-zinc-400">
                        {new Date(row.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      {row.isActive ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-zinc-500 hover:text-zinc-900"
                          title="Tắt redirect"
                          onClick={() => setToggleConfirmRow(row)}
                        >
                          <ToggleRight className="size-4 text-emerald-600" />
                        </Button>
                      ) : (
                        <form action={toggleRedirect}>
                          <input type="hidden" name="redirectId" value={row.id} />
                          <input type="hidden" name="isActive" value={String(row.isActive)} />
                          <PendingSubmitButton
                            type="submit"
                            variant="ghost"
                            size="sm"
                            pendingText="..."
                            className="h-8 px-2 text-zinc-500 hover:text-zinc-900"
                            title="Bật redirect"
                          >
                            <ToggleLeft className="size-4" />
                          </PendingSubmitButton>
                        </form>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-zinc-400 hover:text-rose-600"
                        title="Xóa redirect"
                        onClick={() => setDeleteConfirmId(row.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && redirects.length > 0 && (
        <p className="text-center text-sm text-zinc-500">
          Không tìm thấy redirect nào khớp với &ldquo;{searchQuery}&rdquo;
        </p>
      )}

      {/* Dialog xác nhận xóa kèm tùy chọn tái xuất bản */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa redirect</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa redirect này không? Hành động này sẽ loại bỏ luật chuyển hướng ngay lập tức.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="delete-republish"
              checked={deleteRepublish}
              onCheckedChange={(checked) => setDeleteRepublish(!!checked)}
            />
            <Label htmlFor="delete-republish" className="cursor-pointer text-sm font-medium text-zinc-900">
              Đồng thời xuất bản lại bài viết cũ tương ứng (nếu có)
            </Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteRepublish(false)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const id = deleteConfirmId
                const rep = deleteRepublish
                setDeleteConfirmId(null)
                setDeleteRepublish(false)
                if (id) {
                  startTransition(async () => {
                    const fd = new FormData()
                    fd.append("redirectId", id)
                    fd.append("republish", String(rep))
                    await deleteRedirect(fd)
                  })
                }
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog xác nhận tắt kèm tùy chọn tái xuất bản */}
      <AlertDialog open={toggleConfirmRow !== null} onOpenChange={(open) => !open && setToggleConfirmRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận tắt redirect</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn tắt redirect này không? Khi tắt, đường dẫn nguồn sẽ không còn tự động chuyển hướng nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="toggle-republish"
              checked={toggleRepublish}
              onCheckedChange={(checked) => setToggleRepublish(!!checked)}
            />
            <Label htmlFor="toggle-republish" className="cursor-pointer text-sm font-medium text-zinc-900">
              Đồng thời xuất bản lại bài viết cũ tương ứng (nếu có)
            </Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToggleRepublish(false)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const row = toggleConfirmRow
                const rep = toggleRepublish
                setToggleConfirmRow(null)
                setToggleRepublish(false)
                if (row) {
                  startTransition(async () => {
                    const fd = new FormData()
                    fd.append("redirectId", row.id)
                    fd.append("isActive", String(row.isActive))
                    fd.append("republish", String(rep))
                    await toggleRedirect(fd)
                  })
                }
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
