"use client"

import { useRouter } from "next/navigation"
import { CalendarDays, FolderKanban, Search, UserRound, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

import { useAdminFilterForm } from "@/hooks/use-admin-filter-form"
import type { PostsData, PostsFilters } from "./types"

type PostsFilterBarProps = {
  filters: PostsFilters
  filterOptions: PostsData["filterOptions"]
  isAdmin: boolean
  hasActiveFilters: boolean
}

export function PostsFilterBar({
  filters,
  filterOptions,
  isAdmin,
  hasActiveFilters,
}: PostsFilterBarProps) {
  const router = useRouter()
  const { onSubmit } = useAdminFilterForm()

  return (
    <form
      method="get"
      onSubmit={onSubmit}
      className="sticky top-4 z-30 flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white p-2.5"
    >
      <input type="hidden" name="tab" value="posts" />
      <input type="hidden" name="postsPage" value="1" />
      <input type="hidden" name="postsStatus" value={filters.status} />
      <input type="hidden" name="postsApproval" value="all" />

      {/* Search input */}
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          name="postsQ"
          defaultValue={filters.query}
          placeholder="Tìm tiêu đề, slug, tác giả..."
          className="h-8 pl-8 text-sm"
        />
      </div>

      {isAdmin ? (
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Select
            name="postsAuthor"
            defaultValue={filters.authorId || "all"}
            className="h-8 w-auto min-w-44 pl-8 text-sm"
            onChange={(e) => e.target.form?.requestSubmit()}
          >
            <option value="all">Tất cả tác giả</option>
            {filterOptions.authors.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <input type="hidden" name="postsAuthor" value={filters.authorId || "all"} />
      )}

      <div className="relative">
        <FolderKanban className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
        <Select
          name="postsCategory"
          defaultValue={filters.categoryId || "all"}
          className="h-8 w-auto min-w-44 pl-8 text-sm"
          onChange={(e) => e.target.form?.requestSubmit()}
        >
          <option value="all">Tất cả danh mục</option>
          {filterOptions.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          name="postsFrom"
          type="date"
          defaultValue={filters.fromDate}
          className="h-8 w-auto pl-8 text-sm"
          title="Từ ngày"
          onChange={(e) => e.target.form?.requestSubmit()}
        />
      </div>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          name="postsTo"
          type="date"
          defaultValue={filters.toDate}
          className="h-8 w-auto pl-8 text-sm"
          title="Đến ngày"
          onChange={(e) => e.target.form?.requestSubmit()}
        />
      </div>

      <Button type="submit" size="sm" className="h-8 gap-1.5 text-xs">
        <Search className="size-3" />
        Lọc
      </Button>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-zinc-500"
          onClick={() => router.replace(`/admin?tab=posts&postsStatus=${filters.status}`, { scroll: false })}
        >
          <X className="size-3" />
          Xóa lọc
        </Button>
      )}
    </form>
  )
}
