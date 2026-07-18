import Link from "next/link"
import { Check, Eye, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Card, CardContent } from "@/components/ui/card"

type PendingComment = {
  id: string
  authorName: string
  content: string
  post: {
    slug: string
    category: {
      slug: string
    }
  }
}

type CommentsTabProps = {
  pendingComments: PendingComment[]
  moderateComment: (formData: FormData) => Promise<void>
}

export function CommentsTab({
  pendingComments,
  moderateComment,
}: CommentsTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">Bình luận chờ duyệt</p>
      {pendingComments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Không có bình luận chờ duyệt.
        </p>
      ) : (
        pendingComments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{comment.authorName}</p>
                <Badge variant="outline">
                  /{comment.post.category.slug}/{comment.post.slug}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-zinc-700">{comment.content}</p>
              <div className="mt-3 flex gap-2">
                <form action={moderateComment}>
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="action" value="approve" />
                  <PendingSubmitButton
                    type="submit"
                    size="sm"
                    pendingText="Đang duyệt..."
                  >
                    <Check className="size-4" />
                    Duyệt
                  </PendingSubmitButton>
                </form>
                <form action={moderateComment}>
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="action" value="delete" />
                  <PendingSubmitButton
                    type="submit"
                    size="sm"
                    variant="destructive"
                    pendingText="Đang xóa..."
                  >
                    <Trash2 className="size-4" />
                    Xóa
                  </PendingSubmitButton>
                </form>
                <Button asChild variant="outline" size="sm" className="ml-auto">
                  <Link
                    href={`/${comment.post.category.slug}/${comment.post.slug}`}
                    target="_blank"
                  >
                    <Eye className="size-4" />
                    Xem bài viết
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
