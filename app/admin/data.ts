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
  getPenNameOptions,
  getPenNamesSettingsData,
  getBioAgeInsights,
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
  const adminSnapshotPromise = getAdminSnapshot()

  // Initialize all data with default "empty" values (matching loader short-circuits)
  let categoriesForManage: Awaited<ReturnType<typeof getCategoriesForManage>> =
    []
  let categoriesForWrite: Awaited<ReturnType<typeof getCategoriesForWrite>> = []
  let seoKeywordOptions: Awaited<ReturnType<typeof getSeoKeywordOptions>> = []
  let penNameOptions: Awaited<ReturnType<typeof getPenNameOptions>> = []
  let postsData: Awaited<ReturnType<typeof getPostsData>> = {
    posts: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    featuredPosts: [],
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
  }
  let bioAgeInsights: Awaited<ReturnType<typeof getBioAgeInsights>> = {
    totalCount: 0,
    averageAge: null,
    ageGroups: ["1-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map(
      (label) => ({ label, count: 0 })
    ),
    genders: [
      { key: "MALE", label: "Nam", count: 0 },
      { key: "FEMALE", label: "Nữ", count: 0 },
    ],
    results: [
      { key: "YOUNGER", label: "Trẻ hơn", count: 0 },
      { key: "BALANCED", label: "Cân bằng", count: 0 },
      { key: "RECOVERY", label: "Cần phục hồi", count: 0 },
      { key: "FAST_AGING", label: "Lão hóa nhanh", count: 0 },
    ],
    latest: [],
  }
  let moderationSettings: Awaited<
    ReturnType<typeof getModerationSettingsData>
  > = {
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
  let penNamesSettingsData: Awaited<
    ReturnType<typeof getPenNamesSettingsData>
  > = []

  // Selectively fire only required loaders for the active tab
  const activeTabDataPromise = (async () => {
    switch (activeTab) {
      case "overview":
        ;[overviewAnalytics, bioAgeInsights] = await Promise.all([
          getOverviewAnalytics(activeTab, overviewRange),
          getBioAgeInsights(activeTab),
        ])
        break
      case "write":
        ;[
          categoriesForWrite,
          seoKeywordOptions,
          mediaLibraryData,
          penNameOptions,
        ] = await Promise.all([
          getCategoriesForWrite(activeTab),
          getSeoKeywordOptions(activeTab),
          getMediaLibraryData(activeTab),
          getPenNameOptions(activeTab),
        ])
        break
      case "media-library":
        mediaLibraryData = await getMediaLibraryData(activeTab)
        break
      case "personal-archive":
        personalPostsData = await getPersonalPostsData(
          activeTab,
          personalArchiveFilters,
          currentUser
        )
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
        trashedPosts = await getTrashedPostsData(
          activeTab,
          trashFilters,
          currentUser
        )
        break
      case "settings-moderation":
        moderationSettings = await getModerationSettingsData(activeTab)
        break
      case "settings-permissions":
        permissionsMatrix = await getRolePermissionsData(activeTab)
        break
      case "settings-pen-names":
        penNamesSettingsData = await getPenNamesSettingsData(activeTab)
        break
      case "settings-users":
      case "settings-password":
        usersData = await getUsersData(activeTab)
        break
      default:
        // No extra data needed for "settings-password" or unknown tabs
        break
    }
  })()

  const [
    {
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
      indexedPostCount,
      notIndexedPostCount,
      pendingInspectionCount,
      failedInspectionCount,
      todayInspectionUsage,
    },
  ] = await Promise.all([adminSnapshotPromise, activeTabDataPromise])

  const postsPaginationItems = buildPaginationItems(
    postsData.currentPage,
    postsData.totalPages
  )
  const historyPaginationItems = buildPaginationItems(
    historyLogs.currentPage,
    historyLogs.totalPages
  )

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
    indexedPostCount,
    notIndexedPostCount,
    pendingInspectionCount,
    failedInspectionCount,
    todayInspectionUsage,
    categoriesForManage,
    categoriesForWrite,
    seoKeywordOptions,
    penNameOptions,
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
    bioAgeInsights,
    moderationSettings,
    usersData,
    historyLogs,
    historyPaginationItems,
    permissionsMatrix,
    penNamesSettingsData,
  }
}
