"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Check, FileText, Folder, Hash, Pencil, Trash2, X } from "lucide-react"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"

import type { CategoryActions, CategoryManageRow } from "./types"

type CategoryRowProps = {
  category: CategoryManageRow
  allCategories: CategoryManageRow[]
  rootCategories: CategoryManageRow[]
  isChild: boolean
  index: number
  totalCount: number
  movedCategoryId?: string
  movedDirection?: string
} & CategoryActions

export function CategoryRow({
  category,
  allCategories,
  rootCategories,
  isChild,
  index,
  totalCount,
  movedCategoryId,
  movedDirection,
  updateCategory,
  reorderCategory,
  deleteCategory,
}: CategoryRowProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isJustMoved = movedCategoryId === category.id

  return (
    <div
      className={cn(
        "group relative rounded-md border bg-white transition-colors duration-150",
        isChild ? "border-zinc-200 bg-zinc-50/40" : "border-zinc-200",
        isJustMoved
          ? "border-rose-400 ring-2 ring-rose-200"
          : "hover:border-zinc-300"
      )}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div
          className={cn(
            "shrink-0 rounded-md p-1.5",
            isChild ? "bg-rose-50 text-rose-600" : "bg-zinc-100 text-zinc-600"
          )}
        >
          {isChild ? <FileText className="size-4" /> : <Folder className="size-4" />}
        </div>

        {/* Name + slug */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "font-semibold",
                isChild ? "text-sm text-zinc-800" : "text-base text-zinc-900"
              )}
            >
              {category.name}
            </span>
            {isJustMoved && (
              <Badge variant="outline" className="border-rose-300 text-xs text-rose-600">
                {movedDirection === "up" ? "↑ Vừa đẩy lên" : "↓ Vừa đẩy xuống"}
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
            <Hash className="size-3" />
            <span className="font-mono">{category.slug}</span>
            {category.description && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="max-w-[200px] truncate">{category.description}</span>
              </>
            )}
          </div>
        </div>

        {/* Stats + actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              category._count.posts > 0
                ? "bg-blue-50 text-blue-700"
                : "bg-zinc-100 text-zinc-500"
            )}
          >
            {category._count.posts} bài
          </Badge>

          {/* Reorder up */}
          <form action={reorderCategory}>
            <input type="hidden" name="categoryId" value={category.id} />
            <input type="hidden" name="direction" value="up" />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
              disabled={index === 0}
            >
              <ArrowUp className="size-3.5" />
            </Button>
          </form>

          {/* Reorder down */}
          <form action={reorderCategory}>
            <input type="hidden" name="categoryId" value={category.id} />
            <input type="hidden" name="direction" value="down" />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
              disabled={index === totalCount - 1}
            >
              <ArrowDown className="size-3.5" />
            </Button>
          </form>

          {/* Edit toggle */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "size-7 transition-colors",
              editing
                ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                : "hover:bg-zinc-100"
            )}
            onClick={() => {
              setEditing((v) => !v)
              setDeleting(false)
            }}
            title="Chỉnh sửa"
          >
            {editing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
          </Button>

          {/* Delete toggle */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "size-7 transition-colors",
              deleting
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "hover:bg-zinc-100 hover:text-red-500"
            )}
            onClick={() => {
              setDeleting((v) => !v)
              setEditing(false)
            }}
            title="Xóa chuyên mục"
          >
            {deleting ? <X className="size-3.5" /> : <Trash2 className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* ── Edit panel ── */}
      {editing && (
        <div className="border-t border-amber-100 bg-amber-50/50 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Chỉnh sửa chuyên mục
          </p>
          <form
            action={async (fd) => {
              await updateCategory(fd)
              setEditing(false)
            }}
            className="space-y-2"
          >
            <input type="hidden" name="categoryId" value={category.id} />
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Tên chuyên mục</Label>
                <Input
                  name="name"
                  defaultValue={category.name}
                  placeholder="Tên chuyên mục"
                  required
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Danh mục cha</Label>
                <Select
                  name="parentId"
                  defaultValue={category.parentId || ""}
                  className="h-8 text-sm"
                >
                  <option value="">Không có (Danh mục gốc)</option>
                  {rootCategories
                    .filter((c) => c.id !== category.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mô tả</Label>
                <Input
                  name="description"
                  defaultValue={category.description || ""}
                  placeholder="Mô tả ngắn"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <PendingSubmitButton
                type="submit"
                size="sm"
                className="h-7 gap-1.5 bg-amber-600 text-xs hover:bg-amber-700"
                pendingText="Đang lưu..."
              >
                <Check className="size-3" />
                Lưu thay đổi
              </PendingSubmitButton>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setEditing(false)}
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delete panel ── */}
      {deleting && (
        <div className="border-t border-red-100 bg-red-50/50 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
            Xóa chuyên mục
          </p>
          <ConfirmActionForm
            action={async (fd) => {
              const res = await deleteCategory(fd)
              setDeleting(false)
              return res
            }}
            className="space-y-2"
            fields={[{ name: "categoryId", value: category.id }]}
            confirmMessage={
              category._count.posts > 0
                ? `Xóa chuyên mục "${category.name}"? ${category._count.posts} bài viết sẽ được chuyển sang chuyên mục đã chọn.`
                : `Bạn có chắc muốn xóa chuyên mục "${category.name}"?`
            }
          >
            {category._count.posts > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">
                  Chuyển {category._count.posts} bài sang chuyên mục
                </Label>
                <Select
                  id={`moveTo-${category.id}`}
                  name="moveToCategoryId"
                  required
                  className="h-8 text-sm"
                >
                  <option value="">Chọn chuyên mục đích</option>
                  {allCategories
                    .filter((item) => item.id !== category.id)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.parent ? `  └ ${item.name}` : item.name}
                      </option>
                    ))}
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              <PendingSubmitButton
                type="submit"
                size="sm"
                variant="destructive"
                disabled={allCategories.length <= 1}
                className="h-7 gap-1.5 text-xs"
                pendingText="Đang xóa..."
              >
                <Trash2 className="size-3" />
                Xác nhận xóa
              </PendingSubmitButton>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setDeleting(false)}
              >
                Hủy
              </Button>
            </div>
          </ConfirmActionForm>
        </div>
      )}
    </div>
  )
}
