'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass } from '@/components/admin/admin-ui'
import { DataTable, Td, Th } from '@/components/admin/admin-table'
import { expertDelete, expertGet, expertPost, expertPut } from '@/lib/expert-api'

type Row = Record<string, any>

const blankSlot = {
  thu_trong_tuan: 1,
  gio_bat_dau: '09:00:00',
  gio_ket_thuc: '17:00:00',
  thoi_luong_slot_phut: 45,
  trang_thai: 'hoat_dong',
}

export default function AvailabilityPage() {
  const [weekly, setWeekly] = useState<Row[]>([])
  const [blocked, setBlocked] = useState<Row[]>([])
  const [slot, setSlot] = useState<Row>(blankSlot)
  const [block, setBlock] = useState<Row>({ bat_dau_luc: '', ket_thuc_luc: '', ly_do: '' })
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savingWeekly, setSavingWeekly] = useState(false)
  const [savingBlock, setSavingBlock] = useState(false)

  async function load() {
    const data = await expertGet<{ weekly: Row[]; blocked: Row[] }>('/availability')
    setWeekly(data.weekly)
    setBlocked(data.blocked)
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message))
  }, [])

  const stats = useMemo(() => ({
    weekly: weekly.length,
    blocked: blocked.length,
    active: weekly.filter((row) => row.trang_thai === 'hoat_dong').length,
  }), [weekly, blocked])

  function addSlot() {
    const nextErrors: Record<string, string> = {}
    if (Number(slot.thoi_luong_slot_phut) < 15) nextErrors.slotDuration = 'Slot tư vấn nên tối thiểu 15 phút.'
    if (String(slot.gio_bat_dau).slice(0, 5) >= String(slot.gio_ket_thuc).slice(0, 5)) {
      nextErrors.slotEnd = 'Giờ kết thúc phải sau giờ bắt đầu.'
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    setWeekly([...weekly, { ...slot, id: `new-${Date.now()}` }])
  }

  async function saveWeekly() {
    setSavingWeekly(true)
    try {
      await expertPut('/availability/weekly', { slots: weekly })
      setMessage('Đã lưu lịch làm việc.')
      await load()
    } finally {
      setSavingWeekly(false)
    }
  }

  async function addBlock() {
    const nextErrors: Record<string, string> = {}
    if (!block.bat_dau_luc || !block.ket_thuc_luc) {
      nextErrors.blockTime = 'Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc.'
    }
    if (block.bat_dau_luc >= block.ket_thuc_luc) {
      nextErrors.blockEnd = 'Thời gian kết thúc lịch bận phải sau thời gian bắt đầu.'
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setSavingBlock(true)
    try {
      await expertPost('/availability/blocked-times', block)
      setMessage('Đã thêm lịch bận.')
      setErrors({})
      setBlock({ bat_dau_luc: '', ket_thuc_luc: '', ly_do: '' })
      await load()
    } finally {
      setSavingBlock(false)
    }
  }

  async function removeBlock(id: number) {
    await expertDelete(`/availability/blocked-times/${id}`)
    await load()
  }

  return (
    <>
      <PageHeader
        eyebrow='Availability'
        title='Quản lý lịch làm việc'
        description='Cấu hình lịch rảnh theo tuần và các khung giờ bận để khách hàng chỉ có thể book slot hợp lệ.'
      />
      {message ? <Notice>{message}</Notice> : null}

      <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        <StatCard label='Khung lịch tuần' value={String(stats.weekly)} />
        <StatCard label='Đang hoạt động' value={String(stats.active)} tone='green' />
        <StatCard label='Lịch bận riêng' value={String(stats.blocked)} tone='orange' />
      </div>

      <div className='space-y-5'>
        <Panel title='Lịch làm việc theo tuần' description='Thêm slot vào bảng trước, sau đó bấm lưu để cập nhật toàn bộ lịch tuần.'>
          <Toolbar>
            <Field label='Thứ'>
              <select className={inputClass} value={slot.thu_trong_tuan} onChange={(e) => setSlot({ ...slot, thu_trong_tuan: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => <option key={day} value={day}>Thứ {day}</option>)}
              </select>
            </Field>
            <Field label='Bắt đầu'>
              <input type='time' className={inputClass} value={String(slot.gio_bat_dau).slice(0, 5)} onChange={(e) => setSlot({ ...slot, gio_bat_dau: `${e.target.value}:00` })} />
            </Field>
            <Field label='Kết thúc' error={errors.slotEnd}>
              <input type='time' className={inputClass} value={String(slot.gio_ket_thuc).slice(0, 5)} onChange={(e) => { setSlot({ ...slot, gio_ket_thuc: `${e.target.value}:00` }); setErrors({}) }} />
            </Field>
            <Field label='Slot/phút' error={errors.slotDuration}>
              <input type='number' min={15} className={inputClass} value={slot.thoi_luong_slot_phut} onChange={(e) => { setSlot({ ...slot, thoi_luong_slot_phut: Number(e.target.value) }); setErrors({}) }} />
            </Field>
            <div className='flex gap-2 lg:ml-auto'>
              <ActionButton tone='secondary' onClick={addSlot}>Thêm slot</ActionButton>
              <ActionButton onClick={saveWeekly} disabled={savingWeekly}>{savingWeekly ? 'Đang lưu...' : 'Lưu lịch tuần'}</ActionButton>
            </div>
          </Toolbar>
          <DataTable minWidth='860px'>
            <thead><tr><Th>Thứ</Th><Th>Giờ</Th><Th>Slot</Th><Th>Trạng thái</Th><Th className='text-right'>Hành động</Th></tr></thead>
            <tbody>
              {weekly.map((row, index) => (
                <tr key={row.id ?? index} className='transition-colors duration-200 hover:bg-emerald-50/60'>
                  <Td>Thứ {row.thu_trong_tuan}</Td>
                  <Td>{String(row.gio_bat_dau).slice(0, 5)} - {String(row.gio_ket_thuc).slice(0, 5)}</Td>
                  <Td>{row.thoi_luong_slot_phut} phút</Td>
                  <Td><StatusPill value={row.trang_thai} /></Td>
                  <Td className='text-right'><ActionButton tone='danger' onClick={() => setWeekly(weekly.filter((_, i) => i !== index))}>Xóa</ActionButton></Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {!weekly.length ? <div className='mt-4'><EmptyState text='Chưa có lịch tuần.' /></div> : null}
        </Panel>

        <Panel title='Ngày/giờ bận' description='Dùng khi bạn nghỉ phép, bận cá nhân hoặc không thể nhận lịch trong một khoảng thời gian cụ thể.'>
          <Toolbar>
            <Field label='Bắt đầu' error={errors.blockTime}>
              <input type='datetime-local' className={inputClass} value={block.bat_dau_luc} onChange={(e) => { setBlock({ ...block, bat_dau_luc: e.target.value }); setErrors({}) }} />
            </Field>
            <Field label='Kết thúc' error={errors.blockEnd}>
              <input type='datetime-local' className={inputClass} value={block.ket_thuc_luc} onChange={(e) => { setBlock({ ...block, ket_thuc_luc: e.target.value }); setErrors({}) }} />
            </Field>
            <Field label='Lý do'>
              <input className={inputClass} value={block.ly_do} onChange={(e) => setBlock({ ...block, ly_do: e.target.value })} />
            </Field>
            <ActionButton onClick={addBlock} disabled={savingBlock}>{savingBlock ? 'Đang thêm...' : 'Thêm lịch bận'}</ActionButton>
          </Toolbar>
          <DataTable minWidth='860px'>
            <thead><tr><Th>Bắt đầu</Th><Th>Kết thúc</Th><Th>Lý do</Th><Th className='text-right'>Hành động</Th></tr></thead>
            <tbody>
              {blocked.map((row) => (
                <tr key={row.id} className='transition-colors duration-200 hover:bg-emerald-50/60'>
                  <Td>{String(row.bat_dau_luc).slice(0, 16)}</Td>
                  <Td>{String(row.ket_thuc_luc).slice(0, 16)}</Td>
                  <Td>{row.ly_do ?? '-'}</Td>
                  <Td className='text-right'><ActionButton tone='danger' onClick={() => removeBlock(row.id)}>Xóa</ActionButton></Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {!blocked.length ? <div className='mt-4'><EmptyState text='Chưa có lịch bận riêng.' /></div> : null}
        </Panel>
      </div>
    </>
  )
}
