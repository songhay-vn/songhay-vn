"use client"

import Image from "next/image"
import { ChevronsUpDown } from "lucide-react"
import { useMemo, useState } from "react"

import type { PenNameOption } from "@/app/admin/data-loaders/pen-names"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getPenNameInitials } from "@/lib/pen-names"

type PenNameSelectProps = {
  options: PenNameOption[]
  defaultValue?: string | null
  name?: string
  inputId?: string
}

function PenNameOptionAvatar({ option }: { option: PenNameOption }) {
  return (
    <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-[10px] font-semibold text-muted-foreground">
      {option.avatarUrl ? (
        <Image
          src={option.avatarUrl}
          alt={`Ảnh đại diện ${option.name}`}
          width={24}
          height={24}
          sizes="24px"
          className="size-full object-cover"
        />
      ) : (
        getPenNameInitials(option.name)
      )}
    </span>
  )
}

export function PenNameSelect({
  options,
  defaultValue = "",
  name = "penNameId",
  inputId = "postPenNameId",
}: PenNameSelectProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(defaultValue || "")
  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedId) || null,
    [options, selectedId]
  )

  return (
    <div className="flex w-full max-w-80 flex-col gap-1.5">
      <input id={inputId} type="hidden" name={name} value={selectedId} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full justify-between px-3"
            disabled={options.length === 0}
          >
            <span className="flex min-w-0 items-center gap-2">
              {selectedOption ? (
                <>
                  <PenNameOptionAvatar option={selectedOption} />
                  <span className="truncate">{selectedOption.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Chọn bút danh
                </span>
              )}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder="Tìm bút danh..." />
            <CommandList className="max-h-56">
              <CommandEmpty>Không có bút danh phù hợp.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    data-checked={selectedId === option.id}
                    onSelect={() => {
                      setSelectedId(option.id)
                      setOpen(false)
                    }}
                  >
                    <PenNameOptionAvatar option={option} />
                    <span className="truncate">{option.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Chưa có bút danh nào. Vào Cài đặt → Bút danh để tạo trước.
        </p>
      ) : null}
    </div>
  )
}
