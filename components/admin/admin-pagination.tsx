"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"

type AdminPaginationProps = {
  currentPage: number
  totalPages: number
  totalCount: number
  paginationItems: Array<number | "ellipsis">
  buildPageHref: (page: number) => string
  unitLabel?: string
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalCount,
  paginationItems,
  buildPageHref,
  unitLabel = "bài",
}: AdminPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
      <p className="text-xs text-zinc-500">
        Trang {currentPage}/{totalPages} ·{" "}
        {totalCount.toLocaleString("vi-VN")} {unitLabel}
      </p>

      <div className="flex items-center gap-1">
        {currentPage > 1 ? (
          <Link href={buildPageHref(currentPage - 1)}>
            <Button size="icon" variant="outline" className="size-7">
              <ChevronLeft className="size-3.5" />
            </Button>
          </Link>
        ) : (
          <Button size="icon" variant="outline" className="size-7" disabled>
            <ChevronLeft className="size-3.5" />
          </Button>
        )}

        <Pagination className="justify-start">
          <PaginationContent className="gap-0.5">
            {paginationItems.map((item, index) => (
              <PaginationItem key={`admin-pg-${index}-${String(item)}`}>
                {item === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href={buildPageHref(item)}
                    isActive={item === currentPage}
                    className="size-7 text-xs"
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>

        {currentPage < totalPages ? (
          <Link href={buildPageHref(currentPage + 1)}>
            <Button size="icon" variant="outline" className="size-7">
              <ChevronRight className="size-3.5" />
            </Button>
          </Link>
        ) : (
          <Button size="icon" variant="outline" className="size-7" disabled>
            <ChevronRight className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
