import {
  getAdminSnapshot,
  getCategoriesForManage,
  getCategoriesForWrite,
  getSeoKeywordOptions,
  getModerationSettingsData,
  getMediaLibraryData,
  getOverviewAnalytics,
  getPendingComments,
  getPersonalPostsData,
  getPostsData,
  getTrashedPostsData,
  getUsersData,
  getHistoryData,
  getRolePermissionsData,
} from "@/app/admin/data-loaders/index"
import { buildPaginationItems } from "@/app/admin/data-helpers"
import type { GetAdminPageDataInput } from "@/app/admin/data-types"

export type { AdminTab } from "@/app/admin/data-types"

export async function getAdminPageData({
  activeTab,
  overviewRange,
  postsFilters,
  personalArchiveFilters,
  trashFilters,
  historyPage,
  currentUser,
}: GetAdminPageDataInput) {
  const {
    postCount,
    categoryCount,
    pendingCommentCount,
    trashedPostCount,
    draftPostCount,
    pendingReviewPostCount,
    pendingPublishPostCount,
    publishedPostCount,
    rejectedPostCount,
    totalPostViews,
  } = await getAdminSnapshot()

  // Initialize all data with default "empty" values (matching loader short-circuits)
  let categoriesForManage: Awaited<ReturnType<typeof getCategoriesForManage>> = []
  let categoriesForWrite: Awaited<ReturnType<typeof getCategoriesForWrite>> = []
  let seoKeywordOptions: Awaited<ReturnType<typeof getSeoKeywordOptions>> = []
  let postsData: Awaited<ReturnType<typeof getPostsData>> = {
    posts: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    filterOptions: { authors: [], categories: [] },
  }
  let personalPostsData: Awaited<ReturnType<typeof getPersonalPostsData>> = {
    rows: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    paginationItems: [],
  }
  let mediaLibraryData: Awaited<ReturnType<typeof getMediaLibraryData>> = []
  let trashedPosts: Awaited<ReturnType<typeof getTrashedPostsData>> = {
    rows: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    paginationItems: [],
    authorOptions: [],
  }
  let pendingComments: Awaited<ReturnType<typeof getPendingComments>> = []
  let overviewAnalytics: Awaited<ReturnType<typeof getOverviewAnalytics>> = {
    daily: [],
    range: overviewRange,
    hotSeoKeywords: [],
    avgDwellSecondsPerPost: 0,
    dwellTopPosts: [],
  }
  let moderationSettings: Awaited<ReturnType<typeof getModerationSettingsData>> = {
    forbiddenKeywords: [],
    seoKeywords: [],
  }
  let usersData: Awaited<ReturnType<typeof getUsersData>> = []
  let historyLogs: Awaited<ReturnType<typeof getHistoryData>> = {
    rows: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
  }
  let permissionsMatrix: Awaited<ReturnType<typeof getRolePermissionsData>> = []

  // Selectively fire only required loaders for the active tab
  switch (activeTab) {
    case "overview":
      overviewAnalytics = await getOverviewAnalytics(activeTab, overviewRange)
      break
    case "write":
      ;[categoriesForWrite, seoKeywordOptions, mediaLibraryData] = await Promise.all([
        getCategoriesForWrite(activeTab),
        getSeoKeywordOptions(activeTab),
        getMediaLibraryData(activeTab),
      ])
      break
    case "media-library":
      mediaLibraryData = await getMediaLibraryData(activeTab)
      break
    case "personal-archive":
      personalPostsData = await getPersonalPostsData(activeTab, personalArchiveFilters, currentUser)
      break
    case "history":
      historyLogs = await getHistoryData(activeTab, historyPage)
      break
    case "categories":
      categoriesForManage = await getCategoriesForManage(activeTab)
      break
    case "comments":
      pendingComments = await getPendingComments(activeTab)
      break
    case "posts":
      postsData = await getPostsData(activeTab, postsFilters, currentUser)
      break
    case "trash":
      trashedPosts = await getTrashedPostsData(activeTab, trashFilters, currentUser)
      break
    case "settings-moderation":
      moderationSettings = await getModerationSettingsData(activeTab)
      break
    case "settings-permissions":
      permissionsMatrix = await getRolePermissionsData(activeTab)
      break
    case "settings-users":
    case "settings-password":
      usersData = await getUsersData(activeTab)
      break
    default:
      // No extra data needed for "settings-password" or unknown tabs
      break
  }

  const postsPaginationItems = buildPaginationItems(postsData.currentPage, postsData.totalPages)
  const historyPaginationItems = buildPaginationItems(historyLogs.currentPage, historyLogs.totalPages)

  return {
    postCount,
    categoryCount,
    pendingCommentCount,
    trashedPostCount,
    draftPostCount,
    pendingReviewPostCount,
    pendingPublishPostCount,
    publishedPostCount,
    rejectedPostCount,
    totalPostViews,
    categoriesForManage,
    categoriesForWrite,
    seoKeywordOptions,
    postsData,
    postsPaginationItems,
    postsFilters,
    personalPostsData,
    personalArchiveFilters,
    mediaLibraryData,
    trashedPosts,
    trashFilters,
    pendingComments,
    overviewAnalytics,
    moderationSettings,
    usersData,
    historyLogs,
    historyPaginationItems,
    permissionsMatrix,
  }
}
