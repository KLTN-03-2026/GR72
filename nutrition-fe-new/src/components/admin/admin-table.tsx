'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

export function DataTable({
  children,
  minWidth = '900px',
}: {
  children: React.ReactNode
  minWidth?: string
}) {
  return (
    <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]'>
      <div className='overflow-x-auto'>
        <table className='w-full border-separate border-spacing-0 text-left text-sm' style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  )
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`sticky top-0 z-[1] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      {children}
    </th>
  )
}

export function Td({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: React.MouseEventHandler<HTMLTableCellElement> }) {
  return (
    <td className={`border-t border-slate-100 px-4 py-3 align-middle text-slate-700 ${className}`} onClick={onClick}>
      {children}
    </td>
  )
}

export function Modal({
  title,
  description,
  open,
  onClose,
  children,
  width = 'max-w-3xl',
}: {
  title: string
  description?: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm'
      role='dialog'
      aria-modal='true'
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`max-h-[92vh] w-full ${width} overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-2xl`}>
        <div className='flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5'>
          <div className='min-w-0'>
            <h3 className='text-xl font-semibold text-slate-950'>{title}</h3>
            {description ? <p className='mt-1 text-sm leading-6 text-slate-500'>{description}</p> : null}
          </div>
          <button
            type='button'
            onClick={onClose}
            className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700'
            aria-label='Đóng'
          >
            <X size={16} />
          </button>
        </div>
        <div className='max-h-[calc(92vh-92px)] overflow-y-auto p-5 sm:p-6'>{children}</div>
      </div>
    </div>
  )
}
