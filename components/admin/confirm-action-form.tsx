"use client"

import { useRef, useState, type ReactNode } from "react"
import { showToastByKey } from "./action-toast"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ConfirmActionFormProps = {
  action: (formData: FormData) => void | Promise<unknown>
  confirmMessage: string
  children: ReactNode
  className?: string
  fields?: Array<{ name: string; value: string }>
}

export function ConfirmActionForm({ action, confirmMessage, children, className, fields = [] }: ConfirmActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const bypassConfirmRef = useRef(false)
  const submitterRef = useRef<HTMLButtonElement | HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)

  function submitWithConfirm() {
    if (!formRef.current) {
      return
    }

    bypassConfirmRef.current = true
    const submitter = submitterRef.current
    setOpen(false)
    formRef.current.requestSubmit(submitter || undefined)
  }

  return (
    <>
      <form
        ref={formRef}
        action={async (formData) => {
          const result = await action(formData)
          if (result && typeof result === "object" && "toast" in result && typeof result.toast === "string") {
            showToastByKey(result.toast)
          }
        }}
        className={className}
        onSubmit={(event) => {
          if (bypassConfirmRef.current) {
            bypassConfirmRef.current = false
            return
          }

          const nativeEvent = event.nativeEvent as SubmitEvent
          const submitter = nativeEvent.submitter

          if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
            submitterRef.current = submitter
          } else {
            submitterRef.current = null
          }

          event.preventDefault()
          setOpen(true)
        }}
      >
        {fields.map((field) => (
          <input key={field.name} type="hidden" name={field.name} value={field.value} />
        ))}
        {children}
      </form>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thao tác</AlertDialogTitle>
            <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={submitWithConfirm}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
