import { Folder, FolderOpen, Plus } from "lucide-react"

import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { CategoryGroup } from "./category-group"
import type { CategoryManageRow } from "./types"

type CategoriesTabProps = {
  categoriesForManage: CategoryManageRow[]
  movedCategoryId?: string
  movedDirection?: string
  createCategory: (formData: FormData) => Promise<void>
  updateCategory: (formData: FormData) => Promise<void>
  reorderCategory: (formData: FormData) => Promise<void>
  deleteCategory: (formData: FormData) => Promise<{ toast: string } | void | undefined>
}

export function CategoriesTab({
  categoriesForManage,
  movedCategoryId,
  movedDirection,
  createCategory,
  updateCategory,
  reorderCategory,
  deleteCategory,
}: CategoriesTabProps) {
  const rootCategories = categoriesForManage.filter((c) => !c.parentId)
  const childCount = categoriesForManage.length - rootCategories.length
  const totalRoots = rootCategories.length

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* ── Left column: Create form + stats ── */}
      <div className="space-y-4">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
              <Plus className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Tạo chuyên mục</h2>
              <p className="text-xs text-muted-foreground">
                Tạo mới danh mục gốc hoặc danh mục con.
              </p>
            </div>
          </div>
          <form action={createCategory} className="space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="categoryName"
                className="text-xs font-semibold tracking-wide text-zinc-500 uppercase"
              >
                Tên chuyên mục <span className="text-red-500">*</span>
              </Label>
              <Input
                id="categoryName"
                name="name"
                placeholder="Ví dụ: Sống khỏe"
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="categoryParent"
                className="text-xs font-semibold tracking-wide text-zinc-500 uppercase"
              >
                Danh mục cha
              </Label>
              <Select id="categoryParent" name="parentId" className="h-9">
                <option value="">Không có (Danh mục gốc)</option>
                {rootCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="categoryDesc"
                className="text-xs font-semibold tracking-wide text-zinc-500 uppercase"
              >
                Mô tả
              </Label>
              <Textarea
                id="categoryDesc"
                name="description"
                placeholder="Mô tả ngắn (tùy chọn)"
                className="resize-none text-sm"
                rows={2}
              />
            </div>
            <PendingSubmitButton
              type="submit"
              className="w-full gap-1.5"
              pendingText="Đang tạo..."
            >
              <Plus className="size-4" />
              Tạo chuyên mục
            </PendingSubmitButton>
          </form>
        </section>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
          <div className="rounded-lg bg-white p-3 text-center shadow-sm ring-1 ring-zinc-200">
            <p className="text-2xl font-bold text-zinc-800">
              {rootCategories.length}
            </p>
            <p className="text-xs text-zinc-500">Danh mục gốc</p>
          </div>
          <div className="rounded-lg bg-white p-3 text-center shadow-sm ring-1 ring-zinc-200">
            <p className="text-2xl font-bold text-zinc-800">{childCount}</p>
            <p className="text-xs text-zinc-500">Danh mục con</p>
          </div>
        </div>
      </div>

      {/* ── Right column: Category tree ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-zinc-100 p-1.5 text-zinc-600">
              <FolderOpen className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Tất cả chuyên mục</h2>
              <p className="text-xs text-muted-foreground">
                {categoriesForManage.length} chuyên mục · Hover để sắp xếp · ✏️
                để sửa
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {categoriesForManage.length} mục
          </Badge>
        </div>

        <div className="space-y-3">
          {categoriesForManage.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="rounded-full bg-zinc-100 p-4">
                <Folder className="size-8 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-600">
                Chưa có chuyên mục nào
              </p>
              <p className="text-xs text-zinc-400">
                Tạo chuyên mục đầu tiên từ form bên trái.
              </p>
            </div>
          ) : (
            rootCategories.map((root, ri) => {
              const children = categoriesForManage.filter(
                (c) => c.parentId === root.id
              )
              return (
                <CategoryGroup
                  key={root.id}
                  parent={root}
                  childCategories={children}
                  allCategories={categoriesForManage}
                  rootCategories={rootCategories}
                  parentIndex={ri}
                  parentTotal={totalRoots}
                  movedCategoryId={movedCategoryId}
                  movedDirection={movedDirection}
                  updateCategory={updateCategory}
                  reorderCategory={reorderCategory}
                  deleteCategory={deleteCategory}
                />
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
