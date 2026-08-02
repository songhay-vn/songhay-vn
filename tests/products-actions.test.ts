import { describe, expect, test, mock, beforeEach } from "bun:test"

// Mock next/navigation and next/cache
mock.module("server-only", () => ({}))

mock.module("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`Redirected to ${url}`)
  }
}))

mock.module("next/cache", () => ({
  revalidateTag: () => {},
  updateTag: () => {},
  revalidatePath: () => {}
}))

mock.module("@/app/admin/actions-helpers", () => ({
  requireActionPermission: async () => true
}))

// Mock Prisma
const mockUpdate = mock(() => Promise.resolve({}))
const mockTransaction = mock((promises) => Promise.all(promises))

mock.module("@/lib/prisma", () => ({
  prisma: {
    product: {
      update: mockUpdate
    },
    $transaction: mockTransaction
  }
}))

const { updateBulkSidebarSettings } = await import("@/app/admin/actions/products")

describe("Unit: Products Actions", () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockTransaction.mockClear()
  })

  test("updateBulkSidebarSettings processes formData and updates products", async () => {
    const formData = new FormData()
    formData.append("productIds", "prod-1")
    formData.append("productIds", "prod-2")
    
    formData.append("visibility_prod-1", "true")
    formData.append("order_prod-1", "1")
    
    // missing visibility means false
    formData.append("order_prod-2", "2")

    // Expecting redirect at the end
    try {
      await updateBulkSidebarSettings(formData)
    } catch (e) {
      expect((e as Error).message).toBe("Redirected to /admin?tab=products&toast=product_updated")
    }

    expect(mockTransaction).toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    
    // Verify arguments for prod-1
    expect(mockUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "prod-1" },
      data: { showOnSidebar: true, sortOrder: 1 }
    })
    
    // Verify arguments for prod-2
    expect(mockUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "prod-2" },
      data: { showOnSidebar: false, sortOrder: 2 }
    })
  })
})
