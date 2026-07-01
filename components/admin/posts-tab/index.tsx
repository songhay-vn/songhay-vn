"use client"

import { PostsFilterBar } from "./post-filter-bar"
import { PostsTable } from "./posts-table"
import { buildPostsQuery } from "./types"
import type {
  PostActions,
  PostPermissions,
  PostsData,
  PostsFilters,
} from "./types"
import { AdminPagination } from "../admin-pagination"

type PostsTabProps = {
  postsData: PostsData
  filters: PostsFilters
  postsPaginationItems: Array<number | "ellipsis">
} & PostPermissions &
  PostActions

export function PostsTab({
  isAdmin,
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
  postsData,
  filters,
  postsPaginationItems,
  movePostToTrash,
  submitPostToPendingReview,
  promotePostToPendingPublish,
  approvePendingPost,
  rejectPendingPost,
  returnPostToDraft,
  returnPostToPendingReview,
  returnPostToPendingPublish,
  checkPostIndex,
  assignFeaturedSlot,
  clearFeaturedSlot,
}: PostsTabProps) {
  const hasActiveFilters = Boolean(
    filters.query ||
    (filters.authorId && filters.authorId !== "all") ||
    filters.categoryId ||
    filters.fromDate ||
    filters.toDate
  )

  const permissions: PostPermissions = {
    isAdmin,
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
  }

  const actions: PostActions = {
    movePostToTrash,
    submitPostToPendingReview,
    promotePostToPendingPublish,
    approvePendingPost,
    rejectPendingPost,
    returnPostToDraft,
    returnPostToPendingReview,
    returnPostToPendingPublish,
    checkPostIndex,
    assignFeaturedSlot,
    clearFeaturedSlot,
  }

  return (
    <div className="space-y-4">
      <PostsFilterBar
        filters={filters}
        filterOptions={postsData.filterOptions}
        isAdmin={isAdmin}
        hasActiveFilters={hasActiveFilters}
      />

      <PostsTable
        posts={postsData.posts}
        featuredPosts={postsData.featuredPosts || []}
        featuredSlotFillers={postsData.featuredSlotFillers || []}
        hideSeoDescription={filters.status === "published"}
        {...permissions}
        {...actions}
      />

      <AdminPagination
        currentPage={postsData.currentPage}
        totalPages={postsData.totalPages}
        totalCount={postsData.totalCount}
        paginationItems={postsPaginationItems}
        buildPageHref={(page) => buildPostsQuery(filters, page)}
      />
    </div>
  )
}
