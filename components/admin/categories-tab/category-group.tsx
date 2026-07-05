"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { CategoryRow } from "./category-row"
import type { CategoryActions, CategoryManageRow } from "./types"

type CategoryGroupProps = {
  parent: CategoryManageRow
  childCategories: CategoryManageRow[]
  allCategories: CategoryManageRow[]
  rootCategories: CategoryManageRow[]
  parentIndex: number
  parentTotal: number
  movedCategoryId?: string
  movedDirection?: string
} & CategoryActions

export function CategoryGroup({
  parent,
  childCategories,
  allCategories,
  rootCategories,
  parentIndex,
  parentTotal,
  movedCategoryId,
  movedDirection,
  updateCategory,
  reorderCategory,
  deleteCategory,
}: CategoryGroupProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="space-y-2">
      {/* Parent row with collapse toggle */}
      <div className="flex items-stretch gap-2">
        {childCategories.length > 0 ? (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-start pt-3.5 text-zinc-400 transition hover:text-zinc-600"
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
        ) : (
          <div className="w-6 shrink-0" />
        )}

        <div className="flex-1">
          <CategoryRow
            category={parent}
            allCategories={allCategories}
            rootCategories={rootCategories}
            isChild={false}
            index={parentIndex}
            totalCount={parentTotal}
            movedCategoryId={movedCategoryId}
            movedDirection={movedDirection}
            updateCategory={updateCategory}
            reorderCategory={reorderCategory}
            deleteCategory={deleteCategory}
          />
        </div>
      </div>

      {/* Children */}
      {!collapsed && childCategories.length > 0 && (
        <div className="space-y-2 pl-8">
          {childCategories.map((child, ci) => (
            <CategoryRow
              key={child.id}
              category={child}
              allCategories={allCategories}
              rootCategories={rootCategories}
              isChild
              index={ci}
              totalCount={childCategories.length}
              movedCategoryId={movedCategoryId}
              movedDirection={movedDirection}
              updateCategory={updateCategory}
              reorderCategory={reorderCategory}
              deleteCategory={deleteCategory}
            />
          ))}
        </div>
      )}
    </div>
  )
}
