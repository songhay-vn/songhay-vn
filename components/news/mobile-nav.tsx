"use client"

import * as React from "react"
import Link from "next/link"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface Category {
  id: string
  name: string
  slug: string
  children?: {
    id: string
    name: string
    slug: string
  }[]
}

interface MobileNavProps {
  navCategories: Category[]
}

export function MobileNav({ navCategories }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -mr-2 h-10 w-10 text-white focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Menu className="size-7" stroke="currentColor" fill="currentColor" />
          <span className="sr-only">Mở menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full flex-col p-0 pr-0 md:hidden">
        <SheetHeader className="border-b border-white/10 bg-red-700 p-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-left font-black uppercase tracking-tight text-white">
              Danh mục
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex flex-col p-2">
            {navCategories.map((item) => (
              <div key={item.slug} className="flex flex-col">
                <SheetClose asChild>
                  <Link
                    href={`/${item.slug}`}
                    className="flex items-center gap-2 rounded-md px-4 py-3 text-lg font-bold text-zinc-800 transition hover:bg-zinc-50 hover:text-red-700"
                  >
                    {item.name}
                  </Link>
                </SheetClose>
                {item.children && item.children.length > 0 && (
                  <div className="ml-4 flex flex-col border-l border-zinc-100">
                    {item.children.map((child) => (
                      <SheetClose asChild key={child.slug}>
                        <Link
                          href={`/${child.slug}`}
                          className="rounded-md px-4 py-2.5 text-base font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-red-700"
                        >
                          {child.name}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-zinc-100 bg-zinc-50 p-4">
          <p className="text-center text-xs text-zinc-500">
            &copy; 2024 SongHay.vn. Sống khỏe thuận tự nhiên.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
