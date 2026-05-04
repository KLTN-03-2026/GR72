'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
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

function fmt(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN')
}

export default function CallBookingPage() {
  const params = useParams<{ bookingId: string }>()
  const bookingId = Number(params.bookingId)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<CallSession | null>(null)
  const [token, setToken] = useState<CallToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [notice, setNotice] = useState('')

  const rolePrefix = useMemo(() => {
    if (!user) return null
    if (user.vai_tro === 'expert') return '/expert'
    if (user.vai_tro === 'customer') return '/customer'
    return null
  }, [user])

  async function loadSession(targetRolePrefix: string) {
    const response = await apiRequest<CallSession>(`${targetRolePrefix}/bookings/${bookingId}/call-session`)
    setSession(response.data)
  }

  async function startCall(targetRolePrefix: string) {
    setStarting(true)
    setNotice('')
    try {
      const response = await apiRequest<CallToken>(`${targetRolePrefix}/bookings/${bookingId}/call-token`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      setToken(response.data)
    } catch (error: any) {
      setNotice(error.message ?? 'Khong the bat dau cuoc goi')
    } finally {
      setStarting(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([
      apiRequest<AuthUser>('/auth/me'),
    ])
      .then(async ([me]) => {
        if (!active) return
        setUser(me.data)
        if (me.data.vai_tro !== 'customer' && me.data.vai_tro !== 'expert') {
          setNotice('Vai tro hien tai khong duoc phep vao phong goi.')
          return
        }
        const prefix = me.data.vai_tro === 'expert' ? '/expert' : '/customer'
        await loadSession(prefix)
      })
      .catch((error: any) => {
        if (!active) return
        setNotice(error.message ?? 'Khong the xac thuc tai khoan')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [bookingId])

  if (loading) {
    return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui, sans-serif' }}>Dang tai phong goi...</main>
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ maxWidth: 1280, margin: '0 auto', border: '1px solid #e2e8f0', borderRadius: 14, background: 'white', overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Phong goi video booking #{bookingId}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Cua so hop le: {fmt(session?.open_from)} - {fmt(session?.open_until)}
            </p>
          </div>
          <button
            type='button'
            onClick={() => rolePrefix && loadSession(rolePrefix).catch((error: any) => setNotice(error.message))}
            style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '8px 12px', background: 'white', cursor: 'pointer' }}
          >
            Lam moi
          </button>
        </div>

        {notice ? <div style={{ margin: 16, padding: 12, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 14 }}>{notice}</div> : null}

        {!token ? (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: session?.can_join ? '#ecfdf5' : '#fff7ed', border: `1px solid ${session?.can_join ? '#a7f3d0' : '#fed7aa'}`, color: session?.can_join ? '#065f46' : '#9a3412' }}>
              {session?.can_join ? 'Booking hop le, ban co the vao phong goi.' : (session?.reason ?? 'Booking chua hop le de vao phong goi.')}
            </div>
            <button
              type='button'
              disabled={!session?.can_join || !rolePrefix || starting}
              onClick={() => rolePrefix && startCall(rolePrefix)}
              style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: '#2563eb', color: 'white', cursor: 'pointer', opacity: !session?.can_join || starting ? 0.6 : 1 }}
            >
              {starting ? 'Dang vao phong...' : 'Bat dau cuoc goi'}
            </button>
          </div>
        ) : (
          <iframe
            title='LiveKit Call'
            src={token.join_url}
            allow='camera; microphone; display-capture; clipboard-read; clipboard-write; autoplay; fullscreen'
            style={{ width: '100%', minHeight: 'calc(100vh - 132px)', border: 'none' }}
          />
        )}
      </section>
    </main>
  )
}

