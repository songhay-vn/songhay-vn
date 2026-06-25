"use client"

import { useRef, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { useFormStatus } from "react-dom"

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
import { Button } from "@/components/ui/button"

const SUBMIT_GUARD_WINDOW_MS = 1200

type ConfirmSubmitButtonProps = React.ComponentProps<typeof Button> & {
  confirmMessage: string
  confirmTitle?: string
  confirmText?: string
  cancelText?: string
  pendingText?: string
}

export function ConfirmSubmitButton({
  confirmMessage,
  confirmTitle = "Xác nhận thao tác",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  pendingText = "Đang xử lý...",
  disabled,
  onClick,
  children,
  name,
  value,
  type,
  ...props
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus()
  const [open, setOpen] = useState(false)
  const submitterRef = useRef<HTMLButtonElement>(null)
  const lastSubmitAtRef = useRef(0)
  const submitName = typeof name === "string" ? name : undefined
  const submitValue =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : undefined

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)

    if (event.defaultPrevented) return
    if (type && type !== "submit") return
    if (pending) {
      event.preventDefault()
      return
    }

    const now = Date.now()
    if (now - lastSubmitAtRef.current < SUBMIT_GUARD_WINDOW_MS) {
      event.preventDefault()
      return
    }

    const form = event.currentTarget.form
    if (!form) return
    if (!form.reportValidity()) return

    event.preventDefault()
    setOpen(true)
  }

  function submitWithConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    const submitter = submitterRef.current
    const form = submitter?.form

    if (!form || !submitter) {
      event.preventDefault()
      return
    }

    if (!form.reportValidity()) {
      event.preventDefault()
      setOpen(false)
      return
    }

    lastSubmitAtRef.current = Date.now()
    setOpen(false)
    form.requestSubmit(submitter)
  }

  return (
    <>
      <Button
        {...props}
        type="button"
        onClick={handleClick}
        disabled={disabled || pending}
        aria-busy={pending}
      >
        {pending ? (
          <span className="inline-flex items-center gap-1.5">
            <LoaderCircle className="size-4 animate-spin" />
            {pendingText}
          </span>
        ) : (
          children
        )}
      </Button>
      {open ? (
        <button
          ref={submitterRef}
          type="submit"
          name={submitName}
          value={submitValue}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelText}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={submitWithConfirm}
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
