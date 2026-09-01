"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type VietGiftSearchFormProps = {
  defaultValue?: string
}

export function VietGiftSearchForm({ defaultValue = "" }: VietGiftSearchFormProps) {
  const [value, setValue] = React.useState(defaultValue)

  React.useEffect(() => {
    setValue(defaultValue || "")
  }, [defaultValue])

  return (
    <form action="/qua-viet" method="GET" className="relative w-full">
      <Input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tìm kiếm đặc sản"
        className="h-10 pl-3 pr-10 text-sm bg-zinc-50 focus:bg-white border-zinc-300 focus:border-rose-500 rounded-sm"
      />
      <Button
        type="submit"
        aria-label="Tìm kiếm đặc sản"
        variant="ghost"
        size="icon-sm"
        className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-rose-600 hover:bg-transparent"
      >
        <Search className="size-4" />
      </Button>
    </form>
  )
}
