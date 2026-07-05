"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye, Check, X } from "lucide-react"
import { PostThumbnail } from "@/components/admin/post-thumbnail"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"

type PendingPost = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  author: { name: string } | null
  category: { name: string; slug: string }
  editorialStatus: string
}

type PendingPostsTabProps = {
  rows: PendingPost[]
  approvePendingPost: (formData: FormData) => Promise<void>
  rejectPendingPost: (formData: FormData) => Promise<void>
}

export function PendingPostsTab({
  rows,
  approvePendingPost,
  rejectPendingPost,
}: PendingPostsTabProps) {
  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-white text-zinc-500">
        Không có bài viết nào đang chờ duyệt.
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bài viết</TableHead>
            <TableHead>Chuyên mục</TableHead>
            <TableHead>Người viết</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((post) => (
            <TableRow key={post.id}>
              <TableCell>
                <div className="flex items-start gap-3">
                  <PostThumbnail
                    src={post.thumbnailUrl}
                    alt={post.title}
                    width={64}
                    height={48}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      /{post.category.slug}/{post.slug}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{post.category.name}</TableCell>
              <TableCell>
                <p className="text-sm font-medium">
                  {post.author?.name || "Ẩn danh"}
                </p>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {post.editorialStatus === "PENDING_REVIEW"
                    ? "Chờ duyệt"
                    : "Chờ xuất bản"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/preview/${post.id}`} target="_blank">
                    <Button variant="ghost" size="icon" title="Xem trước">
                      <Eye className="size-4" />
                    </Button>
                  </Link>
                  <form action={approvePendingPost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <PendingSubmitButton
                      variant="ghost"
                      size="icon"
                      className="text-emerald-600"
                      title="Duyệt"
                      pendingText="..."
                    >
                      <Check className="size-4" />
                    </PendingSubmitButton>
                  </form>
                  <form action={rejectPendingPost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <PendingSubmitButton
                      variant="ghost"
                      size="icon"
                      className="text-rose-600"
                      title="Trả lại"
                      pendingText="..."
                    >
                      <X className="size-4" />
                    </PendingSubmitButton>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
