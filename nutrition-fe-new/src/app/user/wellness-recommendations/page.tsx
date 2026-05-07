'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw, CheckCircle, MessageSquare, AlertTriangle,
  ChevronDown, ChevronUp, Flame, Utensils, Dumbbell, XCircle,
} from 'lucide-react'
import { SectionHeader, UserButton, UserNotice, UserEmptyState } from '@/components/user/user-ui'
import { customerGet, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  moi_tao:    { label: 'Mới tạo',   color: '#d97706', bg: '#fffbeb' },
  da_ap_dung: { label: 'Đang dùng', color: '#059669', bg: '#ecfdf5' },
  luu_tru:    { label: 'Lưu trữ',   color: '#94a3b8', bg: '#f1f5f9' },
}

const INTENSITY: Record<string, { color: string; label: string }> = {
  cao:       { color: '#ef4444', label: 'Cường độ cao' },
  trung_binh:{ color: '#f59e0b', label: 'Cường độ vừa' },
  thap:      { color: '#10b981', label: 'Cường độ nhẹ' },
}

function fmtDate(iso: string) {
  return iso ? new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'medium' }) : '—'
}

function normalizeList(value: unknown): Row[] {
  if (Array.isArray(value)) return value.filter((i) => i && typeof i === 'object') as Row[]
  if (typeof value === 'string') {
    try { const p = JSON.parse(value.trim()); return Array.isArray(p) ? p : [] } catch { return [] }
  }
  return []
}

export default function WellnessRecommendationsPage() {
  const [latest, setLatest]         = useState<Row | null>(null)
  const [list, setList]             = useState<Row[]>([])
  const [dataReady, setDataReady]   = useState(true)
  const [missing, setMissing]       = useState<string[]>([])
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [applying, setApplying]     = useState(false)
  const [msg, setMsg]               = useState('')
  const [msgTone, setMsgTone]       = useState<'success' | 'error' | 'warning'>('success')
  const [historyOpen, setHistoryOpen] = useState(false)

  function notify(text: string, tone: 'success' | 'error' | 'warning' = 'success') {
    setMsg(text); setMsgTone(tone)
  }

  async function load() {
    setLoading(true)
    try {
      const [payload, all] = await Promise.all([
        customerGet<Row>('/wellness-recommendations/latest'),
        customerGet<Row[]>('/wellness-recommendations'),
      ])
      setDataReady(Boolean(payload?.data_ready))
      setMissing(payload?.completion?.missing ?? [])
      setLatest(payload?.recommendation ?? null)
      setList(all)
    } catch (e: any) { notify(e.message, 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleGenerate() {
    setGenerating(true)
    try {
      await customerPost('/wellness-recommendations/generate', {})
      notify('Đã tạo kế hoạch dinh dưỡng & tập luyện mới.')
      await load()
    } catch (e: any) { notify(e.message, 'error') }
    finally { setGenerating(false) }
  }

  async function handleApply(id: number) {
    setApplying(true)
    try {
      await customerPost(`/wellness-recommendations/${id}/apply`, {})
      notify('Đã chọn làm kế hoạch đang áp dụng.')
      await load()
    } catch (e: any) { notify(e.message, 'error') }
    finally { setApplying(false) }
  }

  async function handleAskExpert(id: number) {
    try {
      const res = await customerPost<Row>(`/wellness-recommendations/${id}/ask-expert`, {})
      if (res.has_active_package) {
        window.location.href = `/user/experts?packagePurchaseId=${res.package_purchase_id}`
      } else {
        notify('Bạn cần mua gói dịch vụ để đặt lịch tư vấn chuyên gia.', 'warning')
      }
    } catch (e: any) { notify(e.message, 'error') }
  }

  const active  = list.find((r) => r.trang_thai === 'da_ap_dung') ?? (latest?.trang_thai === 'da_ap_dung' ? latest : null)
  const history = list.filter((r) => r.trang_thai !== 'moi_tao' && (!active || Number(r.id) !== Number(active.id))).slice(0, 6)

  const nutrition  = normalizeList(latest?.goi_y_dinh_duong)
  const exercise   = normalizeList(latest?.goi_y_tap_luyen)
  const eatList    = nutrition.filter((n) => n.loai === 'uu_tien')
  const limitList  = nutrition.filter((n) => n.loai === 'han_che')
  const avoidList  = nutrition.filter((n) => n.loai === 'tranh')

  if (loading) return (
    <div className='flex h-64 items-center justify-center'>
      <RefreshCw size={24} className='animate-spin text-slate-300' />
    </div>
  )

  return (
    <div className='space-y-5'>
      <SectionHeader
        title='Dinh dưỡng & Tập luyện'
        subtitle='Kế hoạch cá nhân hoá từ chỉ số cơ thể và mục tiêu sức khỏe của bạn'
        action={
          <UserButton size='sm' onClick={handleGenerate} disabled={generating}>
            <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Đang tạo...' : 'Tạo kế hoạch mới'}
          </UserButton>
        }
      />

      {msg && <UserNotice tone={msgTone}>{msg}</UserNotice>}

      {/* Profile incomplete */}
      {!dataReady && (
        <div className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4'>
          <AlertTriangle size={16} className='mt-0.5 shrink-0 text-amber-500' />
          <p className='text-sm text-amber-800'>
            Cần chiều cao và cân nặng để tính TDEE chính xác.
            {missing.length > 0 && <> Còn thiếu: <strong>{missing.join(', ')}</strong>.</>}
            {' '}<Link href='/user/health-profile' className='font-semibold underline'>Cập nhật →</Link>
          </p>
        </div>
      )}

      {/* Active plan banner */}
      {active && (
        <div className='flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3'>
          <CheckCircle size={16} className='shrink-0 text-emerald-600' />
          <p className='text-sm text-emerald-800'>
            <strong>Đang áp dụng:</strong> kế hoạch {active.muc_tieu_calories ? `${active.muc_tieu_calories} kcal/ngày` : ''} — {fmtDate(active.tao_luc)}
          </p>
        </div>
      )}

      {latest ? (
        <>
          {/* Calorie + Macro targets */}
          <div className='overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm'>
            <div className='flex items-center gap-4 px-6 py-5'>
              {/* Calorie target - main number */}
              <div className='flex items-center gap-3'>
                <div className='flex size-12 items-center justify-center rounded-2xl bg-orange-50'>
                  <Flame size={22} className='text-orange-500' />
                </div>
                <div>
                  <p className='text-xs text-slate-400'>Mục tiêu mỗi ngày</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {latest.muc_tieu_calories ?? '—'}
                    <span className='ml-1 text-sm font-normal text-slate-400'>kcal</span>
                  </p>
                </div>
              </div>

              {/* Macro divider */}
              <div className='mx-4 hidden h-12 w-px bg-slate-100 sm:block' />

              {/* Macros */}
              <div className='hidden grid-cols-3 gap-6 sm:grid'>
                <MacroItem label='Protein' value={latest.muc_tieu_protein_g} unit='g' color='text-blue-600' />
                <MacroItem label='Carb'    value={latest.muc_tieu_carb_g}    unit='g' color='text-amber-600' />
                <MacroItem label='Fat'     value={latest.muc_tieu_fat_g}     unit='g' color='text-violet-600' />
              </div>
            </div>

            {/* Macro on mobile */}
            <div className='grid grid-cols-3 gap-0 border-t border-slate-100 sm:hidden'>
              <MobileMacro label='Protein' value={latest.muc_tieu_protein_g} unit='g' />
              <MobileMacro label='Carb'    value={latest.muc_tieu_carb_g}    unit='g' border />
              <MobileMacro label='Fat'     value={latest.muc_tieu_fat_g}     unit='g' border />
            </div>

            {/* Calculation note */}
            {latest.input_snapshot?.calculated && (
              <div className='border-t border-slate-50 px-5 py-3 text-xs text-slate-400'>
                BMR {latest.input_snapshot.calculated.bmr} → TDEE {latest.input_snapshot.calculated.tdee} kcal/ngày
                {latest.input_snapshot.calculated.bmi ? ` · BMI ${latest.input_snapshot.calculated.bmi}` : ''}
              </div>
            )}
          </div>

          {/* Warnings */}
          {Array.isArray(latest.canh_bao) && latest.canh_bao.length > 0 && (
            <div className='rounded-2xl border border-amber-100 bg-amber-50 p-4'>
              <p className='mb-1.5 text-sm font-semibold text-amber-700'>Lưu ý</p>
              {latest.canh_bao.map((w: string, i: number) => (
                <p key={i} className='text-sm text-amber-700'>• {w}</p>
              ))}
            </div>
          )}

          {/* Nutrition section */}
          {nutrition.length > 0 && (
            <div className='overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm'>
              <div className='flex items-center gap-2 border-b border-slate-100 px-5 py-4'>
                <Utensils size={16} className='text-emerald-600' />
                <h3 className='text-sm font-semibold text-slate-800'>Chế độ ăn</h3>
              </div>

              <div className='divide-y divide-slate-50 p-5'>
                {/* Nên ăn */}
                {eatList.length > 0 && (
                  <FoodSection
                    title='Nên ăn'
                    dotColor='#10b981'
                    items={eatList}
                  />
                )}

                {/* Hạn chế */}
                {limitList.length > 0 && (
                  <FoodSection
                    title='Hạn chế'
                    dotColor='#f59e0b'
                    items={limitList}
                  />
                )}

                {/* Tránh */}
                {avoidList.length > 0 && (
                  <div className={eatList.length + limitList.length > 0 ? 'pt-4' : ''}>
                    <div className='mb-3 flex items-center gap-2'>
                      <XCircle size={14} className='text-red-500' />
                      <p className='text-xs font-semibold uppercase tracking-wide text-red-500'>Nên tránh</p>
                    </div>
                    <div className='space-y-2'>
                      {avoidList.map((item, i) => (
                        <div key={i} className='rounded-xl border border-red-100 bg-red-50 px-4 py-3'>
                          <p className='text-sm font-medium text-red-700'>{item.goi_y}</p>
                          {item.ly_do && <p className='mt-0.5 text-xs text-red-500'>{item.ly_do}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exercise section */}
          {exercise.length > 0 && (
            <div className='overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm'>
              <div className='flex items-center gap-2 border-b border-slate-100 px-5 py-4'>
                <Dumbbell size={16} className='text-indigo-600' />
                <h3 className='text-sm font-semibold text-slate-800'>Lịch tập luyện</h3>
              </div>
              <div className='divide-y divide-slate-50'>
                {exercise.map((item, i) => {
                  const intensity = INTENSITY[item.muc_do] ?? INTENSITY.trung_binh
                  return (
                    <div key={i} className='flex items-start gap-4 px-5 py-4'>
                      <div className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50'>
                        <Dumbbell size={15} className='text-indigo-500' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-semibold text-slate-800'>{item.goi_y}</p>
                        {item.ly_do && <p className='mt-0.5 text-xs text-slate-500'>{item.ly_do}</p>}
                        <div className='mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400'>
                          {item.tan_suat && <span>{item.tan_suat}</span>}
                          {item.thoi_luong && <><span>·</span><span>{item.thoi_luong}</span></>}
                        </div>
                      </div>
                      {item.muc_do && (
                        <span
                          className='shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold'
                          style={{ color: intensity.color, background: intensity.color + '18' }}
                        >
                          {intensity.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          {latest.trang_thai === 'moi_tao' && (
            <div className='flex flex-wrap gap-3'>
              <UserButton onClick={() => handleApply(latest.id)} disabled={applying}>
                <CheckCircle size={14} />
                {applying ? 'Đang áp dụng...' : 'Dùng kế hoạch này'}
              </UserButton>
              <UserButton variant='secondary' onClick={() => handleAskExpert(latest.id)}>
                <MessageSquare size={14} /> Trao đổi với chuyên gia
              </UserButton>
            </div>
          )}
        </>
      ) : (
        <UserEmptyState
          icon={Utensils}
          title='Chưa có kế hoạch dinh dưỡng'
          description='Hệ thống sẽ tính TDEE và tạo kế hoạch ăn uống + tập luyện phù hợp sau khi bạn có đủ dữ liệu'
          action={
            <div className='flex gap-2'>
              <UserButton onClick={handleGenerate} disabled={generating}>
                <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Đang tạo...' : 'Tạo kế hoạch ngay'}
              </UserButton>
              <Link href='/user/health-profile'>
                <UserButton variant='secondary'>Cập nhật hồ sơ</UserButton>
              </Link>
            </div>
          }
        />
      )}

      {/* History */}
      {history.length > 0 && (
        <div className='overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm'>
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className='flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50'
          >
            Lịch sử kế hoạch ({history.length})
            {historyOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {historyOpen && (
            <div className='divide-y divide-slate-50 border-t border-slate-100'>
              {history.map((r) => {
                const st = STATUS_CFG[r.trang_thai] ?? STATUS_CFG.luu_tru
                return (
                  <div key={r.id} className='flex items-center justify-between px-5 py-3'>
                    <div>
                      <p className='text-sm text-slate-700'>
                        {fmtDate(r.tao_luc)}
                        {r.muc_tieu_calories ? ` — ${r.muc_tieu_calories} kcal/ngày` : ''}
                      </p>
                      {r.ly_do && <p className='mt-0.5 text-xs text-slate-400'>{r.ly_do}</p>}
                    </div>
                    <span
                      className='rounded-full px-2.5 py-0.5 text-xs font-semibold'
                      style={{ color: st.color, background: st.bg }}
                    >
                      {st.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* Sub-components */

function MacroItem({ label, value, unit, color }: { label: string; value: any; unit: string; color: string }) {
  return (
    <div>
      <p className='text-xs text-slate-400'>{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {value ?? '—'}<span className='ml-0.5 text-xs font-normal text-slate-400'>{unit}</span>
      </p>
    </div>
  )
}

function MobileMacro({ label, value, unit, border }: { label: string; value: any; unit: string; border?: boolean }) {
  return (
    <div className={`px-4 py-3 text-center ${border ? 'border-l border-slate-100' : ''}`}>
      <p className='text-xs text-slate-400'>{label}</p>
      <p className='text-base font-bold text-slate-800'>{value ?? '—'}<span className='text-xs font-normal text-slate-400'> {unit}</span></p>
    </div>
  )
}

function FoodSection({ title, dotColor, items }: { title: string; dotColor: string; items: Row[] }) {
  return (
    <div className='pb-4'>
      <div className='mb-3 flex items-center gap-2'>
        <span className='size-2.5 rounded-full' style={{ background: dotColor }} />
        <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{title}</p>
      </div>
      <div className='space-y-3'>
        {items.map((item, i) => (
          <div key={i}>
            <div className='flex items-start justify-between gap-2'>
              <p className='text-sm font-medium text-slate-800'>{item.goi_y}</p>
              {item.tan_suat && <span className='shrink-0 text-xs text-slate-400'>{item.tan_suat}</span>}
            </div>
            {item.ly_do && <p className='mt-0.5 text-xs text-slate-500'>{item.ly_do}</p>}
            {item.thay_the_goi_y && (
              <p className='mt-0.5 text-xs text-slate-400'>Thay thế: {item.thay_the_goi_y}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
