import { Suspense } from "react"
import {
  addForbiddenKeyword,
  addSeoKeyword,
  approvePendingPost,
  checkPostIndex,
  createSubordinateAccount,
  createCategory,
  createPost,
  deleteCategory,
  deleteForbiddenKeyword,
  deletePostPermanently,
  deleteSeoKeyword,
  moderateComment,
  movePostToTrash,
  promotePostToPendingPublish,
  rejectPendingPost,
  reorderCategory,
  restorePostFromTrash,
  returnPostToDraft,
  returnPostToPendingPublish,
  returnPostToPendingReview,
  submitPostToPendingReview,
  updateCategory,
  updateOwnPassword,
  resetUserPassword,
  updateRolePermissions,
  updateUserRole,
  deleteUser,
} from "@/app/admin/actions"
import { type AdminTab, getAdminPageData } from "@/app/admin/data"
import {
  getVisibleTabs,
  parseAdminSearchParams,
} from "@/app/admin/page-helpers"
import { CategoriesTab } from "@/components/admin/categories-tab"
import { CommentsTab } from "@/components/admin/comments-tab"
import { HistoryTab } from "@/components/admin/history-tab"
import { MediaLibraryTab } from "@/components/admin/media-library-tab"
import { OverviewTab } from "@/components/admin/overview-tab"
import { PersonalArchiveTab } from "@/components/admin/personal-archive-tab"
import { PostsTab } from "@/components/admin/posts-tab"
import type { PostActions, PostPermissions } from "@/components/admin/posts-tab/types"
import { SettingsModerationTab } from "@/components/admin/settings-moderation-tab"
import { SettingsPasswordTab } from "@/components/admin/settings-password-tab"
import { SettingsPermissionsTab } from "@/components/admin/settings-permissions-tab"
import { SettingsUsersTab } from "@/components/admin/settings-users-tab"
import { TrashTab } from "@/components/admin/trash-tab"
import { WriteTab } from "@/components/admin/write-tab"
import { requireCmsUser } from "@/lib/auth"
import {
  can,
  canApprovePendingReview,
  canCreateSubordinateAccount,
  canEditByStatus,
  canPublishNow,
  canSubmitPendingPublish,
  canViewAllPosts,
} from "@/lib/permissions"
import {
  Activity,
  AlertTriangle,
  Clock,
  FolderKanban,
  MessageSquareMore,
  Newspaper,
  Search,
} from "lucide-react"
import AdminLoading from "./loading"



type ResolvedSearchParams = {
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
}

type AdminPageProps = {
  searchParams?: Promise<ResolvedSearchParams>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const searchParamsKey = JSON.stringify(resolvedSearchParams || {})

  return (
    <Suspense key={searchParamsKey} fallback={<AdminLoading />}>
      <AdminPageContent searchParams={resolvedSearchParams} />
    </Suspense>
  )
}

async function AdminPageContent({ searchParams }: { searchParams?: ResolvedSearchParams }) {
  const currentUser = await requireCmsUser()
  const canSeeAllPosts = canViewAllPosts(currentUser.role)
  const canManageSettings = can(currentUser.role, "create-category")

  const { visibleTabs } = getVisibleTabs({
    canManageSettings,
  })

  const {
    tabFromQuery,
    overviewRange,
    movedCategoryId,
    movedDirection,
    postsFilters,
    personalArchiveFilters,
    trashFilters,
    historyPage,
  } = parseAdminSearchParams(searchParams)

  const activeTab: AdminTab = visibleTabs.some(
    (item) => item.tabKey === tabFromQuery
  )
    ? (tabFromQuery as AdminTab)
    : "overview"

  const {
    postCount,
    categoryCount,
    pendingCommentCount,
    totalPostViews,
    indexedPostCount,
    notIndexedPostCount,
    pendingInspectionCount,
    failedInspectionCount,
    todayInspectionUsage,
    categoriesForManage,
    categoriesForWrite,
    seoKeywordOptions,
    postsData,
    postsPaginationItems,
    personalPostsData,
    mediaLibraryData,
    trashedPosts,
    pendingComments,
    overviewAnalytics,
    moderationSettings,
    usersData,
    historyLogs,
    historyPaginationItems,
    permissionsMatrix,
  } = await getAdminPageData({
    activeTab,
    overviewRange,
    postsFilters,
    personalArchiveFilters,
    trashFilters,
    historyPage,
    currentUser: {
      id: currentUser.id,
      role: currentUser.role,
    },
  })

  const inspectionSoftLimit = Number.parseInt(
    process.env.GSC_DAILY_INSPECTION_SOFT_LIMIT || "1800",
    10
  )

  const overviewStats = [
    {
      key: "posts",
      label: "Bài viết",
      value: postCount,
      note: "Bài gần nhất trong hệ thống",
      icon: Newspaper,
      tone: "text-sky-600",
    },
    {
      key: "categories",
      label: "Chuyên mục",
      value: categoryCount,
      note: "Danh mục đang hoạt động",
      icon: FolderKanban,
      tone: "text-violet-600",
    },
    {
      key: "comments",
      label: "Comment chờ duyệt",
      value: pendingCommentCount,
      note: "Cần xử lý bởi admin",
      icon: MessageSquareMore,
      tone: pendingCommentCount > 0 ? "text-amber-600" : "text-zinc-900",
    },
    {
      key: "views",
      label: "Tổng lượt xem",
      value: totalPostViews,
      note: "Tổng view của các bài đã publish",
      icon: Activity,
      tone: "text-emerald-600",
    },
    {
      key: "gsc-indexed",
      label: "Google indexed",
      value: indexedPostCount,
      note: "Bài published có URL Inspection PASS",
      icon: Search,
      tone: "text-emerald-600",
    },
    {
      key: "gsc-not-indexed",
      label: "Chưa indexed",
      value: notIndexedPostCount,
      note: "Bài published bị FAIL hoặc Excluded",
      icon: Search,
      tone: "text-zinc-700",
    },
    {
      key: "gsc-pending",
      label: "Chờ GSC",
      value: pendingInspectionCount,
      note: "Job inspection đang chờ hoặc đang chạy",
      icon: Clock,
      tone: "text-sky-600",
    },
    {
      key: "gsc-failed",
      label: "Lỗi GSC",
      value: failedInspectionCount,
      note: "Job inspection đã thất bại",
      icon: AlertTriangle,
      tone: failedInspectionCount > 0 ? "text-rose-600" : "text-zinc-700",
    },
    {
      key: "gsc-usage",
      label: "Inspect hôm nay",
      value: todayInspectionUsage,
      note: "Lượt URL Inspection đã gọi hôm nay",
      icon: Activity,
      tone: todayInspectionUsage >= inspectionSoftLimit ? "text-amber-600" : "text-sky-600",
    },
  ]

  const postPermissions: PostPermissions = {
    isAdmin: canSeeAllPosts,
    canDeletePost: can(currentUser.role, "delete-post"),
    currentUserId: currentUser.id,
    canSubmitPendingReview: can(currentUser.role, "submit-pending-review"),
    canSubmitPendingPublish: canSubmitPendingPublish(currentUser.role),
    canReviewPending: canApprovePendingReview(currentUser.role),
    canPublishNow: canPublishNow(currentUser.role),
    canEditDraft: canEditByStatus(currentUser.role, "DRAFT"),
    canEditPendingReview: canEditByStatus(currentUser.role, "PENDING_REVIEW"),
    canEditPendingPublish: canEditByStatus(currentUser.role, "PENDING_PUBLISH"),
    canEditPublished: canEditByStatus(currentUser.role, "PUBLISHED"),
  }

  const postActions: PostActions = {
    movePostToTrash,
    submitPostToPendingReview,
    promotePostToPendingPublish,
    approvePendingPost,
    rejectPendingPost,
    returnPostToDraft,
    returnPostToPendingReview,
    returnPostToPendingPublish,
    checkPostIndex,
  }

  return (
    <>
      {activeTab === "overview" ? (
        <OverviewTab
          overviewStats={overviewStats}
          overviewAnalytics={overviewAnalytics}
        />
      ) : null}
      {activeTab === "categories" ? (
        <CategoriesTab
          categoriesForManage={categoriesForManage}
          movedCategoryId={movedCategoryId}
          movedDirection={movedDirection}
          createCategory={createCategory}
          updateCategory={updateCategory}
          reorderCategory={reorderCategory}
          deleteCategory={deleteCategory}
        />
      ) : null}
      {activeTab === "write" ? (
        <WriteTab
          canPublishNow={canPublishNow(currentUser.role)}
          canSubmitPendingPublish={canSubmitPendingPublish(
            currentUser.role
          )}
          categoriesForWrite={categoriesForWrite}
          seoKeywordOptions={seoKeywordOptions}
          mediaAssets={mediaLibraryData}
          currentUserId={currentUser.id}
          createPost={createPost}
        />
      ) : null}
      {activeTab === "media-library" ? (
        <MediaLibraryTab isAdmin={canSeeAllPosts} rows={mediaLibraryData} />
      ) : null}
      {activeTab === "personal-archive" ? (
        <PersonalArchiveTab
          {...postPermissions}
          {...postActions}
          data={personalPostsData}
          filters={personalArchiveFilters}
        />
      ) : null}
      {activeTab === "history" ? (
        <HistoryTab
          historyData={historyLogs}
          paginationItems={historyPaginationItems}
        />
      ) : null}
      {activeTab === "comments" ? (
        <CommentsTab
          pendingComments={pendingComments}
          moderateComment={moderateComment}
        />
      ) : null}
      {activeTab === "settings-moderation" ? (
        <SettingsModerationTab
          forbiddenKeywords={moderationSettings.forbiddenKeywords}
          seoKeywords={moderationSettings.seoKeywords}
          addForbiddenKeyword={addForbiddenKeyword}
          deleteForbiddenKeyword={deleteForbiddenKeyword}
          addSeoKeyword={addSeoKeyword}
          deleteSeoKeyword={deleteSeoKeyword}
        />
      ) : null}
      {activeTab === "posts" ? (
        <PostsTab
          {...postPermissions}
          {...postActions}
          postsData={postsData}
          filters={postsFilters}
          postsPaginationItems={postsPaginationItems}
        />
      ) : null}
      {activeTab === "trash" ? (
        <TrashTab
          isAdmin={canSeeAllPosts}
          data={trashedPosts}
          filters={trashFilters}
          restorePostFromTrash={restorePostFromTrash}
          deletePostPermanently={deletePostPermanently}
        />
      ) : null}
      {activeTab === "settings-password" ? (
        <SettingsPasswordTab
          users={usersData}
          updateOwnPassword={updateOwnPassword}
          resetUserPassword={resetUserPassword}
          canCreateSubordinateAccount={canCreateSubordinateAccount(
            currentUser.role
          )}
        />
      ) : null}
      {activeTab === "settings-permissions" ? (
        <SettingsPermissionsTab
          permissionsMatrix={permissionsMatrix}
          updateRolePermissions={updateRolePermissions}
        />
      ) : null}
      {activeTab === "settings-users" ? (
        <SettingsUsersTab
          users={usersData}
          currentUserId={currentUser.id}
          updateUserRole={updateUserRole}
          deleteUser={deleteUser}
          createSubordinateAccount={createSubordinateAccount}
          canCreateSubordinateAccount={canCreateSubordinateAccount(
            currentUser.role
          )}
        />
      ) : null}
    </>
  )
}
