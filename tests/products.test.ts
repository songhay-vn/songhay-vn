import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("Products Feature", () => {
  test("Prisma schema defines Product model with isIndexed and sortOrder", () => {
    const schema = readWorkspaceFile("prisma/schema.prisma")
    expect(schema).toContain("model Product {")
    expect(schema).toContain("imageUrl")
    expect(schema).toContain("isIndexed")
    expect(schema).toContain("description")
    expect(schema).not.toContain("price") // No price field allowed
  })

  test("lib/permissions.ts defines manage-products permission", () => {
    const perms = readWorkspaceFile("lib/permissions.ts")
    expect(perms).toContain('"manage-products"')
    expect(perms).toContain('"Quản lý sản phẩm"')
  })

  test("ProductsSidebar displays Sản Phẩm Khoa Học section", () => {
    const sidebar = readWorkspaceFile("components/news/products-sidebar.tsx")
    expect(sidebar).toContain("Sản Phẩm Khoa Học")
    expect(sidebar).toContain("/san-pham")
    expect(sidebar).toContain("Xem thêm tất cả sản phẩm")
  })

  test("Product detail page has contact button to Zalo and description", () => {
    const page = readWorkspaceFile("app/san-pham/[slug]/page.tsx")
    expect(page).toContain("zalo.me")
    expect(page).toContain("Mô tả sản phẩm")
    expect(page).toContain("getProductBySlug")
  })
})
