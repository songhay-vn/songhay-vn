"use client"

import { useRouter } from "next/navigation"

export function useAdminFilterForm() {
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    formData.forEach((value, key) => {
      if (typeof value === "string" && value) {
        params.append(key, value)
      }
    })
    router.replace(`/admin?${params.toString()}`, { scroll: false })
  }

  return { onSubmit }
}
