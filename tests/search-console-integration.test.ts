import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("search console integration wiring", () => {
  test("publish workflows enqueue URL inspection and sitemap jobs", () => {
    const postsSource = readWorkspaceFile("app/admin/actions/posts.ts")
    const workflowSource = readWorkspaceFile("app/admin/actions/workflow.ts")
    const cronSource = readWorkspaceFile(
      "app/api/cron/publish-scheduled/route.ts"
    )

    expect(postsSource).toContain("enqueuePublishedPostSearchConsoleJobs")
    expect(postsSource).toContain("scheduleSearchConsoleDrain()")
    expect(postsSource).toContain("export async function checkPostIndex")
    expect(postsSource).toContain("if (!post.isPublished || !post.category?.slug)")

    expect(workflowSource).toContain("const shouldPublishNow")
    expect(workflowSource).toContain("enqueuePublishedPostSearchConsoleJobs")
    expect(workflowSource).toContain("scheduleSearchConsoleDrain()")

    expect(cronSource).toContain("enqueuePublishedPostSearchConsoleJobs")
    expect(cronSource).toContain("scheduleSearchConsoleDrain()")
  })

  test("admin posts UI exposes index status and manual check action", () => {
    const postsTableSource = readWorkspaceFile(
      "components/admin/posts-tab/posts-table.tsx"
    )
    const postActionsSource = readWorkspaceFile(
      "components/admin/posts-tab/post-actions-cell.tsx"
    )
    const postTypesSource = readWorkspaceFile(
      "components/admin/posts-tab/types.ts"
    )
    const pageSource = readWorkspaceFile("app/admin/page.tsx")

    expect(postsTableSource).toContain("getSearchConsoleIndexState")
    expect(postsTableSource).toContain("indexState.label")
    expect(postActionsSource).toContain("Check index")
    expect(postActionsSource).toContain("checkPostIndex")
    expect(postTypesSource).toContain("searchConsoleStatuses")
    expect(postTypesSource).toContain("searchConsoleJobs")
    expect(pageSource).toContain("indexedPostCount")
    expect(pageSource).toContain("todayInspectionUsage")
  })

  test("robots advertises both standard and news sitemaps", () => {
    const robotsSource = readWorkspaceFile("app/robots.ts")

    expect(robotsSource).toContain("news-sitemap.xml")
    expect(robotsSource).toContain("sitemap.xml")
  })
})
