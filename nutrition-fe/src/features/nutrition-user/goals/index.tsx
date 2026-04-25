'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertCircle,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Circle,
  Eye,
  Flag,
  Info,
  Loader2,
  Pencil,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Minus,
  Scale,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  type GoalApiResponse,
} from '@/services/goals/api'
import { getUserProfile, type ProfileApiResponse } from '@/services/profile/api'

// ============================================
// Types
// ============================================
type GoalType = 'giam_can' | 'tang_can' | 'giu_can'

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  giam_can: 'Giảm cân',
  tang_can: 'Tăng cân',
  giu_can: 'Duy trì',
}

const STATUS_LABELS: Record<string, string> = {
  dang_ap_dung: 'Đang áp dụng',
  luu_tru: 'Lưu trữ',
  hoan_thanh: 'Hoàn thành',
}

type ActivityKey = 'it_van_dong' | 'van_dong_nhe' | 'van_dong_vua' | 'nang_dong' | 'rat_nang_dong'

const ACTIVITY_MULTIPLIER: Record<ActivityKey, number> = {
  it_van_dong: 1.2,
  van_dong_nhe: 1.375,
  van_dong_vua: 1.55,
  nang_dong: 1.725,
  rat_nang_dong: 1.9,
}

type GenderKey = 'nam' | 'nu' | 'khac'

// ============================================
// Form data shape
// ============================================
type FormData = {
  loaiMucTieu: GoalType
  canNangBatDauKg: string
  canNangMucTieuKg: string
  mucTieuCaloriesNgay: string
  mucTieuProteinG: string
  mucTieuCarbG: string
  mucTieuFatG: string
  ngayBatDau: string
  ngayMucTieu: string
}

// ============================================
// Helpers
// ============================================
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00')
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(dateStr))
}

// ============================================
// Smart goal selector — which goal is active TODAY
// ============================================
function getEffectiveGoal(goals: GoalApiResponse[]): GoalApiResponse | null {
  if (goals.length === 0) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Find a goal where today falls within [ngay_bat_dau, ngay_muc_tieu]
  for (const goal of goals) {
    const start = toDate(goal.ngay_bat_dau)
    const end = toDate(goal.ngay_muc_tieu)
    if (!start || !end) continue
    if (today >= start && today <= end) {
      return { ...goal, effectiveStatus: 'active' as const }
    }
  }

  // No active goal found — find the most recent expired one (last to end)
  const sorted = [...goals].sort((a, b) => {
    const aEnd = toDate(a.ngay_muc_tieu)?.getTime() ?? 0
    const bEnd = toDate(b.ngay_muc_tieu)?.getTime() ?? 0
    return bEnd - aEnd
  })
  return sorted.length > 0 ? { ...sorted[0], effectiveStatus: 'expired' as const } : null
}

// ============================================
// TDEE / Macro calculation (Mifflin-St Jeor)
// ============================================
function calcAge(ngaySinh: string | null): number | null {
  if (!ngaySinh) return null
  const ms = Date.now() - new Date(ngaySinh).getTime()
  return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000))
}

function calcBMR(weightKg: number, heightCm: number, age: number | null, gender: GenderKey | null) {
  if (!age || !gender || gender === 'khac') return 10 * weightKg + 6.25 * heightCm - 5 * age!
  if (gender === 'nam') return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
}

function calcMacroSuggestion(goalType: GoalType, targetWeight: number, tdee: number) {
  let proteinPct: number, carbPct: number, fatPct: number
  if (goalType === 'giam_can') { proteinPct = 0.40; carbPct = 0.30; fatPct = 0.30 }
  else if (goalType === 'tang_can') { proteinPct = 0.30; carbPct = 0.45; fatPct = 0.25 }
  else { proteinPct = 0.30; carbPct = 0.40; fatPct = 0.30 }

  return {
    calories: Math.round(tdee),
    protein: Math.round((tdee * proteinPct / 4) * 10) / 10,
    carb: Math.round((tdee * carbPct / 4) * 10) / 10,
    fat: Math.round((tdee * fatPct / 9) * 10) / 10,
  }
}

// ============================================
// Validation
// ============================================
type ValidationErrors = Partial<Record<keyof FormData, string>>

function validate(form: FormData): ValidationErrors {
  const errs: ValidationErrors = {}
  const start = Number(form.canNangBatDauKg)
  const target = Number(form.canNangMucTieuKg)
  const cal = Number(form.mucTieuCaloriesNgay)
  const protein = Number(form.mucTieuProteinG)
  const carb = Number(form.mucTieuCarbG)
  const fat = Number(form.mucTieuFatG)

  if (!form.canNangBatDauKg || start <= 0) {
    errs.canNangBatDauKg = 'Cân nặng bắt đầu phải > 0'
  } else if (start > 300) {
    errs.canNangBatDauKg = 'Không hợp lý (> 300 kg)'
  }

  if (!form.canNangMucTieuKg || target <= 0) {
    errs.canNangMucTieuKg = 'Cân nặng mục tiêu phải > 0'
  } else {
    if (form.loaiMucTieu === 'giam_can' && target >= start) {
      errs.canNangMucTieuKg = 'Cân mục tiêu phải THẤP HƠN cân bắt đầu khi giảm cân'
    } else if (form.loaiMucTieu === 'tang_can' && target <= start) {
      errs.canNangMucTieuKg = 'Cân mục tiêu phải CAO HƠN cân bắt đầu khi tăng cân'
    } else if (form.loaiMucTieu === 'giu_can' && Math.abs(target - start) > 3) {
      errs.canNangMucTieuKg = 'Duy trì: chênh lệch không nên quá 3 kg'
    }
  }

  if (!form.ngayBatDau) errs.ngayBatDau = 'Chưa chọn ngày bắt đầu'
  if (!form.ngayMucTieu) {
    errs.ngayMucTieu = 'Chưa chọn ngày dự kiến đạt mục tiêu'
  } else if (form.ngayBatDau && form.ngayMucTieu < form.ngayBatDau) {
    errs.ngayMucTieu = 'Ngày mục tiêu phải sau ngày bắt đầu'
  }

  if (form.mucTieuCaloriesNgay && (cal < 800 || cal > 5000)) {
    errs.mucTieuCaloriesNgay = 'Nên trong khoảng 800 – 5.000 kcal'
  }

  const macroCal = protein * 4 + carb * 4 + fat * 9
  if (cal > 0 && macroCal > cal * 1.1) {
    errs.mucTieuCaloriesNgay = 'Tổng macro vượt calories. Kiểm tra lại.'
  }

  return errs
}

// ============================================
// Map API goal → form
// ============================================
function mapApiToForm(goal: GoalApiResponse | null): FormData {
  if (!goal) {
    return {
      loaiMucTieu: 'giam_can',
      canNangBatDauKg: '',
      canNangMucTieuKg: '',
      mucTieuCaloriesNgay: '',
      mucTieuProteinG: '',
      mucTieuCarbG: '',
      mucTieuFatG: '',
      ngayBatDau: toISODate(new Date()),
      ngayMucTieu: '',
    }
  }
  return {
    loaiMucTieu: goal.loai_muc_tieu,
    canNangBatDauKg: goal.can_nang_bat_dau_kg != null ? String(goal.can_nang_bat_dau_kg) : '',
    canNangMucTieuKg: goal.can_nang_muc_tieu_kg != null ? String(goal.can_nang_muc_tieu_kg) : '',
    mucTieuCaloriesNgay: goal.muc_tieu_calories_ngay != null ? String(goal.muc_tieu_calories_ngay) : '',
    mucTieuProteinG: goal.muc_tieu_protein_g != null ? String(goal.muc_tieu_protein_g) : '',
    mucTieuCarbG: goal.muc_tieu_carb_g != null ? String(goal.muc_tieu_carb_g) : '',
    mucTieuFatG: goal.muc_tieu_fat_g != null ? String(goal.muc_tieu_fat_g) : '',
    ngayBatDau: goal.ngay_bat_dau ?? toISODate(new Date()),
    ngayMucTieu: goal.ngay_muc_tieu ?? '',
  }
}

// ============================================
// Sub-components
// ============================================
function GoalTypeBtn({ goalType, active, onClick }: { goalType: GoalType; active: boolean; onClick: () => void }) {
  const configs = {
    giam_can: { label: 'Giảm cân', Icon: TrendingDown, cls: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40', activeCls: 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:text-white' },
    tang_can: { label: 'Tăng cân', Icon: TrendingUp, cls: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40', activeCls: 'bg-orange-600 text-white border-orange-600 dark:bg-orange-500 dark:text-white' },
    giu_can: { label: 'Duy trì', Icon: Minus, cls: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40', activeCls: 'bg-green-600 text-white border-green-600 dark:bg-green-500 dark:text-white' },
  }
  const cfg = configs[goalType]
  return (
    <button type='button' onClick={onClick} className={cn(
      'flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all',
      active ? cfg.activeCls : cfg.cls,
    )}>
      <cfg.Icon className='size-5' />
      {cfg.label}
    </button>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className='mt-1 flex items-center gap-1 text-xs text-red-500'>
      <AlertCircle className='size-3 shrink-0' />
      {message}
    </div>
  )
}

function FieldWarn({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className='mt-1 flex items-center gap-1 text-xs text-amber-500'>
      <Info className='size-3 shrink-0' />
      {message}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Đang áp dụng': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300',
    'Lưu trữ': 'bg-neutral-200 text-neutral-600 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400',
    'Hoàn thành': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300',
    'Đã hết hạn': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300',
  }
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
      map[status] ?? 'bg-muted text-muted-foreground border-transparent',
    )}>
      {status}
    </span>
  )
}

const GoalTimeline = ({ startDate, endDate, compact = false, now }: {
  startDate: string | null
  endDate: string | null
  compact?: boolean
  now: number
}) => {
  if (!startDate || !endDate) return null

  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  if (now < start) return null

  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  const daysPassed = Math.ceil((Math.min(now, end) - start) / (1000 * 60 * 60 * 24))
  const pct = Math.min((daysPassed / totalDays) * 100, 100)
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))

  if (compact) {
    return (
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <span>{formatDate(startDate)}</span>
        <div className='relative h-1.5 flex-1 rounded-full bg-muted'>
          <div
            className={cn('absolute left-0 top-0 h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={cn(daysLeft <= 7 ? 'text-amber-600 font-medium' : '')}>
          {daysLeft > 0 ? `${daysLeft}ng` : 'Hết hạn'}
        </span>
        <span>{formatDate(endDate)}</span>
      </div>
    )
  }

  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span>{formatDate(startDate)}</span>
        <span className={cn('font-medium', daysLeft <= 7 ? 'text-amber-600' : '')}>
          {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
        </span>
        <span>{formatDate(endDate)}</span>
      </div>
      <div className='relative h-2.5 w-full rounded-full bg-muted'>
        <div
          className={cn(
            'absolute left-0 top-0 h-full rounded-full transition-all',
            pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className='text-right text-xs text-muted-foreground'>{Math.round(pct)}% lộ trình đã qua</p>
    </div>
  )
}

// ============================================
// Main Component
// ============================================
export function NutritionUserGoals() {
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'

  const [profile, setProfile] = useState<ProfileApiResponse | null>(null)
  const [allGoals, setAllGoals] = useState<GoalApiResponse[]>([])
  // effectiveGoal = goal whose date range covers today (or most recent expired one)
  const [effectiveGoal, setEffectiveGoal] = useState<GoalApiResponse & { effectiveStatus?: 'active' | 'expired' } | null>(null)
  // formGoal = goal currently shown in the hero/form — can be effectiveGoal or a selected history goal
  const [formGoal, setFormGoal] = useState<GoalApiResponse | null>(null)
  // expandedRows = set of goal ids that are expanded in history
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  // editMode = whether the form is in edit mode (vs view-only for past goals)
  const [editMode, setEditMode] = useState(false)
  // deleteDialog goal
  const [deleteTarget, setDeleteTarget] = useState<GoalApiResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState<FormData>(mapApiToForm(null))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Stable "now" — fixed once per render, not inside sub-components
  const now = Date.now()

  // ============================================
  // Load data
  // ============================================
  useEffect(() => {
    Promise.all([getUserProfile().catch(() => null), getGoals()])
      .then(([prof, goalsData]) => {
        setProfile(prof)
        setAllGoals(goalsData.items)
        const effective = getEffectiveGoal(goalsData.items)
        setEffectiveGoal(effective)
        setFormGoal(effective)
        const form = mapApiToForm(effective)
        if (!effective && prof) {
          form.canNangBatDauKg = prof.can_nang_hien_tai_kg != null ? String(prof.can_nang_hien_tai_kg) : ''
        }
        setFormData(form)
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Không thể tải dữ liệu')
        toast.error('Không thể tải dữ liệu mục tiêu')
      })
      .finally(() => setIsLoading(false))
  }, [])

  // ============================================
  // Derived values
  // ============================================
  const startKg = Number(formData.canNangBatDauKg) || 0
  const targetKg = Number(formData.canNangMucTieuKg) || 0
  const cal = Number(formData.mucTieuCaloriesNgay) || 0
  const protein = Number(formData.mucTieuProteinG) || 0
  const carb = Number(formData.mucTieuCarbG) || 0
  const fat = Number(formData.mucTieuFatG) || 0
  const hasMacroData = protein > 0 || carb > 0 || fat > 0 || cal > 0

  const suggestion = useMemo(() => {
    if (!profile) return null
    const height = profile.chieu_cao_cm ?? 0
    const weight = startKg > 0 ? startKg : (profile.can_nang_hien_tai_kg ?? 0)
    const age = calcAge(profile.ngay_sinh)
    const gender = profile.gioi_tinh as GenderKey | null
    const activity = profile.muc_do_van_dong as ActivityKey | null
    if (weight <= 0 || height <= 0) return null
    const bmr = calcBMR(weight, height, age, gender)
    const multiplier = activity ? ACTIVITY_MULTIPLIER[activity] : 1.55
    let tdee = bmr * multiplier
    if (formData.loaiMucTieu === 'giam_can') tdee = tdee * 0.8
    else if (formData.loaiMucTieu === 'tang_can') tdee = tdee * 1.15
    return calcMacroSuggestion(formData.loaiMucTieu, targetKg > 0 ? targetKg : weight, Math.round(tdee))
  }, [profile, startKg, targetKg, formData.loaiMucTieu])

  const applySuggestion = useCallback(() => {
    if (!suggestion) return
    setFormData((prev) => ({
      ...prev,
      mucTieuCaloriesNgay: String(suggestion.calories),
      mucTieuProteinG: String(suggestion.protein),
      mucTieuCarbG: String(suggestion.carb),
      mucTieuFatG: String(suggestion.fat),
    }))
    toast.success('Đã áp dụng gợi ý dinh dưỡng!')
  }, [suggestion])

  const errors = useMemo(() => validate(formData), [formData])

  const weightDelta = startKg > 0 && targetKg > 0 ? (targetKg - startKg) : 0
  const weightDeltaLabel = weightDelta < 0 ? `Giảm ${Math.abs(weightDelta)} kg`
    : weightDelta > 0 ? `Tăng ${weightDelta} kg` : 'Duy trì'

  const daysRemaining = formData.ngayMucTieu
    ? Math.max(0, Math.ceil((new Date(formData.ngayMucTieu).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const historyRows = allGoals

  // Is the form showing the effective (active/expired) goal?
  const isShowingEffective = formGoal?.id === effectiveGoal?.id

  // ============================================
  // Handlers
  // ============================================
  const handleSaveGoal = useCallback(async () => {
    const errs = validate(formData)
    if (Object.keys(errs).length > 0) {
      toast.error('Vui lòng kiểm tra lại các trường có lỗi trước khi lưu.')
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        loaiMucTieu: formData.loaiMucTieu,
        canNangBatDauKg: startKg || undefined,
        canNangMucTieuKg: targetKg || undefined,
        mucTieuCaloriesNgay: cal || undefined,
        mucTieuProteinG: protein || undefined,
        mucTieuCarbG: carb || undefined,
        mucTieuFatG: fat || undefined,
        ngayBatDau: formData.ngayBatDau,
        ngayMucTieu: formData.ngayMucTieu,
      }
      let updated: GoalApiResponse
      if (formGoal && formGoal.id) {
        updated = await updateGoal(formGoal.id, payload)
      } else {
        updated = await createGoal(payload)
      }
      const refreshed = await getGoals()
      setAllGoals(refreshed.items)
      const newEffective = getEffectiveGoal(refreshed.items)
      setEffectiveGoal(newEffective)
      if (formGoal?.id === updated.id) {
        setFormGoal(updated)
      }
      setFormData(mapApiToForm(updated))
      setEditMode(false)
      toast.success(formGoal?.id ? 'Cập nhật mục tiêu thành công.' : 'Tạo mục tiêu thành công.')
      if (isOnboarding) window.location.href = '/nutrition/dashboard'
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu mục tiêu thất bại')
    } finally {
      setIsSaving(false)
    }
  }, [formData, formGoal, isOnboarding, startKg, targetKg, cal, protein, carb, fat])

  const handleCreateNew = useCallback(async () => {
    const errs = validate(formData)
    if (Object.keys(errs).length > 0) {
      toast.error('Vui lòng kiểm tra lại các trường có lỗi trước khi tạo.')
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        loaiMucTieu: formData.loaiMucTieu,
        canNangBatDauKg: startKg || undefined,
        canNangMucTieuKg: targetKg || undefined,
        mucTieuCaloriesNgay: cal || undefined,
        mucTieuProteinG: protein || undefined,
        mucTieuCarbG: carb || undefined,
        mucTieuFatG: fat || undefined,
        ngayBatDau: formData.ngayBatDau,
        ngayMucTieu: formData.ngayMucTieu,
      }
      await createGoal(payload)
      const refreshed = await getGoals()
      setAllGoals(refreshed.items)
      const newEffective = getEffectiveGoal(refreshed.items)
      setEffectiveGoal(newEffective)
      toast.success('Đã tạo mục tiêu mới. Mục tiêu cũ được lưu trữ.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo mục tiêu thất bại')
    } finally {
      setIsSaving(false)
    }
  }, [formData, startKg, targetKg, cal, protein, carb, fat])

  const handleDeleteGoal = useCallback(async () => {
    if (!deleteTarget?.id) return
    setIsDeleting(true)
    try {
      await deleteGoal(deleteTarget.id)
      const refreshed = await getGoals()
      setAllGoals(refreshed.items)
      const newEffective = getEffectiveGoal(refreshed.items)
      setEffectiveGoal(newEffective)
      // If we were viewing the deleted goal, switch to effective
      if (formGoal?.id === deleteTarget.id) {
        setFormGoal(newEffective)
        setFormData(mapApiToForm(newEffective))
        setEditMode(false)
      }
      setExpandedRows((prev) => { const n = new Set(prev); n.delete(deleteTarget.id); return n })
      setDeleteTarget(null)
      toast.success('Đã xóa mục tiêu.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại')
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTarget, formGoal])

  const handleSelectGoal = useCallback((goal: GoalApiResponse) => {
    setFormGoal(goal)
    setFormData(mapApiToForm(goal))
    setEditMode(goal.id === effectiveGoal?.id)
  }, [effectiveGoal])

  const handleBackToCurrent = useCallback(() => {
    setFormGoal(effectiveGoal)
    setFormData(mapApiToForm(effectiveGoal))
    setEditMode(true)
  }, [effectiveGoal])

  // ============================================
  // Loading / Error
  // ============================================
  if (isLoading) {
    return (
      <>
        <NutritionTopbar />
        <Main className='flex flex-1 items-center justify-center'>
          <Loader2 className='size-8 animate-spin text-muted-foreground' />
        </Main>
      </>
    )
  }

  if (loadError && !effectiveGoal) {
    return (
      <>
        <NutritionTopbar />
        <Main className='flex flex-1 items-center justify-center'>
          <Card className='max-w-md'>
            <CardContent className='pt-6 text-center'>
              <p className='text-destructive'>{loadError}</p>
              <Button className='mt-4' onClick={() => window.location.reload()}>Thử lại</Button>
            </CardContent>
          </Card>
        </Main>
      </>
    )
  }

  // ============================================
  // Render
  // ============================================
  const isExpired = effectiveGoal?.effectiveStatus === 'expired'
  const isFormReadonly = !editMode

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        {isOnboarding && (
          <div className='rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm'>
            Thiết lập mục tiêu sức khỏe giúp hệ thống tính calories và macro phù hợp cho bạn.
            Sau khi lưu, bạn sẽ được chuyển đến dashboard.
          </div>
        )}
        <PageHeading
          title='Mục tiêu sức khỏe'
          description='Thiết lập cân nặng đích và ngân sách dinh dưỡng để theo dõi tiến trình.'
        />

        {/* ============================================
            Hero — current goal (effective goal for today)
            ============================================ */}
        {effectiveGoal ? (
          <Card className={cn('border-2', isExpired ? 'border-red-200 dark:border-red-800' : 'border-primary/20')}>
            <CardContent className='p-5'>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                {/* Left: type badge + timeline + days */}
                <div className='space-y-3'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='outline' className={
                      effectiveGoal.loai_muc_tieu === 'giam_can' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : effectiveGoal.loai_muc_tieu === 'tang_can' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    }>
                      {GOAL_TYPE_LABELS[effectiveGoal.loai_muc_tieu]}
                    </Badge>
                    <StatusBadge status={isExpired ? 'Đã hết hạn' : 'Đang áp dụng'} />
                    {startKg > 0 && targetKg > 0 && (
                      <span className='rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium'>{weightDeltaLabel}</span>
                    )}
                    {!isShowingEffective && (
                      <Badge variant='outline' className='border-dashed border-primary/40 bg-primary/5 text-xs text-primary'>
                        Đang xem mục tiêu cũ
                      </Badge>
                    )}
                  </div>

                  {effectiveGoal.ngay_bat_dau && effectiveGoal.ngay_muc_tieu && (
                    <GoalTimeline startDate={effectiveGoal.ngay_bat_dau} endDate={effectiveGoal.ngay_muc_tieu} now={now} />
                  )}

                  {daysRemaining !== null && (
                    <div className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                      daysRemaining <= 7 ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
                        : isExpired ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                          : 'bg-muted text-muted-foreground',
                    )}>
                      <CalendarClock className='size-3.5' />
                      {isExpired ? 'Đã hết hạn' : daysRemaining > 0 ? `Còn ${daysRemaining} ngày đến mục tiêu` : 'Đã hết hạn'}
                    </div>
                  )}

                  {!isShowingEffective && (
                    <Button size='sm' variant='outline' onClick={handleBackToCurrent} className='mt-1'>
                      ← Quay về mục tiêu hiện tại
                    </Button>
                  )}
                </div>

                {/* Right: stat grid */}
                <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                  {[
                    { label: 'Bắt đầu', value: startKg > 0 ? `${startKg} kg` : '—' },
                    { label: 'Mục tiêu', value: targetKg > 0 ? `${targetKg} kg` : '—' },
                    { label: 'Calories', value: cal > 0 ? `${cal} kcal` : '—' },
                    { label: 'Protein', value: protein > 0 ? `${protein}g` : '—' },
                  ].map((item) => (
                    <div key={item.label} className='rounded-xl border bg-muted/30 p-2.5 text-center'>
                      <p className='text-xs text-muted-foreground'>{item.label}</p>
                      <p className='mt-0.5 text-base font-bold'>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className='border-dashed'>
            <CardContent className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
              <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
                <Target className='size-7 text-muted-foreground/50' />
              </div>
              <div>
                <p className='font-medium'>Bạn chưa có mục tiêu sức khỏe</p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Thiết lập mục tiêu để nhận cảnh báo khi vượt ngưỡng dinh dưỡng.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================
            Card 1 — Form (view / edit mode)
            ============================================ */}
        <Card>
          <CardHeader className='pb-4'>
            <CardTitle className='flex items-center gap-2'>
              <Flag className='size-4 text-primary' />
              {isFormReadonly ? 'Chi tiết mục tiêu' : (formGoal?.id ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu mới')}
            </CardTitle>
            <CardDescription>
              {isFormReadonly
                ? 'Xem thông tin chi tiết. Bấm "Chỉnh sửa" để thay đổi.'
                : formGoal?.id ? 'Cập nhật thông tin → lộ trình và cảnh báo tính lại ngay.' : 'Điền đầy đủ để hệ thống theo dõi và cảnh báo.'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Goal type */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Loại mục tiêu</Label>
              <div className='grid grid-cols-3 gap-2'>
                {(['giam_can', 'tang_can', 'giu_can'] as GoalType[]).map((gt) => (
                  <GoalTypeBtn key={gt} goalType={gt} active={formData.loaiMucTieu === gt} onClick={() => {
                    if (isFormReadonly) {
                      setEditMode(true)
                    }
                    setFormData((c) => ({ ...c, loaiMucTieu: gt }))
                  }} />
                ))}
              </div>
              {isFormReadonly ? null : (
                <p className='text-xs text-muted-foreground'>
                  {formData.loaiMucTieu === 'giam_can' && 'Giảm cân: cân mục tiêu < cân bắt đầu. Calories ở mức deficit.'}
                  {formData.loaiMucTieu === 'tang_can' && 'Tăng cân: cân mục tiêu > cân bắt đầu. Calories ở mức surplus.'}
                  {formData.loaiMucTieu === 'giu_can' && 'Duy trì: cân mục tiêu ≈ cân bắt đầu (chênh ≤ 3 kg).'}
                </p>
              )}
            </div>

            {/* Weight + dates */}
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label className='text-sm font-medium'>Cân nặng bắt đầu (kg)</Label>
                <Input value={formData.canNangBatDauKg} type='number' step='0.1' min='1'
                  placeholder={profile?.can_nang_hien_tai_kg != null ? `VD: ${profile.can_nang_hien_tai_kg}` : 'VD: 70'}
                  readOnly={isFormReadonly}
                  onChange={(e) => { if (!isFormReadonly) { setFormData((c) => ({ ...c, canNangBatDauKg: e.target.value })) } }}
                />
                <FieldError message={errors.canNangBatDauKg} />
                {profile && !formData.canNangBatDauKg && !isFormReadonly && (
                  <FieldWarn message={`Gợi ý từ hồ sơ: ${profile.can_nang_hien_tai_kg} kg`} />
                )}
              </div>

              <div className='space-y-1.5'>
                <Label className='text-sm font-medium'>Cân nặng mục tiêu (kg)</Label>
                <Input value={formData.canNangMucTieuKg} type='number' step='0.1' min='1'
                  placeholder={formData.loaiMucTieu === 'giam_can' ? 'VD: 65' : formData.loaiMucTieu === 'tang_can' ? 'VD: 75' : 'VD: 70'}
                  readOnly={isFormReadonly}
                  onChange={(e) => { if (!isFormReadonly) { setFormData((c) => ({ ...c, canNangMucTieuKg: e.target.value })) } }}
                />
                <FieldError message={errors.canNangMucTieuKg} />
                {formData.loaiMucTieu === 'giam_can' && startKg > 0 && targetKg > 0 && targetKg >= startKg && !errors.canNangMucTieuKg && (
                  <FieldError message='Cân mục tiêu phải THẤP HƠN cân bắt đầu khi giảm cân' />
                )}
                {formData.loaiMucTieu === 'tang_can' && startKg > 0 && targetKg > 0 && targetKg <= startKg && !errors.canNangMucTieuKg && (
                  <FieldError message='Cân mục tiêu phải CAO HƠN cân bắt đầu khi tăng cân' />
                )}
              </div>

              <div className='space-y-1.5'>
                <Label className='text-sm font-medium'>Ngày bắt đầu</Label>
                <Input value={formData.ngayBatDau} type='date' readOnly={isFormReadonly}
                  onChange={(e) => { if (!isFormReadonly) { setFormData((c) => ({ ...c, ngayBatDau: e.target.value })) } }}
                />
                <FieldError message={errors.ngayBatDau} />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-sm font-medium'>Ngày dự kiến đạt mục tiêu</Label>
                <Input value={formData.ngayMucTieu} type='date' readOnly={isFormReadonly}
                  onChange={(e) => { if (!isFormReadonly) { setFormData((c) => ({ ...c, ngayMucTieu: e.target.value })) } }}
                />
                <FieldError message={errors.ngayMucTieu} />
              </div>
            </div>

            <Separator />

            {/* Nutrition budget */}
            <div className='space-y-4'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <Zap className='size-4 text-primary' />
                  <h3 className='text-sm font-semibold'>Ngân sách dinh dưỡng hằng ngày</h3>
                </div>
                {suggestion && !hasMacroData && !isFormReadonly && (
                  <button type='button' onClick={applySuggestion}
                    className='flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20'>
                    <Sparkles className='size-3' />Gợi ý từ hệ thống
                  </button>
                )}
              </div>

              {isFormReadonly ? (
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                  {[
                    { label: 'Calories', value: cal > 0 ? `${cal} kcal` : '—' },
                    { label: 'Protein', value: protein > 0 ? `${protein}g` : '—' },
                    { label: 'Carb', value: carb > 0 ? `${carb}g` : '—' },
                    { label: 'Chất béo', value: fat > 0 ? `${fat}g` : '—' },
                  ].map((item) => (
                    <div key={item.label} className='rounded-lg border p-3 text-center'>
                      <p className='text-xs text-muted-foreground'>{item.label}</p>
                      <p className='mt-0.5 text-base font-semibold'>{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <p className='text-xs text-muted-foreground'>
                    Điền đầy đủ để nhận cảnh báo khi vượt mục tiêu.
                    Bấm <strong>&quot;Gợi ý từ hệ thống&quot;</strong> để tự động điền.
                  </p>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='space-y-1.5'>
                      <Label className='text-sm font-medium'>
                        Calories / ngày (kcal)
                        {suggestion && <span className='ml-1.5 text-xs text-primary'>→ gợi ý: {suggestion.calories}</span>}
                      </Label>
                      <Input value={formData.mucTieuCaloriesNgay} type='number'
                        placeholder={suggestion ? String(suggestion.calories) : 'VD: 1800'}
                        onChange={(e) => setFormData((c) => ({ ...c, mucTieuCaloriesNgay: e.target.value }))}
                      />
                      <FieldError message={errors.mucTieuCaloriesNgay} />
                      {cal > 0 && !errors.mucTieuCaloriesNgay && (
                        <FieldWarn message={
                          cal < 1200 ? 'Rất ít calories. Cân nhắc tăng lên.'
                            : cal < startKg * 14 ? 'Calories khá thấp so với cân nặng.'
                              : ''
                        } />
                      )}
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-sm font-medium'>
                        Protein / ngày (g)
                        {suggestion && <span className='ml-1.5 text-xs text-primary'>→ gợi ý: {suggestion.protein}g</span>}
                      </Label>
                      <Input value={formData.mucTieuProteinG} type='number' step='0.1'
                        placeholder={suggestion ? String(suggestion.protein) : 'VD: 120'}
                        onChange={(e) => setFormData((c) => ({ ...c, mucTieuProteinG: e.target.value }))}
                      />
                      <FieldError message={errors.mucTieuProteinG} />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-sm font-medium'>
                        Carb / ngày (g)
                        {suggestion && <span className='ml-1.5 text-xs text-primary'>→ gợi ý: {suggestion.carb}g</span>}
                      </Label>
                      <Input value={formData.mucTieuCarbG} type='number' step='0.1'
                        placeholder={suggestion ? String(suggestion.carb) : 'VD: 200'}
                        onChange={(e) => setFormData((c) => ({ ...c, mucTieuCarbG: e.target.value }))}
                      />
                      <FieldError message={errors.mucTieuCarbG} />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-sm font-medium'>
                        Chất béo / ngày (g)
                        {suggestion && <span className='ml-1.5 text-xs text-primary'>→ gợi ý: {suggestion.fat}g</span>}
                      </Label>
                      <Input value={formData.mucTieuFatG} type='number' step='0.1'
                        placeholder={suggestion ? String(suggestion.fat) : 'VD: 60'}
                        onChange={(e) => setFormData((c) => ({ ...c, mucTieuFatG: e.target.value }))}
                      />
                      <FieldError message={errors.mucTieuFatG} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Action buttons */}
            <div className='flex flex-wrap items-center gap-3'>
              {isFormReadonly ? (
                <>
                  {formGoal?.id === effectiveGoal?.id && (
                    <Button onClick={() => setEditMode(true)}>
                      <Pencil className='mr-2 size-4' />
                      Chỉnh sửa
                    </Button>
                  )}
                  {formGoal?.id && formGoal.id !== effectiveGoal?.id && (
                    <Button variant='outline' onClick={() => setDeleteTarget(formGoal)} className='text-red-500 hover:text-red-600'>
                      <Trash2 className='mr-2 size-4' />
                      Xóa mục tiêu
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button onClick={handleSaveGoal} disabled={isSaving} className='min-w-[140px]'>
                    {isSaving ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
                    {isSaving ? 'Đang lưu...' : formGoal?.id ? 'Lưu thay đổi' : 'Tạo mục tiêu'}
                  </Button>
                  {formGoal?.id && (
                    <Button variant='outline' onClick={() => {
                      setFormData(mapApiToForm(formGoal))
                      setEditMode(false)
                    }}>
                      Hủy
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============================================
            Card 2 — Macro preview
            ============================================ */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm'>
              <Scale className='size-4 text-primary' />
              Chỉ tiêu dinh dưỡng
            </CardTitle>
            <CardDescription>Ngân sách hằng ngày bạn đã thiết lập.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {!hasMacroData ? (
              <div className='flex flex-col items-center gap-2 py-8 text-center'>
                <div className='rounded-full bg-muted p-3'>
                  <Zap className='size-6 text-muted-foreground/50' />
                </div>
                <p className='text-sm text-muted-foreground'>Chưa có ngân sách dinh dưỡng.</p>
                <p className='text-xs text-muted-foreground'>Bấm &quot;Chỉnh sửa&quot; bên trái để thêm.</p>
              </div>
            ) : (
              <>
                {cal > 0 && (
                  <div className='flex items-center gap-3 rounded-xl border p-3'>
                    <div className='flex size-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/30'>
                      <Zap className='size-4' />
                    </div>
                    <div><p className='text-xs text-muted-foreground'>Calories / ngày</p><p className='text-xl font-bold'>{cal} kcal</p></div>
                  </div>
                )}
                {protein > 0 && (
                  <div className='flex items-center gap-3 rounded-xl border p-3'>
                    <div className='flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'>
                      <Target className='size-4' />
                    </div>
                    <div><p className='text-xs text-muted-foreground'>Protein / ngày</p><p className='text-xl font-bold'>{protein}g</p></div>
                  </div>
                )}
                {carb > 0 && (
                  <div className='flex items-center gap-3 rounded-xl border p-3'>
                    <div className='flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30'>
                      <Scale className='size-4' />
                    </div>
                    <div><p className='text-xs text-muted-foreground'>Carb / ngày</p><p className='text-xl font-bold'>{carb}g</p></div>
                  </div>
                )}
                {fat > 0 && (
                  <div className='flex items-center gap-3 rounded-xl border p-3'>
                    <div className='flex size-9 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950/30'>
                      <TrendingUp className='size-4' />
                    </div>
                    <div><p className='text-xs text-muted-foreground'>Chất béo / ngày</p><p className='text-xl font-bold'>{fat}g</p></div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ============================================
            Card 3 — History (with expand + edit + delete)
            ============================================ */}
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <CardTitle className='text-sm'>Lịch sử mục tiêu</CardTitle>
              {historyRows.length > 0 && (
                <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>{historyRows.length}</span>
              )}
            </div>
            <CardDescription>Tất cả mục tiêu đã tạo. Click để xem chi tiết hoặc chỉnh sửa.</CardDescription>
          </CardHeader>
          <CardContent>
            {historyRows.length === 0 ? (
              <div className='flex flex-col items-center gap-2 py-8 text-center'>
                <Circle className='size-8 text-muted-foreground/40' />
                <p className='text-sm text-muted-foreground'>Chưa có mục tiêu nào.</p>
                <p className='text-xs text-muted-foreground'>Tạo mục tiêu đầu tiên ở card phía trên.</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {historyRows.map((goal) => {
                  const goalLabel = GOAL_TYPE_LABELS[goal.loai_muc_tieu] ?? '—'
                  const goalStatus = STATUS_LABELS[goal.trang_thai] ?? goal.trang_thai
                  const isActive = goal.id === effectiveGoal?.id
                  const isEffActive = effectiveGoal?.effectiveStatus === 'active' && isActive
                  const isEffExpired = effectiveGoal?.effectiveStatus === 'expired' && isActive
                  const isExpanded = expandedRows.has(goal.id)
                  const isSelected = formGoal?.id === goal.id
                  const goalColor = goal.loai_muc_tieu === 'giam_can' ? 'text-blue-600'
                    : goal.loai_muc_tieu === 'tang_can' ? 'text-orange-600' : 'text-green-600'

                  return (
                    <div key={goal.id} className={cn(
                      'rounded-xl border transition-all',
                      isSelected ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30',
                    )}>
                      {/* Row header — always visible */}
                      <button
                        type='button'
                        className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left'
                        onClick={() => {
                          if (isSelected && isExpanded) {
                            setExpandedRows((prev) => { const n = new Set(prev); n.delete(goal.id); return n })
                          } else {
                            handleSelectGoal(goal)
                            setExpandedRows((prev) => new Set([...prev, goal.id]))
                          }
                        }}
                      >
                        <div className='flex min-w-0 flex-wrap items-center gap-2'>
                          <span className={cn('text-sm font-semibold', goalColor)}>{goalLabel}</span>
                          <span className='text-sm text-muted-foreground'>
                            {goal.can_nang_muc_tieu_kg != null ? `${goal.can_nang_muc_tieu_kg} kg` : '—'}
                          </span>
                          <StatusBadge status={isEffExpired ? 'Đã hết hạn' : isEffActive ? 'Đang áp dụng' : goalStatus} />
                          {isEffActive && (
                            <Badge variant='outline' className='border-teal-300 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300 text-xs'>
                              Hiện tại
                            </Badge>
                          )}
                          {isEffExpired && (
                            <Badge variant='outline' className='border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 text-xs'>
                              Hết hạn
                            </Badge>
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          {/* Inline timeline */}
                          {goal.ngay_bat_dau && goal.ngay_muc_tieu && (
                            <GoalTimeline startDate={goal.ngay_bat_dau} endDate={goal.ngay_muc_tieu} compact now={now} />
                          )}
                          {isSelected
                            ? <ChevronUp className='size-4 shrink-0 text-muted-foreground' />
                            : <ChevronDown className='size-4 shrink-0 text-muted-foreground' />
                          }
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isSelected && isExpanded && (
                        <div className='border-t px-4 pb-4 pt-3'>
                          {/* Stats row */}
                          <div className='mb-3 grid grid-cols-4 gap-2'>
                            {[
                              { label: 'Bắt đầu', value: goal.can_nang_bat_dau_kg != null ? `${goal.can_nang_bat_dau_kg} kg` : '—' },
                              { label: 'Mục tiêu', value: goal.can_nang_muc_tieu_kg != null ? `${goal.can_nang_muc_tieu_kg} kg` : '—' },
                              { label: 'Calories', value: goal.muc_tieu_calories_ngay != null ? `${goal.muc_tieu_calories_ngay} kcal` : '—' },
                              { label: 'Protein', value: goal.muc_tieu_protein_g != null ? `${goal.muc_tieu_protein_g}g` : '—' },
                            ].map((item) => (
                              <div key={item.label} className='rounded-lg border bg-muted/30 p-2 text-center'>
                                <p className='text-xs text-muted-foreground'>{item.label}</p>
                                <p className='text-sm font-semibold'>{item.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Additional macro */}
                          {(goal.muc_tieu_carb_g != null || goal.muc_tieu_fat_g != null) && (
                            <div className='mb-3 flex flex-wrap gap-3'>
                              {goal.muc_tieu_carb_g != null && (
                                <span className='text-xs text-muted-foreground'>Carb: <strong>{goal.muc_tieu_carb_g}g</strong></span>
                              )}
                              {goal.muc_tieu_fat_g != null && (
                                <span className='text-xs text-muted-foreground'>Chất béo: <strong>{goal.muc_tieu_fat_g}g</strong></span>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className='flex flex-wrap gap-2'>
                            <Button size='sm' variant='outline' onClick={() => { handleSelectGoal(goal); setEditMode(true) }}>
                              <Pencil className='mr-1.5 size-3' />Chỉnh sửa
                            </Button>
                            <Button size='sm' variant='outline'
                              onClick={() => { handleSelectGoal(goal); setExpandedRows((prev) => new Set([...prev])) }}>
                              <Eye className='mr-1.5 size-3' />Xem đầy đủ
                            </Button>
                            <Button size='sm' variant='outline' className='text-red-500 hover:text-red-600 hover:border-red-300'
                              onClick={() => setDeleteTarget(goal)}>
                              <Trash2 className='mr-1.5 size-3' />Xóa
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </Main>

      {/* ============================================
          Delete confirmation dialog
          ============================================ */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa mục tiêu?</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Mục tiêu &quot;{deleteTarget ? GOAL_TYPE_LABELS[deleteTarget.loai_muc_tieu] : ''}&quot;
              {deleteTarget?.can_nang_muc_tieu_kg != null ? ` (${deleteTarget.can_nang_muc_tieu_kg} kg)` : ''} sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant='destructive' onClick={handleDeleteGoal} disabled={isDeleting}>
              {isDeleting ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Trash2 className='mr-2 size-4' />}
              Xóa mục tiêu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
