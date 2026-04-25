'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LoaderCircle, RefreshCw, VideoOff } from 'lucide-react'
import { RoomAudioRenderer, VideoConference, LiveKitRoom } from '@livekit/components-react'
import '@livekit/components-styles'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  createConsultationCallToken,
  getConsultationCallRoom,
  type ConsultationCallRoom,
  type ConsultationCallTokenSession,
} from '@/services/consultation-call/api'
import styles from './consultation-call.module.css'

type Props = {
  bookingId: number
  mode?: 'embedded' | 'standalone'
}

function lockReasonLabel(reason: string | null) {
  if (reason === 'not_checked_in') return 'Chưa check-in'
  if (reason === 'after_end') return 'Đã quá giờ hẹn'
  if (reason === 'booking_cancelled') return 'Booking đã hủy'
  if (reason === 'booking_disabled') return 'Booking bị vô hiệu hóa'
  return 'Không thể vào phòng gọi'
}

export function ConsultationCall({ bookingId, mode = 'embedded' }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const shouldCloseOnDisconnectRef = useRef(false)
  const [roomState, setRoomState] = useState<ConsultationCallRoom | null>(null)
  const [session, setSession] = useState<ConsultationCallTokenSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [joining, setJoining] = useState(false)

  const canJoin = roomState?.room_state.can_join ?? false
  const connectEnabled = Boolean(session?.token && canJoin)
  const isStandalone = mode === 'standalone'

  const closeStandaloneWindow = useCallback(() => {
    if (!isStandalone || typeof window === 'undefined') {
      return
    }

    const fallbackPath =
      roomState?.participant.vai_tro === 'chuyen_gia_dinh_duong'
        ? `/nutritionist/bookings/${bookingId}`
        : `/nutrition/bookings/${bookingId}`

    window.close()

    window.setTimeout(() => {
      if (!window.closed) {
        window.location.assign(fallbackPath)
      }
    }, 120)
  }, [bookingId, isStandalone, roomState?.participant.vai_tro])

  const loadRoom = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const data = await getConsultationCallRoom(bookingId)
      setRoomState(data)
      if (!data.room_state.can_join) {
        setSession(null)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải trạng thái phòng gọi')
      setRoomState(null)
      setSession(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [bookingId])

  const joinCall = useCallback(async () => {
    if (!roomState?.room_state.can_join) {
      return
    }
    setJoining(true)
    try {
      const tokenSession = await createConsultationCallToken(bookingId)
      setSession(tokenSession)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo phiên gọi video')
      setSession(null)
    } finally {
      setJoining(false)
    }
  }, [bookingId, roomState?.room_state.can_join])

  useEffect(() => {
    void loadRoom()
  }, [loadRoom])

  useEffect(() => {
    if (!roomState || !roomState.room_state.can_join || session) {
      return
    }
    void joinCall()
  }, [joinCall, roomState, session])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadRoom(true)
    }, 15000)
    return () => window.clearInterval(timer)
  }, [loadRoom])

  useEffect(() => {
    if (!isStandalone || typeof document === 'undefined') {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [isStandalone])

  useEffect(() => {
    if (!isStandalone || !session?.token) {
      return
    }

    shouldCloseOnDisconnectRef.current = false

    const root = containerRef.current
    if (!root) {
      return
    }

    const leaveButton = root.querySelector<HTMLButtonElement>('.lk-disconnect-button')
    if (!leaveButton) {
      return
    }

    const handleLeaveClick = () => {
      shouldCloseOnDisconnectRef.current = true
      window.setTimeout(() => {
        closeStandaloneWindow()
      }, 120)
    }

    leaveButton.addEventListener('click', handleLeaveClick)
    return () => {
      leaveButton.removeEventListener('click', handleLeaveClick)
    }
  }, [closeStandaloneWindow, isStandalone, session?.token])

  const subtitle = useMemo(() => {
    if (!roomState) return ''
    return `${roomState.booking.ngay_hen} · ${roomState.booking.gio_bat_dau.slice(0, 5)} - ${roomState.booking.gio_ket_thuc.slice(0, 5)}`
  }, [roomState])

  if (loading) {
    return (
      <div className='flex min-h-[70vh] items-center justify-center text-sm text-muted-foreground'>
        <LoaderCircle className='mr-2 size-4 animate-spin' />
        Đang tải phòng gọi video...
      </div>
    )
  }

  if (!roomState) {
    return (
      <div className='space-y-4 rounded-xl border bg-background p-6'>
        <p className='text-sm text-muted-foreground'>Không tải được dữ liệu phòng gọi.</p>
        <Button variant='outline' onClick={() => void loadRoom()}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <section
      className={
        isStandalone
          ? 'grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden'
          : 'flex min-h-[calc(100vh-12rem)] flex-col gap-3'
      }
    >
      <header className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground'>Phòng gọi video booking</p>
          <p className='mt-1 text-sm text-foreground/80'>{subtitle}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant={canJoin ? 'default' : 'secondary'}>
            {canJoin ? 'Đang mở' : lockReasonLabel(roomState.room_state.lock_reason)}
          </Badge>
          <Button size='icon' variant='outline' onClick={() => void loadRoom(true)} disabled={refreshing}>
            {refreshing ? <LoaderCircle className='size-4 animate-spin' /> : <RefreshCw className='size-4' />}
          </Button>
        </div>
      </header>

      {!canJoin ? (
        <div className='flex min-h-[70vh] flex-col items-center justify-center rounded-xl border bg-background p-6 text-center'>
          <VideoOff className='size-8 text-muted-foreground' />
          <p className='mt-3 text-base font-medium'>Phòng gọi chưa sẵn sàng</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            {lockReasonLabel(roomState.room_state.lock_reason)}. Bạn có thể quay lại khi booking đủ điều kiện.
          </p>
        </div>
      ) : session ? (
        <div
          ref={containerRef}
          className={
            isStandalone
              ? 'min-h-0 overflow-hidden rounded-lg border bg-background'
              : 'overflow-hidden rounded-xl border bg-background'
          }
        >
          <LiveKitRoom
            token={session.token}
            serverUrl={session.server_url}
            connect={connectEnabled}
            video
            audio
            className={`${isStandalone ? 'h-full min-h-0' : 'h-[78vh] min-h-[620px]'} ${styles.callRoom}`}
            onDisconnected={() => {
              toast.message('Cuộc gọi đã kết thúc')
              if (shouldCloseOnDisconnectRef.current) {
                closeStandaloneWindow()
              }
            }}
            onError={(error) => {
              toast.error(error.message || 'Lỗi kết nối video call')
            }}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      ) : (
        <div className='flex min-h-[70vh] items-center justify-center rounded-xl border bg-background p-6'>
          <Button onClick={() => void joinCall()} disabled={joining}>
            {joining ? (
              <>
                <LoaderCircle className='mr-2 size-4 animate-spin' />
                Đang vào phòng...
              </>
            ) : (
              'Bắt đầu gọi video'
            )}
          </Button>
        </div>
      )}
    </section>
  )
}
