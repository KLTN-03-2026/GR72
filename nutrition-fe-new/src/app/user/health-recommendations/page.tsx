'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw, CheckCircle, Archive, AlertTriangle, ChevronDown, ChevronUp,
  Target, Dumbbell, Utensils, Moon, Brain, Stethoscope, Flame, Clock,
} from 'lucide-react'
import { SectionHeader, UserButton, UserNotice, UserEmptyState } from '@/components/user/user-ui'
import { customerGet, customerPatch, customerPost } from '@/lib/customer-api'

type Row = Record<string, any>

const GROUP_CFG: Record<string, { label: string; Icon: any; color: string; light: string }> = {
  muc_tieu:   { label: 'Mục tiêu',      Icon: Target,      color: '#6366f1', light: '#eef2ff' },
  van_dong:   { label: 'Vận động',      Icon: Dumbbell,    color: '#0ea5e9', light: '#f0f9ff' },
  dinh_duong: { label: 'Dinh dưỡng',    Icon: Utensils,    color: '#10b981', light: '#ecfdf5' },
  giac_ngu:   { label: 'Giấc ngủ',      Icon: Moon,        color: '#8b5cf6', light: '#f5f3ff' },
  cang_thang: { label: 'Tinh thần',     Icon: Brain,       color: '#ec4899', light: '#fdf2f8' },
  thoi_quen:  { label: 'Thói quen',     Icon: Clock,       color: '#f59e0b', light: '#fffbeb' },
  can_thiep:  { label: 'Cần chú ý',     Icon: Stethoscope, color: '#ef4444', light: '#fef2f2' },
  default:    { label: 'Khác',          Icon: Flame,       color: '#64748b', light: '#f8fafc' },
}

const PRIORITY: Record<string, { dot: string; label: string }> = {
  cao:       { dot: '#ef4444', label: 'Quan trọng' },
  trung_binh:{ dot: '#f59e0b', label: 'Nên làm' },
  thap:      { dot: '#10b981', label: 'Khuyến khích' },
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  moi_tao:    { label: 'Mới tạo',   color: '#d97706', bg: '#fffbeb' },
  da_ap_dung: { label: 'Đang dùng', color: '#059669', bg: '#ecfdf5' },
  luu_tru:    { label: 'Lưu trữ',   color: '#94a3b8', bg: '#f1f5f9' },
}

function fmtDate(iso: string) {
  return iso ? new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'medium' }) : '—'
}

export default function HealthRecommendationsPage() {
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
        customerGet<Row>('/health-recommendations/latest'),
        customerGet<Row[]>('/health-recommendations'),
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
      await customerPost('/health-recommendations/generate', {})
      notify('Đã tạo kế hoạch mới theo dữ liệu sức khỏe hiện tại.')
      await load()
    } catch (e: any) { notify(e.message, 'error') }
    finally { setGenerating(false) }
  }

  async function handleApply(id: number) {
    setApplying(true)
    try {
      await customerPatch(`/health-recommendations/${id}/apply`, {})
      notify('Đã chọn làm kế hoạch đang áp dụng.')
      await load()
    } catch (e: any) { notify(e.message, 'error') }
    finally { setApplying(false) }
  }

  async function handleArchive(id: number) {
    try {
      await customerPatch(`/health-recommendations/${id}/archive`, {})
      await load()
    } catch (e: any) { notify(e.message, 'error') }
  }

  const active  = list.find((r) => r.trang_thai === 'da_ap_dung') ?? (latest?.trang_thai === 'da_ap_dung' ? latest : null)
  const history = list.filter((r) => r.trang_thai !== 'moi_tao' && (!active || Number(r.id) !== Number(active.id))).slice(0, 6)
  const actions: Row[] = Array.isArray(latest?.noi_dung_goi_y) ? latest.noi_dung_goi_y : []

  // Sort: cao first
  const sorted = [...actions].sort((a, b) => {
    const ord: Record<string, number> = { cao: 0, trung_binh: 1, thap: 2 }
    return (ord[a.muc_do] ?? 1) - (ord[b.muc_do] ?? 1)
  })

  if (loading) return (
    <div className='flex h-64 items-center justify-center'>
      <RefreshCw size={24} className='animate-spin text-slate-300' />
    </div>
  )

  return (
    <div className='space-y-5'>
      <SectionHeader
        title='Kế hoạch sức khỏe'
        subtitle='Gợi ý hành động cụ thể dựa trên hồ sơ và chỉ số của bạn'
        action={
          <UserButton size='sm' onClick={handleGenerate} disabled={generating}>
            <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Đang tạo...' : 'Tạo kế hoạch mới'}
          </UserButton>
        }
      />

      {msg && <UserNotice tone={msgTone}>{msg}</UserNotice>}

      {/* Profile incomplete warning */}
      {!dataReady && (
        <div className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4'>
          <AlertTriangle size={16} className='mt-0.5 shrink-0 text-amber-500' />
          <p className='text-sm text-amber-800'>
            Kế hoạch sẽ chính xác hơn khi hồ sơ đầy đủ.
            {missing.length > 0 && <> Còn thiếu: <strong>{missing.join(', ')}</strong>.</>}
            {' '}<Link href='/user/health-profile' className='font-semibold underline'>Cập nhật ngay →</Link>
          </p>
        </div>
      )}

      {/* Active plan banner */}
      {active && (
        <div className='flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3'>
          <CheckCircle size={16} className='shrink-0 text-emerald-600' />
          <p className='text-sm text-emerald-800'>
            <strong>Đang áp dụng:</strong> kế hoạch tạo ngày {fmtDate(active.tao_luc)}
          </p>
        </div>
      )}

      {/* Main plan */}
      {latest ? (
        <>
          {/* Warnings */}
          {Array.isArray(latest.canh_bao) && latest.canh_bao.length > 0 && (
            <div className='rounded-2xl border border-red-100 bg-red-50 p-4'>
              <p className='mb-1.5 text-sm font-semibold text-red-700'>Lưu ý về sức khỏe của bạn</p>
              {latest.canh_bao.map((w: string, i: number) => (
                <p key={i} className='text-sm text-red-600'>• {w}</p>
              ))}
            </div>
          )}

          {/* Action list */}
          <div className='overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm'>
            <div className='border-b border-slate-100 px-5 py-4'>
              <p className='text-sm font-semibold text-slate-800'>Các hành động khuyến nghị</p>
              <p className='mt-0.5 text-xs text-slate-400'>
                {fmtDate(latest.tao_luc)} · {actions.length} hành động
              </p>
            </div>

            <div className='divide-y divide-slate-50'>
              {sorted.map((action, i) => {
                const cfg = GROUP_CFG[action.nhom] ?? GROUP_CFG.default
                const prio = PRIORITY[action.muc_do]
                return (
                  <div key={i} className='flex items-start gap-4 px-5 py-4'>
                    {/* Group icon */}
                    <div
                      className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl'
                      style={{ background: cfg.light }}
                    >
                      <cfg.Icon size={16} style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-semibold text-slate-800'>{action.hanh_dong}</p>
                      <p className='mt-0.5 text-xs text-slate-500'>{action.ly_do}</p>
                      <div className='mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400'>
                        {action.tan_suat && <span>{action.tan_suat}</span>}
                        {action.tan_suat && action.ket_qua_ky_vong && <span>·</span>}
                        {action.ket_qua_ky_vong && <span>Kỳ vọng: {action.ket_qua_ky_vong}</span>}
                      </div>
                    </div>

                    {/* Priority dot */}
                    {prio && (
                      <div className='flex shrink-0 items-center gap-1.5 text-xs text-slate-400'>
                        <span className='size-2 rounded-full' style={{ background: prio.dot }} />
                        {prio.label}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* CTA */}
            {latest.trang_thai === 'moi_tao' && (
              <div className='flex gap-2 border-t border-slate-100 px-5 py-4'>
                <UserButton onClick={() => handleApply(latest.id)} disabled={applying}>
                  <CheckCircle size={14} />
                  {applying ? 'Đang áp dụng...' : 'Dùng kế hoạch này'}
                </UserButton>
                <UserButton variant='secondary' onClick={() => handleArchive(latest.id)}>
                  <Archive size={14} /> Để sau
                </UserButton>
              </div>
            )}
          </div>
        </>
      ) : (
        <UserEmptyState
          icon={Target}
          title='Chưa có kế hoạch sức khỏe'
          description='Bấm "Tạo kế hoạch mới" để hệ thống phân tích dữ liệu và đưa ra gợi ý phù hợp với bạn'
          action={
            <UserButton onClick={handleGenerate} disabled={generating}>
              <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Đang tạo...' : 'Tạo kế hoạch ngay'}
            </UserButton>
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
                      <p className='text-sm text-slate-700'>{fmtDate(r.tao_luc)}</p>
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
