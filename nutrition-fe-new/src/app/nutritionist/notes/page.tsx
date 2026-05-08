'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, BookOpen, Calendar, X, Save, Target, User, Lock, Lightbulb, Edit3 } from 'lucide-react'
import { SectionHeader, Card, UserStatCard, UserButton, UserNotice, UserEmptyState } from '@/components/user/user-ui'
import { expertGet, expertPut } from '@/lib/expert-api'

type Row = Record<string, any>

export default function NotesPage() {
  const [bookings, setBookings] = useState<Row[]>([])
  const [selected, setSelected] = useState<Row | null>(null)
  const [note, setNote] = useState<Row>({})
  const [message, setMessage] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error' | 'info'>('info')
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function loadBookings() {
    setLoading(true)
    try {
      setBookings(await expertGet<Row[]>('/bookings?status=hoan_thanh'))
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi tải booking')
      setMsgTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBookings() }, [])

  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  const filtered = useMemo(() => {
    if (!search.trim()) return bookings
    const q = search.toLowerCase()
    return bookings.filter(b =>
      String(b.customer_name ?? '').toLowerCase().includes(q) ||
      String(b.ma_lich_hen ?? '').toLowerCase().includes(q) ||
      String(b.ten_goi ?? '').toLowerCase().includes(q)
    )
  }, [bookings, search])

  const stats = useMemo(() => ({
    total: bookings.length,
    withPurpose: bookings.filter((b) => b.muc_dich).length,
    latest: bookings[0]?.ngay_hen ? String(bookings[0].ngay_hen).slice(0, 10) : '—',
  }), [bookings])

  async function openNote(booking: Row) {
    setLoadingId(booking.id)
    try {
      setSelected(booking)
      setErrors({})
      setNote((await expertGet<Row | null>(`/bookings/${booking.id}/notes`)) ?? {})
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi tải ghi chú')
      setMsgTone('error')
    } finally {
      setLoadingId(null)
    }
  }

  async function save() {
    if (!selected) return
    if (!String(note.tom_tat_cho_customer ?? '').trim() && !String(note.khuyen_nghi_sau_tu_van ?? '').trim()) {
      setErrors({ note: 'Vui lòng nhập ít nhất tóm tắt hoặc khuyến nghị cho khách.' })
      return
    }
    setSaving(true)
    try {
      await expertPut(`/bookings/${selected.id}/notes`, note)
      setMessage('✅ Đã lưu ghi chú sau tư vấn.')
      setMsgTone('success')
      setSelected(null)
      await loadBookings()
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi lưu')
      setMsgTone('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SectionHeader
        title='Ghi chú sau tư vấn'
        subtitle='Lưu tóm tắt và khuyến nghị cho khách sau buổi tư vấn.'
      />

      {message && <UserNotice tone={msgTone}>{message}</UserNotice>}

      <div className='grid-stats'>
        <UserStatCard label='Booking hoàn thành' value={String(stats.total)} icon={FileText} tone='blue' />
        <UserStatCard label='Có mục đích tư vấn' value={String(stats.withPurpose)} icon={Target} tone='green' />
        <UserStatCard label='Lịch gần nhất' value={stats.latest} icon={Calendar} tone='purple' />
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='🔍 Tìm theo tên khách, mã booking, gói...'
          style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13.5, outline: 'none' }}
        />
      </div>

      {loading ? (
        <Card><p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải...</p></Card>
      ) : filtered.length === 0 ? (
        <UserEmptyState
          icon={BookOpen}
          title={bookings.length === 0 ? 'Chưa có booking hoàn thành' : 'Không có kết quả'}
          description={bookings.length === 0 ? 'Sau khi hoàn thành buổi tư vấn, booking sẽ hiển thị ở đây để bạn ghi chú.' : 'Thử từ khoá khác'}
        />
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          {filtered.map((row) => (
            <Card key={row.id} hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#6366f1', fontWeight: 700, fontFamily: 'monospace' }}>
                    {row.ma_lich_hen}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    {row.ten_goi}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 6, fontSize: 13, color: '#475569', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={13} style={{ color: '#94a3b8' }} />
                  <strong style={{ color: '#0f172a' }}>{row.customer_name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} style={{ color: '#94a3b8' }} />
                  {String(row.ngay_hen).slice(0, 10)} · {row.gio_bat_dau}
                </div>
                {row.muc_dich && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <Target size={13} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic' }}>
                      {row.muc_dich}
                    </span>
                  </div>
                )}
              </div>

              <UserButton size='sm' disabled={loadingId === row.id} onClick={() => openNote(row)}>
                <Edit3 size={12} /> {loadingId === row.id ? 'Đang mở...' : 'Soạn ghi chú'}
              </UserButton>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <NoteModal
          booking={selected}
          note={note}
          setNote={(n) => { setNote(n); setErrors({}) }}
          error={errors.note}
          saving={saving}
          onSave={save}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function NoteModal({ booking, note, setNote, error, saving, onSave, onClose }: {
  booking: Row; note: Row; setNote: (n: Row) => void; error?: string;
  saving: boolean; onSave: () => void; onClose: () => void;
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: 20, maxWidth: 800, width: '100%',
        maxHeight: '92vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#6366f1', fontWeight: 700, fontFamily: 'monospace' }}>
              {booking.ma_lich_hen}
            </p>
            <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              Ghi chú sau tư vấn
            </h2>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Booking context */}
          <div style={{ padding: 14, background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderRadius: 12, border: '1px solid #d1fae5', marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#065f46' }}>
              <User size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              {booking.customer_name}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#065f46' }}>
              {booking.ten_goi} · {String(booking.ngay_hen).slice(0, 10)} {booking.gio_bat_dau}
            </p>
            {booking.muc_dich && (
              <p style={{ margin: '8px 0 0', padding: 8, background: 'white', borderRadius: 8, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                <strong>Mục đích:</strong> {booking.muc_dich}
              </p>
            )}
          </div>

          {/* Form */}
          <div style={{ display: 'grid', gap: 14 }}>
            <NoteField
              label='Tóm tắt cho khách hàng'
              icon={<FileText size={14} />}
              hint='Khách sẽ thấy phần này trong booking detail'
              tone='#10b981'
            >
              <textarea
                style={textareaStyle(error)}
                value={note.tom_tat_cho_customer ?? ''}
                onChange={(e) => setNote({ ...note, tom_tat_cho_customer: e.target.value })}
                placeholder='Trong buổi tư vấn hôm nay chúng ta đã thống nhất...'
              />
            </NoteField>

            <NoteField
              label='Khuyến nghị sau tư vấn'
              icon={<Lightbulb size={14} />}
              hint='Lời khuyên cụ thể, hành động khách cần làm'
              tone='#f59e0b'
            >
              <textarea
                style={textareaStyle(error)}
                value={note.khuyen_nghi_sau_tu_van ?? ''}
                onChange={(e) => setNote({ ...note, khuyen_nghi_sau_tu_van: e.target.value })}
                placeholder='1. Uống đủ 2L nước/ngày&#10;2. Tập thể dục 30 phút x 3 ngày/tuần&#10;3. Tái khám sau 2 tuần'
              />
            </NoteField>

            <NoteField
              label='Ghi chú nội bộ'
              icon={<Lock size={14} />}
              hint='Chỉ chuyên gia thấy, không hiển thị cho khách'
              tone='#64748b'
            >
              <textarea
                style={{ ...textareaStyle(), minHeight: 80 }}
                value={note.ghi_chu_noi_bo ?? ''}
                onChange={(e) => setNote({ ...note, ghi_chu_noi_bo: e.target.value })}
                placeholder='Khách cần theo dõi sát, có dấu hiệu...'
              />
            </NoteField>

            {error && <p style={{ margin: 0, fontSize: 12.5, color: '#dc2626', fontWeight: 600 }}>{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
              <UserButton variant='ghost' onClick={onClose}>Huỷ</UserButton>
              <UserButton onClick={onSave} disabled={saving}>
                <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
              </UserButton>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}

function NoteField({ label, icon, hint, tone, children }: {
  label: string; icon: React.ReactNode; hint: string; tone: string; children: React.ReactNode
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ color: tone }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</span>
      </div>
      <p style={{ margin: '0 0 6px', fontSize: 11.5, color: '#94a3b8' }}>{hint}</p>
      {children}
    </div>
  )
}

function textareaStyle(error?: string): React.CSSProperties {
  return {
    width: '100%', minHeight: 100, padding: '10px 12px', borderRadius: 10,
    border: `1px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
    fontSize: 13.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
  }
}
