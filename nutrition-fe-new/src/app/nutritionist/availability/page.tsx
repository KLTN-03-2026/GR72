'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, CalendarOff, Clock, Plus, Save, Trash2, AlertCircle } from 'lucide-react'
import { SectionHeader, Card, UserStatCard, UserButton, UserNotice, UserEmptyState, StatusBadge } from '@/components/user/user-ui'
import { expertDelete, expertGet, expertPost, expertPut } from '@/lib/expert-api'

type Row = Record<string, any>

const blankSlot = {
  thu_trong_tuan: 1,
  gio_bat_dau: '09:00:00',
  gio_ket_thuc: '17:00:00',
  thoi_luong_slot_phut: 45,
  trang_thai: 'hoat_dong',
}

const DAY_LABELS = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0',
  fontSize: 13.5, outline: 'none', width: '100%',
}

export default function AvailabilityPage() {
  const [weekly, setWeekly] = useState<Row[]>([])
  const [blocked, setBlocked] = useState<Row[]>([])
  const [slot, setSlot] = useState<Row>(blankSlot)
  const [block, setBlock] = useState<Row>({ bat_dau_luc: '', ket_thuc_luc: '', ly_do: '' })
  const [message, setMessage] = useState('')
  const [msgTone, setMsgTone] = useState<'success' | 'error' | 'info'>('info')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savingWeekly, setSavingWeekly] = useState(false)
  const [savingBlock, setSavingBlock] = useState(false)
  const [dirty, setDirty] = useState(false)

  async function load() {
    try {
      const data = await expertGet<{ weekly: Row[]; blocked: Row[] }>('/availability')
      setWeekly(data.weekly)
      setBlocked(data.blocked)
      setDirty(false)
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi tải lịch')
      setMsgTone('error')
    }
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => ({
    weekly: weekly.length,
    blocked: blocked.length,
    active: weekly.filter((row) => row.trang_thai === 'hoat_dong').length,
  }), [weekly, blocked])

  function addSlot() {
    const nextErrors: Record<string, string> = {}
    if (Number(slot.thoi_luong_slot_phut) < 15) nextErrors.slotDuration = 'Slot tối thiểu 15 phút.'
    if (String(slot.gio_bat_dau).slice(0, 5) >= String(slot.gio_ket_thuc).slice(0, 5)) {
      nextErrors.slotEnd = 'Giờ kết thúc phải sau giờ bắt đầu.'
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    setWeekly([...weekly, { ...slot, id: `new-${Date.now()}` }])
    setDirty(true)
  }

  async function saveWeekly() {
    setSavingWeekly(true)
    try {
      await expertPut('/availability/weekly', { slots: weekly })
      setMessage('✅ Đã lưu lịch làm việc.')
      setMsgTone('success')
      await load()
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi lưu')
      setMsgTone('error')
    } finally {
      setSavingWeekly(false)
    }
  }

  async function addBlock() {
    const nextErrors: Record<string, string> = {}
    if (!block.bat_dau_luc || !block.ket_thuc_luc) {
      nextErrors.blockTime = 'Vui lòng nhập đầy đủ thời gian.'
    } else if (block.bat_dau_luc >= block.ket_thuc_luc) {
      nextErrors.blockEnd = 'Thời gian kết thúc phải sau bắt đầu.'
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setSavingBlock(true)
    try {
      await expertPost('/availability/blocked-times', block)
      setMessage('✅ Đã thêm lịch bận.')
      setMsgTone('success')
      setErrors({})
      setBlock({ bat_dau_luc: '', ket_thuc_luc: '', ly_do: '' })
      await load()
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi thêm lịch bận')
      setMsgTone('error')
    } finally {
      setSavingBlock(false)
    }
  }

  async function removeBlock(id: number) {
    if (!confirm('Xoá lịch bận này?')) return
    try {
      await expertDelete(`/availability/blocked-times/${id}`)
      await load()
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi')
      setMsgTone('error')
    }
  }

  // Group weekly by day
  const weeklyByDay = useMemo(() => {
    const map: Record<number, Row[]> = {}
    weekly.forEach(s => {
      const d = Number(s.thu_trong_tuan)
      if (!map[d]) map[d] = []
      map[d].push(s)
    })
    return map
  }, [weekly])

  return (
    <>
      <SectionHeader
        title='Lịch làm việc'
        subtitle='Cấu hình khung giờ rảnh trong tuần và đánh dấu thời gian bận.'
      />

      {message && <UserNotice tone={msgTone}>{message}</UserNotice>}

      <div className='grid-stats'>
        <UserStatCard label='Khung lịch tuần' value={String(stats.weekly)} icon={Calendar} tone='blue' />
        <UserStatCard label='Đang hoạt động' value={String(stats.active)} icon={Clock} tone='green' />
        <UserStatCard label='Lịch bận riêng' value={String(stats.blocked)} icon={CalendarOff} tone='orange' />
      </div>

      {/* Weekly schedule */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>📅 Lịch làm việc theo tuần</h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
              Khách hàng chỉ có thể đặt lịch trong khung giờ này.
            </p>
          </div>
          {dirty && (
            <UserButton size='sm' onClick={saveWeekly} disabled={savingWeekly}>
              <Save size={14} /> {savingWeekly ? 'Đang lưu...' : 'Lưu thay đổi'}
            </UserButton>
          )}
        </div>

        {/* Add slot form */}
        <div style={{ padding: 14, background: '#fafafa', borderRadius: 12, border: '1px solid #f1f5f9', marginBottom: 14 }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#475569' }}>Thêm khung giờ mới</p>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', alignItems: 'flex-end' }}>
            <FormField label='Thứ'>
              <select style={inputStyle} value={slot.thu_trong_tuan} onChange={(e) => setSlot({ ...slot, thu_trong_tuan: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => <option key={day} value={day}>{DAY_LABELS[day]}</option>)}
              </select>
            </FormField>
            <FormField label='Bắt đầu'>
              <input type='time' style={inputStyle} value={String(slot.gio_bat_dau).slice(0, 5)} onChange={(e) => setSlot({ ...slot, gio_bat_dau: `${e.target.value}:00` })} />
            </FormField>
            <FormField label='Kết thúc' error={errors.slotEnd}>
              <input type='time' style={{ ...inputStyle, borderColor: errors.slotEnd ? '#fca5a5' : '#e2e8f0' }} value={String(slot.gio_ket_thuc).slice(0, 5)} onChange={(e) => { setSlot({ ...slot, gio_ket_thuc: `${e.target.value}:00` }); setErrors({}) }} />
            </FormField>
            <FormField label='Slot (phút)' error={errors.slotDuration}>
              <input type='number' min={15} style={{ ...inputStyle, borderColor: errors.slotDuration ? '#fca5a5' : '#e2e8f0' }} value={slot.thoi_luong_slot_phut} onChange={(e) => { setSlot({ ...slot, thoi_luong_slot_phut: Number(e.target.value) }); setErrors({}) }} />
            </FormField>
            <UserButton size='sm' variant='secondary' onClick={addSlot}>
              <Plus size={14} /> Thêm
            </UserButton>
          </div>
        </div>

        {/* Weekly list grouped by day */}
        {weekly.length === 0 ? (
          <UserEmptyState icon={Calendar} title='Chưa có lịch tuần' description='Thêm khung giờ ở trên để bắt đầu nhận booking.' />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const slots = weeklyByDay[day] ?? []
              if (slots.length === 0) return null
              return (
                <div key={day} style={{ padding: 12, background: '#fafafa', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{DAY_LABELS[day]}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {slots.map((row, idx) => {
                      const realIndex = weekly.findIndex(w => w === row)
                      return (
                        <div key={row.id ?? idx} style={{
                          padding: '8px 12px', background: 'white', borderRadius: 10, border: '1px solid #e0e7ff',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <Clock size={13} style={{ color: '#6366f1' }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                            {String(row.gio_bat_dau).slice(0, 5)} – {String(row.gio_ket_thuc).slice(0, 5)}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748b', padding: '2px 6px', background: '#eef2ff', borderRadius: 6 }}>
                            {row.thoi_luong_slot_phut}'
                          </span>
                          <button
                            onClick={() => { setWeekly(weekly.filter((_, i) => i !== realIndex)); setDirty(true) }}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', padding: 2 }}
                            aria-label='Xoá'
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Blocked times */}
      <Card>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>🚫 Lịch bận riêng</h2>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>
          Đánh dấu khoảng thời gian bạn không thể tư vấn (nghỉ phép, bận việc...).
        </p>

        <div style={{ padding: 14, background: '#fafafa', borderRadius: 12, border: '1px solid #f1f5f9', marginBottom: 14 }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'flex-end' }}>
            <FormField label='Bắt đầu' error={errors.blockTime}>
              <input
                type='datetime-local'
                style={{ ...inputStyle, borderColor: errors.blockTime ? '#fca5a5' : '#e2e8f0' }}
                value={block.bat_dau_luc}
                onChange={(e) => { setBlock({ ...block, bat_dau_luc: e.target.value }); setErrors({}) }}
              />
            </FormField>
            <FormField label='Kết thúc' error={errors.blockEnd}>
              <input
                type='datetime-local'
                style={{ ...inputStyle, borderColor: errors.blockEnd ? '#fca5a5' : '#e2e8f0' }}
                value={block.ket_thuc_luc}
                onChange={(e) => { setBlock({ ...block, ket_thuc_luc: e.target.value }); setErrors({}) }}
              />
            </FormField>
            <FormField label='Lý do (tuỳ chọn)'>
              <input
                style={inputStyle}
                value={block.ly_do}
                onChange={(e) => setBlock({ ...block, ly_do: e.target.value })}
                placeholder='Nghỉ phép, bận họp...'
              />
            </FormField>
            <UserButton size='sm' onClick={addBlock} disabled={savingBlock}>
              <Plus size={14} /> {savingBlock ? 'Đang thêm...' : 'Thêm lịch bận'}
            </UserButton>
          </div>
        </div>

        {blocked.length === 0 ? (
          <UserEmptyState icon={AlertCircle} title='Chưa có lịch bận' description='Bạn đang sẵn sàng nhận booking trong toàn bộ khung giờ trên.' />
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {blocked.map((row) => (
              <div key={row.id} style={{
                padding: 12, background: '#fff5f5', borderRadius: 10, border: '1px solid #fecaca',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#991b1b' }}>
                    {String(row.bat_dau_luc).slice(0, 16).replace('T', ' ')} → {String(row.ket_thuc_luc).slice(0, 16).replace('T', ' ')}
                  </p>
                  {row.ly_do && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7f1d1d' }}>{row.ly_do}</p>}
                </div>
                <UserButton size='sm' variant='danger' onClick={() => removeBlock(row.id)}>
                  <Trash2 size={12} /> Xoá
                </UserButton>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>{label}</label>
      {children}
      {error && <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 600 }}>{error}</p>}
    </div>
  )
}
