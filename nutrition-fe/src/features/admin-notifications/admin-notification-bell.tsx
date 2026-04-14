'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { getAdminUnreadCount, getNotifications, markAdminNotificationRead, type Notification } from '@/services/admin-notifications/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<number | null>(null)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchCount = useCallback(async () => {
    try {
      const data = await getAdminUnreadCount()
      setCount(data.count ?? 0)
    } catch {
      // ignore
    }
  }, [])

  const fetchRecent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNotifications({ limit: 5 })
      setItems(res?.items ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCount()
    const interval = setInterval(() => { void fetchCount() }, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  useEffect(() => {
    if (!open) return
    void fetchRecent()
    void fetchCount()
  }, [open, fetchRecent, fetchCount])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      void fetchRecent()
    }
  }

  const handleNotificationClick = async (item: Notification) => {
    if (item.trang_thai === 'chua_doc') {
      setMarkingId(item.id)
      try {
        await markAdminNotificationRead(item.id)
        await fetchCount()
        setItems(prev => prev.map(n => n.id === item.id ? { ...n, trang_thai: 'da_doc' as const } : n))
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : 'Lỗi')
      } finally {
        setMarkingId(null)
      }
    }

    if (item.duong_dan_hanh_dong) {
      setOpen(false)
      router.push(item.duong_dan_hanh_dong)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Vừa xong'
    if (diffMin < 60) return `${diffMin}p trước`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH} giờ trước`
    const diffD = Math.floor(diffH / 24)
    if (diffD < 7) return `${diffD} ngày trước`
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className='relative'>
      <Button
        variant='ghost'
        size='icon'
        className='relative h-8 w-8 rounded-full'
        onClick={() => handleOpenChange(!open)}
      >
        <Bell className='size-[1.1rem]' />
        {count > 0 && (
          <span className='absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white'>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Button>

      {open && (
        <div
          ref={dropdownRef}
          className='absolute right-0 top-full mt-2 z-50 w-96 rounded-sm border bg-popover shadow-lg'
        >
          <div className='flex items-center justify-between border-b px-4 py-3'>
            <p className='text-sm font-semibold'>Thông báo</p>
            {count > 0 && (
              <Badge variant='outline' className='text-xs text-muted-foreground'>
                {count} chưa đọc
              </Badge>
            )}
          </div>

          {items.length > 0 ? (
            <>
              <ScrollArea className='max-h-80'>
                <div className='divide-y'>
                  {items.map(item => (
                    <button
                      key={item.id}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                        item.trang_thai === 'chua_doc' && 'bg-blue-50/50 dark:bg-blue-950/20'
                      )}
                      onClick={() => void handleNotificationClick(item)}
                      disabled={markingId === item.id}
                    >
                      <div className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        item.trang_thai === 'chua_doc'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {item.trang_thai === 'da_doc' ? <CheckCheck size={14} /> : <Bell size={14} />}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className={cn('text-sm truncate', item.trang_thai === 'chua_doc' && 'font-semibold')}>
                          {item.tieu_de}
                        </div>
                        {item.noi_dung && (
                          <div className='mt-0.5 text-xs text-muted-foreground line-clamp-2'>
                            {item.noi_dung}
                          </div>
                        )}
                        <div className='mt-1 text-[11px] text-muted-foreground'>
                          {formatTime(item.tao_luc)}
                        </div>
                      </div>
                      {item.trang_thai === 'chua_doc' && (
                        <div className='mt-1 shrink-0'>
                          <span className='h-2 w-2 rounded-full bg-blue-500' />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className='border-t p-2'>
                <Button
                  variant='ghost'
                  className='w-full text-xs text-muted-foreground'
                  onClick={() => { setOpen(false); router.push('/admin/notifications') }}
                >
                  Xem tất cả thông báo
                </Button>
              </div>
            </>
          ) : !loading ? (
            <div className='flex flex-col items-center gap-2 py-10 text-muted-foreground'>
              <Bell className='size-8 opacity-20' />
              <p className='text-sm'>Không có thông báo nào</p>
            </div>
          ) : null}
        </div>
      )}

      {open && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
