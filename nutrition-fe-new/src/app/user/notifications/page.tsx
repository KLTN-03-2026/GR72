'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCircle, RefreshCw } from 'lucide-react'
import { SectionHeader, Card, UserButton, UserNotice, StatusBadge } from '@/components/user/user-ui'
import { customerGet, customerPatch } from '@/lib/customer-api'
import Link from 'next/link'

type Row = Record<string, any>

export default function UserNotificationsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [readingAll, setReadingAll] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    try {
      setRows(await customerGet<Row[]>('/notifications'))
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function read(id: number) {
    try {
      await customerPatch(`/notifications/${id}/read`)
      await load()
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  async function readAll() {
    setReadingAll(true)
    try {
      await customerPatch('/notifications/read-all')
      setMessage('✅ Đã đánh dấu tất cả là đã đọc.')
      await load()
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setReadingAll(false)
    }
  }

  const unreadCount = rows.filter((r) => r.trang_thai === 'chua_doc').length

  return (
    <>
      <SectionHeader 
        title='Thông báo của bạn' 
        subtitle={`Bạn có ${unreadCount} thông báo chưa đọc.`}
        action={
          <UserButton onClick={readAll} disabled={readingAll || unreadCount === 0} size='sm'>
            <CheckCircle size={14} /> {readingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </UserButton>
        }
      />

      {message && <UserNotice tone={message.startsWith('✅') ? 'success' : 'error'}>{message}</UserNotice>}

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {loading && <p style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Đang tải thông báo...</p>}
        {!loading && rows.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Bell size={40} color='#c7d2fe' style={{ margin: '0 auto' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginTop: 12 }}>Bạn chưa có thông báo nào</p>
            </div>
          </Card>
        )}
        {!loading && rows.map((row) => (
          <Card key={row.id} hover>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: row.trang_thai === 'chua_doc' ? '#eef2ff' : '#f1f5f9',
                color: row.trang_thai === 'chua_doc' ? '#4f46e5' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bell size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 15, fontWeight: row.trang_thai === 'chua_doc' ? 700 : 600, color: row.trang_thai === 'chua_doc' ? '#0f172a' : '#475569' }}>
                    {row.tieu_de}
                  </h3>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {new Date(row.tao_luc).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: row.trang_thai === 'chua_doc' ? '#334155' : '#64748b', marginTop: 4, lineHeight: 1.5 }}>
                  {row.noi_dung}
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  {row.duong_dan_hanh_dong && (
                    <Link href={row.duong_dan_hanh_dong} style={{ fontSize: 13, fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>
                      Xem chi tiết →
                    </Link>
                  )}
                  {row.trang_thai === 'chua_doc' && (
                    <button onClick={() => read(row.id)} style={{ fontSize: 13, fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
