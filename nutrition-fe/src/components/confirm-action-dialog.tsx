'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ConfirmActionDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  destructive?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  children?: React.ReactNode
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  loading = false,
  destructive = false,
  onConfirm,
  onOpenChange,
  children,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='rounded-sm'>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel className='rounded-sm' disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn('rounded-sm', destructive && 'bg-destructive hover:bg-destructive/90')}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

