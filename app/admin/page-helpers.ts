import type { AdminTab } from "@/app/admin/data"

export type NavIconName =
  | "layoutDashboard"
  | "penSquare"
  | "libraryBig"
  | "userSquare2"
  | "newspaper"
  | "trash2"
  | "keyRound"
  | "messageSquareMore"
  | "folderKanban"
  | "shieldCheck"
  | "users"
  | "fileEdit"
  | "fileWarning"
  | "fileSearch"
  | "timer"
  | "globe"

export type NavLeaf = {
  key: string
  tabKey: AdminTab
  label: string
  description: string
  iconName: NavIconName
  adminOnly?: boolean
  countKey?: NavCountKey
  href?: string
  activeWhen?: {
    tab: AdminTab
    postsStatus?: "draft" | "pending-review" | "pending-publish" | "published" | "rejected"
  }
}

export type NavCountKey =
  | "postCount"
  | "categoryCount"
  | "pendingCommentCount"
  | "trashedPostCount"
  | "draftPostCount"
  | "pendingReviewPostCount"
  | "pendingPublishPostCount"
  | "publishedPostCount"
  | "rejectedPostCount"

export const OVERVIEW_TAB: NavLeaf = {
  key: "overview",
  tabKey: "overview",
  label: "Tổng quan",
  description: "Bức tranh tổng quan trạng thái CMS",
  iconName: "layoutDashboard",
}

export const CONTENT_MANAGEMENT_TABS: NavLeaf[] = [
  {
    key: "media-library",
    tabKey: "media-library",
    label: "Kho dữ liệu",
    description: "Tái sử dụng ảnh/video đã upload",
    iconName: "libraryBig",
  },
  {
    key: "personal-archive",
    tabKey: "personal-archive",
    label: "Lưu trữ cá nhân",
    description: "Bài viết theo tài khoản đăng nhập",
    iconName: "userSquare2",
  },
  {
    key: "history",
    tabKey: "history",
    label: "Lịch sử tác động",
    description: "Lưu vết hoạt động biên tập",
    iconName: "timer",
  },
]

export const POSTS_SUBMENU_TABS: NavLeaf[] = [
  {
    key: "posts-write",
    tabKey: "write",
    label: "Thêm mới",
    description: "Soạn nội dung và gửi duyệt/xuất bản",
    iconName: "penSquare",
    href: "/admin?tab=write",
    activeWhen: { tab: "write" },
  },
  {
    key: "posts-draft",
    tabKey: "posts",
    label: "Bài đang viết",
    description: "Danh sách bài đang ở trạng thái nháp",
    iconName: "fileEdit",
    countKey: "draftPostCount",
    href: "/admin?tab=posts&postsStatus=draft",
    activeWhen: { tab: "posts", postsStatus: "draft" },
  },
  {
    key: "posts-rejected",
    tabKey: "posts",
    label: "Tin bài bị trả lại",
    description: "Bài bị từ chối, cần chỉnh sửa",
    iconName: "fileWarning",
    countKey: "rejectedPostCount",
    href: "/admin?tab=posts&postsStatus=rejected",
    activeWhen: { tab: "posts", postsStatus: "rejected" },
  },
  {
    key: "posts-pending-review",
    tabKey: "posts",
    label: "Bài chờ duyệt",
    description: "Bài chờ biên tập viên duyệt",
    iconName: "fileSearch",
    countKey: "pendingReviewPostCount",
    href: "/admin?tab=posts&postsStatus=pending-review",
    activeWhen: { tab: "posts", postsStatus: "pending-review" },
  },
  {
    key: "posts-pending-publish",
    tabKey: "posts",
    label: "Bài chờ xuất bản",
    description: "Bài đã duyệt, chờ xuất bản",
    iconName: "timer",
    countKey: "pendingPublishPostCount",
    href: "/admin?tab=posts&postsStatus=pending-publish",
    activeWhen: { tab: "posts", postsStatus: "pending-publish" },
  },
  {
    key: "posts-published",
    tabKey: "posts",
    label: "Bài đã xuất bản",
    description: "Bài đã xuất bản công khai",
    iconName: "globe",
    countKey: "publishedPostCount",
    href: "/admin?tab=posts&postsStatus=published",
    activeWhen: { tab: "posts", postsStatus: "published" },
  },
  {
    key: "posts-trash",
    tabKey: "trash",
    label: "Thùng rác",
    description: "Khôi phục hoặc xóa vĩnh viễn",
    iconName: "trash2",
    countKey: "trashedPostCount",
    href: "/admin?tab=trash",
    activeWhen: { tab: "trash" },
  },
]

export const SETTINGS_TABS: NavLeaf[] = [
  {
    key: "settings-password",
    tabKey: "settings-password",
    label: "Đổi mật khẩu",
    description: "Thay đổi mật khẩu",
    iconName: "keyRound",
  },
  {
    key: "settings-moderation",
    tabKey: "settings-moderation",
    label: "Kiểm duyệt",
    description: "Quản lý từ cấm và từ khóa SEO",
    iconName: "messageSquareMore",
    adminOnly: true,
  },
  {
    key: "categories",
    tabKey: "categories",
    label: "Chuyên mục",
    description: "Quản lý cấu trúc chuyên mục",
    iconName: "folderKanban",
    adminOnly: true,
    countKey: "categoryCount",
  },
  {
    key: "comments",
    tabKey: "comments",
    label: "Bình luận",
    description: "Duyệt và kiểm soát thảo luận",
    iconName: "messageSquareMore",
    adminOnly: true,
    countKey: "pendingCommentCount",
  },
  {
    key: "settings-permissions",
    tabKey: "settings-permissions",
    label: "Phân quyền",
    description: "Tùy chỉnh quyền theo từng role",
    iconName: "shieldCheck",
    adminOnly: true,
  },
  {
    key: "settings-users",
    tabKey: "settings-users",
    label: "Người dùng",
    description: "Quản lý tài khoản và phân quyền",
    iconName: "users",
    adminOnly: true,
  },
]

type RawSearchParams = {
  tab?: string
  overviewRange?: string
  moved?: string
  direction?: string
  postsQ?: string
  postsAuthor?: string
  postsStatus?: string
  postsApproval?: string
  postsCategory?: string
  postsFrom?: string
  postsTo?: string
  postsPage?: string
  personalQ?: string
  personalStatus?: string
  personalFrom?: string
  personalTo?: string
  personalPage?: string
  trashQ?: string
  trashAuthor?: string
  trashFrom?: string
  trashTo?: string
  trashPage?: string
  historyPage?: string
}

export function getVisibleTabs({
  canManageSettings,
}: {
  canManageSettings: boolean
}) {
  const contentTabs = CONTENT_MANAGEMENT_TABS.filter((item) => (item.adminOnly ? canManageSettings : true))

  const settingsTabs = SETTINGS_TABS.filter((item) => (item.adminOnly ? canManageSettings : true))

  const tabRegistry: NavLeaf[] = [
    OVERVIEW_TAB,
    ...contentTabs,
    ...settingsTabs,
    {
      key: "registry-posts",
      tabKey: "posts",
      label: "Kho bài",
      description: "Tổng hợp bài viết theo trạng thái biên tập",
      iconName: "newspaper",
    },
    {
      key: "registry-write",
      tabKey: "write",
      label: "Thêm mới",
      description: "Soạn nội dung và gửi duyệt/xuất bản",
      iconName: "penSquare",
    },
    {
      key: "registry-trash",
      tabKey: "trash",
      label: "Thùng rác",
      description: "Khôi phục hoặc xóa vĩnh viễn",
      iconName: "trash2",
    },
  ]

  return {
    contentTabs,
    settingsTabs,
    visibleTabs: tabRegistry,
  }
}

export function parseAdminSearchParams(resolvedSearchParams?: RawSearchParams) {
  const tabFromQuery = resolvedSearchParams?.tab
  const overviewRange = "30d" as const
  const movedCategoryId = resolvedSearchParams?.moved
  const movedDirection = resolvedSearchParams?.direction

  const postsQuery = (resolvedSearchParams?.postsQ || "").trim().slice(0, 120)
  const postsAuthorRaw = (resolvedSearchParams?.postsAuthor || "").trim()
  const postsAuthor = postsAuthorRaw
  const postsStatus = ["all", "draft", "pending-review", "pending-publish", "published", "rejected"].includes(resolvedSearchParams?.postsStatus || "")
    ? (resolvedSearchParams?.postsStatus as "all" | "draft" | "pending-review" | "pending-publish" | "published" | "rejected")
    : "all"
  const postsApproval = ["all", "approved", "unapproved"].includes(resolvedSearchParams?.postsApproval || "")
    ? (resolvedSearchParams?.postsApproval as "all" | "approved" | "unapproved")
    : "all"
  const postsCategoryRaw = (resolvedSearchParams?.postsCategory || "").trim()
  const postsCategory = postsCategoryRaw === "all" ? "" : postsCategoryRaw
  const postsFrom = (resolvedSearchParams?.postsFrom || "").trim()
  const postsTo = (resolvedSearchParams?.postsTo || "").trim()
  const rawPostsPage = Number.parseInt(resolvedSearchParams?.postsPage || "1", 10)
  const requestedPostsPage = Number.isFinite(rawPostsPage) && rawPostsPage > 0 ? rawPostsPage : 1

  const personalQuery = (resolvedSearchParams?.personalQ || "").trim().slice(0, 120)
  const personalStatus = ["all", "draft", "pending", "pending-publish", "published", "rejected"].includes(resolvedSearchParams?.personalStatus || "")
    ? (resolvedSearchParams?.personalStatus as "all" | "draft" | "pending" | "pending-publish" | "published" | "rejected")
    : "all"
  const personalFrom = (resolvedSearchParams?.personalFrom || "").trim()
  const personalTo = (resolvedSearchParams?.personalTo || "").trim()
  const rawPersonalPage = Number.parseInt(resolvedSearchParams?.personalPage || "1", 10)
  const requestedPersonalPage = Number.isFinite(rawPersonalPage) && rawPersonalPage > 0 ? rawPersonalPage : 1

  const trashQuery = (resolvedSearchParams?.trashQ || "").trim().slice(0, 120)
  const trashAuthorRaw = (resolvedSearchParams?.trashAuthor || "").trim()
  const trashAuthor = trashAuthorRaw === "all" ? "" : trashAuthorRaw
  const trashFrom = (resolvedSearchParams?.trashFrom || "").trim()
  const trashTo = (resolvedSearchParams?.trashTo || "").trim()
  const rawTrashPage = Number.parseInt(resolvedSearchParams?.trashPage || "1", 10)
  const requestedTrashPage = Number.isFinite(rawTrashPage) && rawTrashPage > 0 ? rawTrashPage : 1

  const rawHistoryPage = Number.parseInt(resolvedSearchParams?.historyPage || "1", 10)
  const requestedHistoryPage = Number.isFinite(rawHistoryPage) && rawHistoryPage > 0 ? rawHistoryPage : 1

  return {
    tabFromQuery,
    overviewRange,
    movedCategoryId,
    movedDirection,
    postsFilters: {
      query: postsQuery,
      authorId: postsAuthor,
      status: postsStatus,
      approval: postsApproval,
      categoryId: postsCategory,
      fromDate: postsFrom,
      toDate: postsTo,
      requestedPage: requestedPostsPage,
    } as const,
    personalArchiveFilters: {
      query: personalQuery,
      status: personalStatus,
      fromDate: personalFrom,
      toDate: personalTo,
      requestedPage: requestedPersonalPage,
    } as const,
    trashFilters: {
      query: trashQuery,
      authorId: trashAuthor,
      fromDate: trashFrom,
      toDate: trashTo,
      requestedPage: requestedTrashPage,
    } as const,
    historyPage: requestedHistoryPage,
  }
}
