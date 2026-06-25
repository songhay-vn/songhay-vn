import Link from "next/link"
import {
  Archive,
  ArrowUpRight,
  Ban,
  Eye,
  EyeOff,
  Globe,
  Pencil,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  Send,
  Trash2,
} from "lucide-react"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Button } from "@/components/ui/button"

import { canEditPost } from "./types"
import type { PostActions, PostPermissions, PostRow, FeaturedPostRow } from "./types"

type PostActionsCellProps = {
  post: PostRow
  featuredPosts?: FeaturedPostRow[]
  onSetFeatured?: () => void
  onRemoveFeatured?: () => void
} & PostPermissions &
  PostActions

export function PostActionsCell({
  post,
  canDeletePost,
  currentUserId,
  canSubmitPendingReview,
  canSubmitPendingPublish,
  canReviewPending,
  canPublishNow,
  canEditDraft,
  canEditPendingReview,
  canEditPendingPublish,
  canEditPublished,
  submitPostToPendingReview,
  promotePostToPendingPublish,
  approvePendingPost,
  rejectPendingPost,
  returnPostToDraft,
  returnPostToPendingReview,
  returnPostToPendingPublish,
  movePostToTrash,
  checkPostIndex,
  featuredPosts,
  onSetFeatured,
  onRemoveFeatured,
}: PostActionsCellProps) {
  const editable = canEditPost(post, {
    canEditDraft,
    canEditPendingReview,
    canEditPendingPublish,
    canEditPublished,
  })

  const btn = "h-7 px-2.5 text-xs"

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* ── Workflow ── */}
        {canSubmitPendingReview &&
          (post.editorialStatus === "DRAFT" ||
            post.editorialStatus === "REJECTED") && (
            <ConfirmActionForm
              action={submitPostToPendingReview}
              fields={[{ name: "postId", value: post.id }]}
              confirmMessage="Chuyển bài này lên chờ duyệt?"
            >
              <PendingSubmitButton
                type="submit"
                size="sm"
                variant="outline"
                className={btn}
                pendingText="Đang chuyển..."
              >
                <Send className="mr-1.5 size-3" />
                Lên duyệt
              </PendingSubmitButton>
            </ConfirmActionForm>
          )}

        {(canReviewPending || canSubmitPendingPublish) &&
          post.editorialStatus === "PENDING_REVIEW" && (
            <ConfirmActionForm
              action={promotePostToPendingPublish}
              fields={[{ name: "postId", value: post.id }]}
              confirmMessage="Chuyển bài này lên chờ xuất bản?"
            >
              <PendingSubmitButton
                type="submit"
                size="sm"
                className={`${btn} bg-sky-600 hover:bg-sky-700`}
                pendingText="Đang chuyển..."
              >
                <ArrowUpRight className="mr-1.5 size-3" />
                Lên đăng
              </PendingSubmitButton>
            </ConfirmActionForm>
          )}

        {canPublishNow && post.editorialStatus === "PENDING_REVIEW" && (
          <ConfirmActionForm
            action={approvePendingPost}
            fields={[{ name: "postId", value: post.id }]}
            confirmMessage="Xuất bản ngay bài viết này?"
          >
            <PendingSubmitButton
              type="submit"
              size="sm"
              className={`${btn} bg-emerald-600 hover:bg-emerald-700`}
              pendingText="Đang đăng..."
            >
              <Globe className="mr-1.5 size-3" />
              Xuất bản ngay
            </PendingSubmitButton>
          </ConfirmActionForm>
        )}

        {canPublishNow && post.editorialStatus === "PENDING_PUBLISH" && (
          <ConfirmActionForm
            action={approvePendingPost}
            fields={[{ name: "postId", value: post.id }]}
            confirmMessage="Xuất bản bài viết này?"
          >
            <PendingSubmitButton
              type="submit"
              size="sm"
              className={`${btn} bg-emerald-600 hover:bg-emerald-700`}
              pendingText="Đang đăng..."
            >
              <Globe className="mr-1.5 size-3" />
              Xuất bản
            </PendingSubmitButton>
          </ConfirmActionForm>
        )}

        {canReviewPending &&
          (post.editorialStatus === "PENDING_REVIEW" ||
            post.editorialStatus === "PENDING_PUBLISH") && (
            <ConfirmActionForm
              action={rejectPendingPost}
              fields={[{ name: "postId", value: post.id }]}
              confirmMessage="Từ chối bài viết này?"
            >
              <PendingSubmitButton
                type="submit"
                size="sm"
                variant="destructive"
                className={btn}
                pendingText="Đang từ chối..."
              >
                <Ban className="mr-1.5 size-3" />
                Từ chối
              </PendingSubmitButton>
            </ConfirmActionForm>
          )}

        {canReviewPending && post.editorialStatus === "PENDING_PUBLISH" && (
          <ConfirmActionForm
            action={returnPostToPendingReview}
            fields={[{ name: "postId", value: post.id }]}
            confirmMessage="Chuyển bài này về chờ duyệt?"
          >
            <PendingSubmitButton
              type="submit"
              size="sm"
              variant="outline"
              className={btn}
              pendingText="Đang chuyển..."
            >
              <RotateCcw className="mr-1.5 size-3" />
              Về duyệt
            </PendingSubmitButton>
          </ConfirmActionForm>
        )}

        {(canReviewPending || canPublishNow) &&
          post.editorialStatus !== "DRAFT" && (
            <ConfirmActionForm
              action={returnPostToDraft}
              fields={[{ name: "postId", value: post.id }]}
              confirmMessage="Trả bài này về kho nháp?"
            >
              <PendingSubmitButton
                type="submit"
                size="sm"
                variant="outline"
                className={btn}
                pendingText="Đang trả về..."
              >
                <Archive className="mr-1.5 size-3" />
                Về kho
              </PendingSubmitButton>
            </ConfirmActionForm>
          )}

        {canPublishNow && post.editorialStatus === "PUBLISHED" && (
          <ConfirmActionForm
            action={returnPostToPendingPublish}
            fields={[{ name: "postId", value: post.id }]}
            confirmMessage="Trả bài này về chờ xuất bản?"
          >
            <PendingSubmitButton
              type="submit"
              size="sm"
              variant="outline"
              className={btn}
              pendingText="Đang trả về..."
            >
              <EyeOff className="mr-1.5 size-3" />
              Bỏ đăng
            </PendingSubmitButton>
          </ConfirmActionForm>
        )}

        {/* ── Divider ── */}
        <span className="h-4 w-px shrink-0 bg-zinc-200" />

        {/* ── Edit / Preview ── */}
        {editable ? (
          <Link href={`/admin/edit/${post.id}`}>
            <Button size="sm" variant="secondary" className={btn}>
              <Pencil className="mr-1.5 size-3" />
              Sửa bài
            </Button>
          </Link>
        ) : null}

        {!post.isPublished ? (
          <Link
            href={`/admin/preview/${post.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button size="sm" variant="outline" className={btn}>
              <Eye className="mr-1.5 size-3" />
              Xem trước
            </Button>
          </Link>
        ) : null}

        {/* ── View live ── */}
        {post.isPublished ? (
          <a
            href={`/${post.category.slug}/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline" className={btn}>
              <Eye className="mr-1.5 size-3" />
              Xem bài
            </Button>
          </a>
        ) : null}

        {post.isPublished ? (
          <ConfirmActionForm
            action={checkPostIndex}
            fields={[{ name: "postId", value: post.id }]}
            confirmMessage="Xếp bài này vào hàng đợi kiểm tra trạng thái index trên Google?"
          >
            <PendingSubmitButton
              type="submit"
              size="sm"
              variant="outline"
              className={btn}
              pendingText="Đang xếp hàng..."
            >
              <Search className="mr-1.5 size-3" />
              Check index
            </PendingSubmitButton>
          </ConfirmActionForm>
        ) : null}

        {post.isPublished && (
          post.isFeatured ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={`${btn} border-amber-300 text-amber-700 hover:bg-amber-50`}
              onClick={onRemoveFeatured}
            >
              <PinOff className="mr-1.5 size-3" />
              Bỏ tiêu điểm
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={`${btn} border-zinc-300 text-zinc-700 hover:bg-zinc-50`}
              onClick={onSetFeatured}
            >
              <Pin className="mr-1.5 size-3" />
              Tiêu điểm
            </Button>
          )
        )}
      </div>

      {/* ── Trash ── */}
      {(canDeletePost || (post.author?.id === currentUserId && post.editorialStatus !== "PUBLISHED" && post.editorialStatus !== "PENDING_PUBLISH")) && (
        <div className="flex justify-start">
          <ConfirmActionForm
            action={movePostToTrash}
            fields={[
              { name: "postId", value: post.id },
              { name: "sourceTab", value: "posts" },
            ]}
            confirmMessage="Xóa bài viết này vào thùng rác?"
          >
            <PendingSubmitButton
              type="submit"
              size="sm"
              variant="destructive"
              className={btn}
              pendingText="Đang xóa..."
            >
              <Trash2 className="mr-1.5 size-3" />
              Xóa
            </PendingSubmitButton>
          </ConfirmActionForm>
        </div>
      )}
    </div>
  )
}
