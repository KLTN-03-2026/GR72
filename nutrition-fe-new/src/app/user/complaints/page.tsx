'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Plus, ChevronRight, MessageSquare } from 'lucide-react'
import { SectionHeader, Card, UserButton, UserEmptyState, StatusBadge, UserNotice } from '@/components/user/user-ui'
import { customerGet } from '@/lib/customer-api'

type Row = Record<string, any>

const STATUS_LABELS: Record<string, string> = {
  moi: 'Mới', dang_xu_ly: 'Đang xử lý', da_xu_ly: 'Đã xử lý', da_dong: 'Đã đóng', da_huy: 'Đã hủy',
}
const TYPE_LABELS: Record<string, string> = {
  booking: '📅 Lịch hẹn', thanh_toan: '💳 Thanh toán', danh_gia: '⭐ Đánh giá', khac: '🔖 Khác',
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    customerGet<Row[]>('/complaints')
      .then(setComplaints)
      .catch(e => setError(e.message ?? 'Lỗi tải dữ liệu'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <SectionHeader
        title='Khiếu nại & Hỗ trợ'
        subtitle='Gửi khiếu nại về lịch hẹn, thanh toán hoặc đánh giá để được hỗ trợ.'
        action={<Link href='/user/complaints/new'><UserButton size='sm'><Plus size={14} /> Tạo khiếu nại</UserButton></Link>}
      />

      {error && <UserNotice tone='error'>{error}</UserNotice>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải...</div>
      ) : complaints.length === 0 ? (
        <UserEmptyState
          icon={MessageSquare}
          title='Chưa có khiếu nại nào'
          description='Nếu bạn gặp vấn đề với lịch hẹn hoặc thanh toán, hãy gửi khiếu nại để được hỗ trợ.'
          action={<Link href='/user/complaints/new'><UserButton><Plus size={14} /> Tạo khiếu nại mới</UserButton></Link>}
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {complaints.map(c => (
            <Link key={c.id} href={`/user/complaints/${c.id}`} style={{ textDecoration: 'none' }}>
              <Card hover>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: '#f1f5f9', color: '#64748b', fontWeight: 600 }}>
                        {TYPE_LABELS[c.loai] ?? c.loai}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{c.ma_ticket}</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.tieu_de}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>
                      {new Date(c.tao_luc).toLocaleDateString('vi-VN')}
                      {c.so_tin_nhan > 0 && ` · ${c.so_tin_nhan} tin nhắn`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
                    <StatusBadge value={c.trang_thai} />
                    <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
