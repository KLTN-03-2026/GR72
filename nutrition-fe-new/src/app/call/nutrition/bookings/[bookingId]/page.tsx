'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Video,
  PhoneCall,
  PhoneOff,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Camera,
  Mic,
  Loader2,
  Calendar,
} from 'lucide-react'
import { apiRequest, type AuthUser } from '@/lib/auth'

type CallSession = {
  booking_id: number
  room_name: string
  provider: string
  call_status: string
  can_join: boolean
  reason: string | null
  open_from: string | null
  open_until: string | null
  now: string
}

type CallToken = {
  join_url: string
  token: string
  room_name: string
  provider: string
  livekit_url: string
  expires_in_seconds: number
}

type BookingDetail = {
  booking?: {
    ma_lich_hen?: string
    customer_name?: string
    expert_name?: string
    ten_goi?: string
    ngay_hen?: string
    gio_bat_dau?: string
    gio_ket_thuc?: string
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeOnly(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

/* Diff giữa 2 ISO -> chuỗi mm:ss hoặc HH:mm:ss */
function diffHumanized(target: string, now: number) {
  const ms = new Date(target).getTime() - now
  if (ms <= 0) return null
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CallBookingPage() {
  const params = useParams<{ bookingId: string }>()
  const router = useRouter()
  const bookingId = Number(params.bookingId)

  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<CallSession | null>(null)
  const [token, setToken] = useState<CallToken | null>(null)
  const [booking, setBooking] = useState<BookingDetail['booking'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null)
  const [now, setNow] = useState(Date.now())
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const rolePrefix = useMemo(() => {
    if (!user) return null
    if (user.vai_tro === 'expert') return '/expert'
    if (user.vai_tro === 'customer') return '/customer'
    return null
  }, [user])

  const homePath = useMemo(() => {
    if (!user) return '/login'
    if (user.vai_tro === 'expert') return '/nutritionist/bookings'
    if (user.vai_tro === 'customer') return `/user/bookings/${bookingId}`
    return '/'
  }, [user, bookingId])

  async function loadSession(prefix: string) {
    const res = await apiRequest<CallSession>(`${prefix}/bookings/${bookingId}/call-session`)
    setSession(res.data)
  }

  async function loadBooking(prefix: string) {
    try {
      const res = await apiRequest<BookingDetail | any>(`${prefix}/bookings/${bookingId}`)
      const data = res.data
      // Expert trả {booking, timeline}; customer thường trả flat object → handle 2 case
      if (data?.booking) setBooking(data.booking)
      else setBooking(data)
    } catch {
      // Không có booking detail vẫn không sao
    }
  }

  async function startCall(prefix: string) {
    setStarting(true)
    setNotice(null)
    try {
      const res = await apiRequest<CallToken>(`${prefix}/bookings/${bookingId}/call-token`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      setToken(res.data)
    } catch (err: any) {
      setNotice({ tone: 'error', text: err.message ?? 'Không thể bắt đầu cuộc gọi' })
    } finally {
      setStarting(false)
    }
  }

  function endCall() {
    if (confirm('Kết thúc cuộc gọi và rời khỏi phòng?')) {
      setToken(null)
      router.push(homePath)
    }
  }

  useEffect(() => {
    let active = true
    apiRequest<AuthUser>('/auth/me')
      .then(async (me) => {
        if (!active) return
        setUser(me.data)
        if (me.data.vai_tro !== 'customer' && me.data.vai_tro !== 'expert') {
          setNotice({ tone: 'error', text: 'Vai trò hiện tại không được phép vào phòng tư vấn.' })
          return
        }
        const prefix = me.data.vai_tro === 'expert' ? '/expert' : '/customer'
        await Promise.all([loadSession(prefix), loadBooking(prefix)])
      })
      .catch((err: any) => {
        if (!active) return
        setNotice({ tone: 'error', text: err.message ?? 'Không thể xác thực tài khoản' })
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [bookingId])

  // Tick mỗi giây để cập nhật countdown khi đang chờ
  useEffect(() => {
    if (token) return
    tickRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [token])

  // Auto refresh session mỗi 30s khi chưa join (bắt thời điểm `can_join` chuyển true)
  useEffect(() => {
    if (token || !rolePrefix) return
    const interval = setInterval(() => {
      loadSession(rolePrefix).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [rolePrefix, token])

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-slate-950'>
        <div className='flex items-center gap-3 text-slate-300'>
          <Loader2 size={20} className='animate-spin' />
          <span className='text-sm font-medium'>Đang tải phòng tư vấn...</span>
        </div>
      </main>
    )
  }

  /* ─── In-call state: full-screen iframe ─── */
  if (token) {
    return (
      <main className='flex h-screen flex-col bg-slate-950'>
        {/* Top bar */}
        <div className='flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-4 py-2.5'>
          <div className='flex items-center gap-3 min-w-0'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600'>
              <Video size={15} className='text-white' />
            </div>
            <div className='min-w-0'>
              <p className='truncate text-sm font-semibold text-white'>
                {booking?.ma_lich_hen ?? `Booking #${bookingId}`}
              </p>
              <div className='flex items-center gap-2 text-xs text-slate-400'>
                <span className='inline-flex items-center gap-1.5'>
                  <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400' />
                  Đang trong phòng
                </span>
                {booking?.gio_bat_dau ? (
                  <>
                    <span>·</span>
                    <span>{booking.gio_bat_dau} – {booking.gio_ket_thuc}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <button
            onClick={endCall}
            className='flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700'
          >
            <PhoneOff size={14} />
            Rời phòng
          </button>
        </div>

        {/* Video iframe */}
        <iframe
          title='Phòng tư vấn video'
          src={token.join_url}
          allow='camera; microphone; display-capture; clipboard-read; clipboard-write; autoplay; fullscreen'
          className='flex-1 border-none'
        />
      </main>
    )
  }

  /* ─── Pre-join state: lobby card ─── */
  const countdown = !session?.can_join && session?.open_from ? diffHumanized(session.open_from, now) : null
  const remaining = session?.can_join && session?.open_until ? diffHumanized(session.open_until, now) : null
  const otherPartyName = user?.vai_tro === 'expert' ? booking?.customer_name : booking?.expert_name
  const otherPartyLabel = user?.vai_tro === 'expert' ? 'Khách hàng' : 'Chuyên gia'

  return (
    <main className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4'>
      <div className='w-full max-w-lg'>
        {/* Back button */}
        <button
          onClick={() => router.push(homePath)}
          className='mb-4 flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white'
        >
          <ArrowLeft size={14} />
          Quay lại
        </button>

        {/* Card */}
        <div className='overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl'>
          {/* Hero */}
          <div className='relative bg-gradient-to-br from-emerald-600/20 via-slate-900 to-blue-600/20 px-6 pt-7 pb-5'>
            <div className='absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl' />
            <div className='absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl' />
            <div className='relative'>
              <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-900/40'>
                <Video size={24} className='text-white' />
              </div>
              <h1 className='text-2xl font-bold tracking-tight text-white'>
                Phòng tư vấn video
              </h1>
              <p className='mt-1 text-sm text-slate-400'>
                {booking?.ma_lich_hen ?? `Booking #${bookingId}`}
              </p>
            </div>
          </div>

          <div className='space-y-4 px-6 py-5'>
            {/* Booking info */}
            {(otherPartyName || booking?.ten_goi) && (
              <div className='space-y-2.5 rounded-2xl bg-slate-800/50 p-4'>
                {otherPartyName && (
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-slate-400'>{otherPartyLabel}</span>
                    <span className='font-semibold text-white'>{otherPartyName}</span>
                  </div>
                )}
                {booking?.ten_goi && (
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-slate-400'>Gói dịch vụ</span>
                    <span className='font-semibold text-white'>{booking.ten_goi}</span>
                  </div>
                )}
                {booking?.gio_bat_dau && (
                  <div className='flex items-center justify-between text-sm'>
                    <span className='flex items-center gap-1.5 text-slate-400'>
                      <Calendar size={13} /> Lịch hẹn
                    </span>
                    <span className='font-semibold text-white'>
                      {String(booking.ngay_hen ?? '').slice(0, 10)} · {booking.gio_bat_dau}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Countdown */}
            {countdown && session && (
              <div className='rounded-2xl border border-amber-900/50 bg-amber-950/30 p-4'>
                <div className='flex items-start gap-3'>
                  <Clock size={16} className='mt-0.5 shrink-0 text-amber-400' />
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-amber-300'>Phòng sẽ mở sau</p>
                    <p className='mt-1 font-mono text-3xl font-bold tracking-tight text-white'>
                      {countdown}
                    </p>
                    <p className='mt-1 text-xs text-amber-200/70'>
                      Mở từ {formatTimeOnly(session.open_from)} đến {formatTimeOnly(session.open_until)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            {session && (
              <div
                className={
                  session.can_join
                    ? 'flex items-start gap-3 rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-emerald-300'
                    : 'flex items-start gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-4 text-slate-300'
                }
              >
                {session.can_join ? (
                  <CheckCircle size={16} className='mt-0.5 shrink-0' />
                ) : (
                  <AlertCircle size={16} className='mt-0.5 shrink-0' />
                )}
                <div className='flex-1 text-sm'>
                  {session.can_join ? (
                    <>
                      <p className='font-semibold'>Sẵn sàng vào phòng</p>
                      {remaining && (
                        <p className='mt-0.5 text-xs text-emerald-200/70'>
                          Cửa sổ tư vấn còn lại: <span className='font-mono font-bold'>{remaining}</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <p>{session.reason ?? 'Booking chưa hợp lệ để vào phòng tư vấn.'}</p>
                  )}
                </div>
              </div>
            )}

            {/* Permission tip */}
            {session?.can_join && !token && (
              <div className='flex items-start gap-3 rounded-2xl border border-blue-900/50 bg-blue-950/30 p-3 text-xs text-blue-300'>
                <div className='flex gap-2 mt-0.5'>
                  <Camera size={13} />
                  <Mic size={13} />
                </div>
                <p>Vui lòng cho phép trình duyệt truy cập <strong>camera + micro</strong> khi được yêu cầu.</p>
              </div>
            )}

            {/* Notice lỗi */}
            {notice && (
              <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
                notice.tone === 'error'
                  ? 'border-red-900/50 bg-red-950/30 text-red-300'
                  : 'border-blue-900/50 bg-blue-950/30 text-blue-300'
              }`}>
                <AlertCircle size={15} className='mt-0.5 shrink-0' />
                <span>{notice.text}</span>
              </div>
            )}

            {/* Actions */}
            <div className='flex gap-2 pt-1'>
              <button
                type='button'
                onClick={() => rolePrefix && loadSession(rolePrefix).catch((e: any) => setNotice({ tone: 'error', text: e.message }))}
                className='flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white'
              >
                <RefreshCw size={14} />
                Làm mới
              </button>
              <button
                type='button'
                disabled={!session?.can_join || !rolePrefix || starting}
                onClick={() => rolePrefix && startCall(rolePrefix)}
                className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-all hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none'
              >
                {starting ? (
                  <>
                    <Loader2 size={15} className='animate-spin' />
                    Đang vào phòng...
                  </>
                ) : (
                  <>
                    <PhoneCall size={15} />
                    Bắt đầu tư vấn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className='mt-4 text-center text-xs text-slate-500'>
          Phòng tự động đóng sau khi kết thúc cửa sổ tư vấn.
          <br />
          Mọi nội dung trong cuộc gọi không được lưu trữ.
        </p>
      </div>
    </main>
  )
}
