import type { EditorialStatus } from "@prisma/client"

type SearchConsoleUrlStatusRow = {
  verdict: string | null
  coverageState: string | null
  robotsTxtState: string | null
  indexingState: string | null
  pageFetchState: string | null
  lastCrawlTime: Date | null
  checkedAt: Date
  lastError: string | null
}

type SearchConsoleJobRow = {
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED"
  runAfter: Date
  updatedAt: Date
}

export type PostRow = {
  id: string
  title: string
  penName: string | null
  excerpt: string
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  slug: string
  thumbnailUrl: string | null
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  approvedAt: Date | null
  scheduledPublishAt: Date | null
  isFeatured: boolean
  isTrending: boolean
  isPublished: boolean
  isDraft: boolean
  editorialStatus: EditorialStatus
  author: { id: string; name: string; email: string } | null
  approver: { id: string; name: string; email: string } | null
  lastEditor: { id: string; name: string; email: string } | null
  category: { name: string; slug: string }
  searchConsoleStatuses?: SearchConsoleUrlStatusRow[]
  searchConsoleJobs?: SearchConsoleJobRow[]
}

export type PostsFilters = {
  query: string
  authorId: string
  status: "all" | "draft" | "pending-review" | "pending-publish" | "published" | "rejected"
  approval: "all" | "approved" | "unapproved"
  categoryId: string
  fromDate: string
  toDate: string
}

export type FeaturedPostRow = {
  id: string
  title: string
  slug: string
  publishedAt: Date | null
}

export type PostsData = {
  posts: PostRow[]
  totalCount: number
  totalPages: number
  currentPage: number
  featuredPosts?: FeaturedPostRow[]
  filterOptions: {
    authors: Array<{ id: string; name: string; email: string }>
    categories: Array<{ id: string; name: string; slug: string }>
  }
}

export type PostActions = {
  movePostToTrash: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  submitPostToPendingReview: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  promotePostToPendingPublish: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  approvePendingPost: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  rejectPendingPost: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  returnPostToDraft: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  returnPostToPendingReview: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  returnPostToPendingPublish: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  checkPostIndex: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  togglePostFeatured: (formData: FormData) => Promise<{ toast: string } | void | undefined>
  replaceFeaturedPost: (formData: FormData) => Promise<{ toast: string } | void | undefined>
}

export type PostPermissions = {
  isAdmin: boolean
  canDeletePost: boolean
  currentUserId: string
  canSubmitPendingReview: boolean
  canSubmitPendingPublish: boolean
  canReviewPending: boolean
  canPublishNow: boolean
  canEditDraft: boolean
  canEditPendingReview: boolean
  canEditPendingPublish: boolean
  canEditPublished: boolean
}

export const STATUS_CONFIG: Record<
  EditorialStatus,
  { label: string; rowClass: string; badgeClass: string; dot: string }
> = {
  DRAFT: {
    label: "Nháp",
    rowClass: "",
    badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dot: "bg-zinc-400",
  },
  PENDING_REVIEW: {
    label: "Chờ duyệt",
    rowClass: "bg-amber-50/40",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  PENDING_PUBLISH: {
    label: "Chờ đăng",
    rowClass: "bg-sky-50/40",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  PUBLISHED: {
    label: "Đã đăng",
    rowClass: "bg-emerald-50/30",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Từ chối",
    rowClass: "bg-rose-50/30",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
}

export function buildPostsQuery(filters: PostsFilters, page: number) {
  return (
    `/admin?tab=posts` +
    (filters.query ? `&postsQ=${encodeURIComponent(filters.query)}` : "") +
    (filters.authorId ? `&postsAuthor=${encodeURIComponent(filters.authorId)}` : "") +
    (filters.status !== "all" ? `&postsStatus=${filters.status}` : "") +
    (filters.approval !== "all" ? `&postsApproval=${filters.approval}` : "") +
    (filters.categoryId ? `&postsCategory=${encodeURIComponent(filters.categoryId)}` : "") +
    (filters.fromDate ? `&postsFrom=${encodeURIComponent(filters.fromDate)}` : "") +
    (filters.toDate ? `&postsTo=${encodeURIComponent(filters.toDate)}` : "") +
    `&postsPage=${page}`
  )
}

export function canEditPost(
  post: Pick<PostRow, "editorialStatus">,
  perms: Pick<PostPermissions, "canEditDraft" | "canEditPendingReview" | "canEditPendingPublish" | "canEditPublished">
) {
  switch (post.editorialStatus) {
    case "DRAFT": return perms.canEditDraft
    case "PENDING_REVIEW": return perms.canEditPendingReview
    case "PENDING_PUBLISH": return perms.canEditPendingPublish
    default: return perms.canEditPublished
  }
}

export function getTimelineLabel(post: PostRow) {
  if (post.editorialStatus === "PENDING_PUBLISH" && post.scheduledPublishAt) {
    return `Hẹn ${new Date(post.scheduledPublishAt).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })}`
  }
  if (post.editorialStatus === "PUBLISHED" && post.publishedAt) {
    return `Đăng ${new Date(post.publishedAt).toLocaleDateString("vi-VN")}`
  }
  if (post.editorialStatus === "PENDING_PUBLISH" && post.approvedAt) {
    return `Duyệt ${new Date(post.approvedAt).toLocaleDateString("vi-VN")}`
  }
  return `Sửa ${new Date(post.updatedAt).toLocaleDateString("vi-VN")}`
}

export function getSearchConsoleIndexState(post: PostRow) {
  const pendingJob = post.searchConsoleJobs?.[0]
  if (pendingJob) {
    return {
      key: "pending",
      label: pendingJob.status === "RUNNING" ? "Đang check index" : "Chờ check index",
      className: "border-sky-200 bg-sky-50 text-sky-700",
      title: `Cập nhật ${new Date(pendingJob.updatedAt).toLocaleString("vi-VN")}`,
    }
  }

  const status = post.searchConsoleStatuses?.[0]
  if (!status) {
    return {
      key: "unchecked",
      label: "Chưa check index",
      className: "border-zinc-200 bg-zinc-50 text-zinc-600",
      title: "Chưa có dữ liệu URL Inspection",
    }
  }

  const checkedLabel = `Check ${new Date(status.checkedAt).toLocaleString("vi-VN")}`
  if (status.lastError) {
    return {
      key: "error",
      label: "Lỗi GSC",
      className: "border-rose-200 bg-rose-50 text-rose-700",
      title: status.lastError,
    }
  }

  if (
    status.robotsTxtState === "DISALLOWED" ||
    status.indexingState === "BLOCKED_BY_META_TAG" ||
    status.indexingState === "BLOCKED_BY_HTTP_HEADER" ||
    status.pageFetchState === "BLOCKED_ROBOTS_TXT"
  ) {
    return {
      key: "blocked",
      label: "Bị chặn index",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      title: `${checkedLabel} · ${status.coverageState || "Blocked"}`,
    }
  }

  if (status.verdict === "PASS") {
    return {
      key: "indexed",
      label: "Indexed",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      title: `${checkedLabel} · ${status.coverageState || "Valid"}`,
    }
  }

  return {
    key: "not-indexed",
    label: "Chưa indexed",
    className: "border-zinc-300 bg-white text-zinc-700",
    title: `${checkedLabel} · ${status.coverageState || status.verdict || "Unknown"}`,
  }
}
