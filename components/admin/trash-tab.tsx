"use client"

import { useRouter } from "next/navigation"
import { CalendarDays, RotateCcw, Search, Trash2, UserRound, X } from "lucide-react"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { PostThumbnail } from "@/components/admin/post-thumbnail"
import { showToastByKey } from "@/components/admin/action-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useAdminFilterForm } from "@/hooks/use-admin-filter-form"
import { AdminPagination } from "./admin-pagination"
import { Card, CardContent } from "@/components/ui/card"

type TrashedPost = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  createdAt: Date
  publishedAt: Date
  approvedAt: Date | null
  deletedAt: Date | null
  author: {
    id: string
    name: string
    email: string
  } | null
  category: {
    slug: string
  }
}

type TrashTabProps = {
  isAdmin: boolean
  data: {
    rows: TrashedPost[]
    totalCount: number
    totalPages: number
    currentPage: number
    paginationItems: Array<number | "ellipsis">
    authorOptions: Array<{ id: string; name: string; email: string }>
  }
  filters: {
    query: string
    authorId: string
    fromDate: string
    toDate: string
  }
  restorePostFromTrash: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  deletePostPermanently: (formData: FormData) => Promise<{ toast: string } | void | undefined>
}

export function TrashTab({
  isAdmin,
  data,
  filters,
  restorePostFromTrash,
  deletePostPermanently,
}: TrashTabProps) {
  const router = useRouter()
  const { onSubmit } = useAdminFilterForm()
  const hasActiveFilters = Boolean(filters.query || (isAdmin && filters.authorId && filters.authorId !== "all") || filters.fromDate || filters.toDate)

  function buildPageHref(page: number) {
    return (
      `/admin?tab=trash` +
      (filters.query ? `&trashQ=${encodeURIComponent(filters.query)}` : "") +
      (isAdmin && filters.authorId && filters.authorId !== "all" ? `&trashAuthor=${encodeURIComponent(filters.authorId)}` : "") +
      (filters.fromDate ? `&trashFrom=${encodeURIComponent(filters.fromDate)}` : "") +
      (filters.toDate ? `&trashTo=${encodeURIComponent(filters.toDate)}` : "") +
      `&trashPage=${page}`
    )
  }

  return (
    <div className="space-y-4">
      <form
        method="get"
        onSubmit={onSubmit}
        className="sticky top-4 z-30 flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white p-2.5"
      >
        <input type="hidden" name="tab" value="trash" />
        <input type="hidden" name="trashPage" value="1" />

        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            name="trashQ"
            defaultValue={filters.query}
            placeholder="Tìm theo tiêu đề, slug, danh mục hoặc tác giả..."
            className="h-8 pl-8 text-sm"
          />
        </div>

        {isAdmin ? (
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Select name="trashAuthor" defaultValue={filters.authorId || "all"} className="h-8 w-auto min-w-44 pl-8 text-sm" onChange={(e) => e.target.form?.requestSubmit()}>
              <option value="all">Tất cả người viết</option>
              {data.authorOptions.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} ({author.email})
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <input type="hidden" name="trashAuthor" value="" />
        )}

        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input name="trashFrom" type="date" defaultValue={filters.fromDate} className="h-8 w-auto pl-8 text-sm" title="Từ ngày" onChange={(e) => e.target.form?.requestSubmit()} />
        </div>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input name="trashTo" type="date" defaultValue={filters.toDate} className="h-8 w-auto pl-8 text-sm" title="Đến ngày" onChange={(e) => e.target.form?.requestSubmit()} />
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
            onClick={() => router.replace(`/admin?tab=trash`, { scroll: false })}
          >
            <X className="size-3" />
            Xóa lọc
          </Button>
        )}
      </form>

      {data.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Thùng rác đang trống.</p>
      ) : (
        <div className="space-y-3">
          {data.rows.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <PostThumbnail
                      src={post.thumbnailUrl}
                      alt={post.title}
                      width={80}
                      height={56}
                    />
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        /{post.category.slug}/{post.slug}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Người viết: {post.author?.name || "Không rõ"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Đã xóa lúc:{" "}
                        {post.deletedAt
                          ? new Date(post.deletedAt).toLocaleString("vi-VN")
                          : "Không rõ"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={async (fd) => {
                      const res = await restorePostFromTrash(fd)
                      if (res && res.toast) showToastByKey(res.toast)
                    }}>
                      <input type="hidden" name="postId" value={post.id} />
                      <PendingSubmitButton
                        type="submit"
                        size="sm"
                        variant="outline"
                        pendingText="Đang khôi phục..."
                      >
                        <RotateCcw className="size-4" />
                        Khôi phục
                      </PendingSubmitButton>
                    </form>
                    <ConfirmActionForm
                      action={deletePostPermanently}
                      fields={[{ name: "postId", value: post.id }]}
                      confirmMessage="Xóa vĩnh viễn bài viết này? Hành động này không thể hoàn tác."
                    >
                      <PendingSubmitButton
                        type="submit"
                        size="sm"
                        variant="destructive"
                        pendingText="Đang xóa..."
                      >
                        <Trash2 className="size-4" />
                        Xóa vĩnh viễn
                      </PendingSubmitButton>
                    </ConfirmActionForm>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AdminPagination
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        totalCount={data.totalCount}
        paginationItems={data.paginationItems}
        buildPageHref={buildPageHref}
      />
    </div>
  )
}
