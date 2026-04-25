'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'
import { MacroProgress } from '@/features/nutrition/components/macro-progress'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { StatCard } from '@/features/nutrition/components/stat-card'
import { getCurrentGoal, type GoalApiResponse } from '@/services/goals/api'
import { getUserMealPlanDetail, getUserMealPlans } from '@/services/content/api'
import {
  deleteMealLog,
  getMealLogs,
  getNutritionSummary,
  MEAL_TYPE_LABELS,
  updateMealLog,
  type MealType,
  type MealLogDetail,
  type MealLogItem,
} from '@/services/meals/api'

type MealSection = {
  key: keyof typeof MEAL_TYPE_LABELS
  label: string
  hint: string
  entries: MealLogItem[]
  accent: { bg: string; text: string; badge: string }
}

const MEAL_ACCENT: Record<keyof typeof MEAL_TYPE_LABELS, MealSection['accent']> = {
  bua_sang: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' },
  bua_trua: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
  bua_toi: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-300', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' },
  bua_phu: { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-700 dark:text-pink-300', badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300' },
}

type NutritionTotals = {
  calories: number
  protein: number
  carb: number
  fat: number
}

const MEAL_TARGET_RATIO: Record<MealType, number> = {
  bua_sang: 0.25,
  bua_trua: 0.35,
  bua_toi: 0.3,
  bua_phu: 0.1,
}

function toISODate(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function inferDetailName(detail: MealLogDetail & { du_lieu_chup_lai?: Record<string, unknown> }) {
  const snap = detail.du_lieu_chup_lai
  const snapName = snap && typeof snap.ten === 'string' ? snap.ten : null
  if (snapName) return snapName
  if (detail.cong_thuc_id) return `Công thức #${detail.cong_thuc_id}`
  if (detail.thuc_pham_id) return `Thực phẩm #${detail.thuc_pham_id}`
  return 'Món ăn'
}

function calculateLogTotals(entry: MealLogItem) {
  return entry.chi_tiet.reduce(
    (acc, detail) => {
      acc.calories += Number(detail.calories ?? 0)
      acc.protein += Number(detail.protein_g ?? 0)
      acc.carb += Number(detail.carb_g ?? 0)
      acc.fat += Number(detail.fat_g ?? 0)
      return acc
    },
    { calories: 0, protein: 0, carb: 0, fat: 0 },
  )
}

function emptyTotals(): NutritionTotals {
  return { calories: 0, protein: 0, carb: 0, fat: 0 }
}

function calculateEntriesTotals(entries: MealLogItem[]) {
  return entries.reduce((acc, entry) => {
    const totals = calculateLogTotals(entry)
    acc.calories += totals.calories
    acc.protein += totals.protein
    acc.carb += totals.carb
    acc.fat += totals.fat
    return acc
  }, emptyTotals())
}

function toMetricWarnings(current: NutritionTotals, target: NutritionTotals) {
  const exceeded: string[] = []
  const nearLimit: string[] = []
  const checks: Array<{ label: string; cur: number; tar: number }> = [
    { label: 'calories', cur: current.calories, tar: target.calories },
    { label: 'protein', cur: current.protein, tar: target.protein },
    { label: 'carb', cur: current.carb, tar: target.carb },
    { label: 'fat', cur: current.fat, tar: target.fat },
  ]

  checks.forEach((item) => {
    if (item.tar <= 0) return
    const ratio = item.cur / item.tar
    if (ratio > 1) exceeded.push(item.label)
    else if (ratio >= 0.9) nearLimit.push(item.label)
  })

  return { exceeded, nearLimit }
}

export function NutritionUserMealLogs() {
  const [selectedDate, setSelectedDate] = useState(toISODate())
  const [loading, setLoading] = useState(true)
  const [mealLogs, setMealLogs] = useState<MealLogItem[]>([])
  const [historyLogs, setHistoryLogs] = useState<MealLogItem[]>([])
  const [summary, setSummary] = useState<{
    tong_calories: number
    tong_protein_g: number
    tong_carb_g: number
    tong_fat_g: number
    so_bua_da_ghi: number
  } | null>(null)
  const [goal, setGoal] = useState<GoalApiResponse | null>(null)
  const [mealPlanTargets, setMealPlanTargets] = useState<
    Partial<Record<MealType, NutritionTotals>>
  >({})
  const [dailyPlanTarget, setDailyPlanTarget] = useState<NutritionTotals>(emptyTotals())
  const [editingLogId, setEditingLogId] = useState<number | null>(null)
  const [editingDate, setEditingDate] = useState('')
  const [editingMealType, setEditingMealType] = useState<MealType>('bua_sang')
  const [editingNote, setEditingNote] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingDetailKey, setEditingDetailKey] = useState<string | null>(null)
  const [editingDetailQty, setEditingDetailQty] = useState('')
  const [editingDetailUnit, setEditingDetailUnit] = useState('')
  const [savingDetailKey, setSavingDetailKey] = useState<string | null>(null)

  const mealSections = useMemo<MealSection[]>(
    () => [
      {
        key: 'bua_sang',
        label: MEAL_TYPE_LABELS.bua_sang,
        hint: 'Khởi động ngày mới',
        entries: mealLogs.filter((log) => log.loai_bua_an === 'bua_sang'),
        accent: MEAL_ACCENT.bua_sang,
      },
      {
        key: 'bua_trua',
        label: MEAL_TYPE_LABELS.bua_trua,
        hint: 'Giữ năng lượng làm việc',
        entries: mealLogs.filter((log) => log.loai_bua_an === 'bua_trua'),
        accent: MEAL_ACCENT.bua_trua,
      },
      {
        key: 'bua_toi',
        label: MEAL_TYPE_LABELS.bua_toi,
        hint: 'Ăn đủ và nhẹ nhàng',
        entries: mealLogs.filter((log) => log.loai_bua_an === 'bua_toi'),
        accent: MEAL_ACCENT.bua_toi,
      },
      {
        key: 'bua_phu',
        label: MEAL_TYPE_LABELS.bua_phu,
        hint: 'Kiểm soát cơn đói',
        entries: mealLogs.filter((log) => log.loai_bua_an === 'bua_phu'),
        accent: MEAL_ACCENT.bua_phu,
      },
    ],
    [mealLogs],
  )

  async function loadData(date = selectedDate) {
    setLoading(true)
    try {
      const [logRes, summaryRes, historyRes] = await Promise.all([
        getMealLogs({ date, page: 1, limit: 20 }),
        getNutritionSummary({ date }),
        getMealLogs({ page: 1, limit: 100 }),
      ])

      setMealLogs(logRes.data.items)
      setHistoryLogs(historyRes.data.items)

      const summaryData = summaryRes.data
      if (summaryData && 'tong_calories' in summaryData) {
        setSummary({
          tong_calories: Number(summaryData.tong_calories ?? 0),
          tong_protein_g: Number(summaryData.tong_protein_g ?? 0),
          tong_carb_g: Number(summaryData.tong_carb_g ?? 0),
          tong_fat_g: Number(summaryData.tong_fat_g ?? 0),
          so_bua_da_ghi: Number(summaryData.so_bua_da_ghi ?? 0),
        })
      } else {
        setSummary(null)
      }

      const currentGoal = await getCurrentGoal().catch(() => null)
      setGoal(currentGoal)

      const planList = await getUserMealPlans({
        page: 1,
        limit: 50,
        from: date,
        to: date,
      }).catch(() => null)
      const chosenPlan =
        planList?.items.find((item) => item.trang_thai === 'dang_ap_dung') ??
        planList?.items[0] ??
        null

      if (!chosenPlan) {
        setMealPlanTargets({})
        setDailyPlanTarget(emptyTotals())
      } else {
        const planDetail = await getUserMealPlanDetail(chosenPlan.id).catch(() => null)
        if (!planDetail) {
          setMealPlanTargets({})
          setDailyPlanTarget(emptyTotals())
        } else {
          const targets: Partial<Record<MealType, NutritionTotals>> = {}
          planDetail.chi_tiet.forEach((item) => {
            const key = item.loai_bua_an as MealType
            if (!targets[key]) {
              targets[key] = emptyTotals()
            }
            targets[key]!.calories += Number(item.calories ?? 0)
            targets[key]!.protein += Number(item.protein_g ?? 0)
            targets[key]!.carb += Number(item.carb_g ?? 0)
            targets[key]!.fat += Number(item.fat_g ?? 0)
          })
          setMealPlanTargets(targets)
          setDailyPlanTarget({
            calories: Number(planDetail.tong_calories ?? 0),
            protein: Number(planDetail.tong_protein_g ?? 0),
            carb: Number(planDetail.tong_carb_g ?? 0),
            fat: Number(planDetail.tong_fat_g ?? 0),
          })
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Không tải được dữ liệu nhật ký ăn uống.',
      )
    } finally {
      setLoading(false)
    }
  }

  function getGoalBasedMealTarget(mealType: MealType): NutritionTotals {
    const ratio = MEAL_TARGET_RATIO[mealType]
    return {
      calories: Number(goal?.muc_tieu_calories_ngay ?? 0) * ratio,
      protein: Number(goal?.muc_tieu_protein_g ?? 0) * ratio,
      carb: Number(goal?.muc_tieu_carb_g ?? 0) * ratio,
      fat: Number(goal?.muc_tieu_fat_g ?? 0) * ratio,
    }
  }

  function getMealTarget(mealType: MealType): NutritionTotals {
    return mealPlanTargets[mealType] ?? getGoalBasedMealTarget(mealType)
  }

  useEffect(() => {
    void loadData(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  function startEdit(log: MealLogItem) {
    setEditingLogId(log.id)
    setEditingDate(log.ngay_ghi)
    setEditingMealType(log.loai_bua_an)
    setEditingNote(log.ghi_chu ?? '')
  }

  function cancelEdit() {
    setEditingLogId(null)
    setEditingDate('')
    setEditingMealType('bua_sang')
    setEditingNote('')
  }

  async function saveEdit() {
    if (!editingLogId) return
    if (!editingDate) {
      toast.error('Vui lòng chọn ngày ghi.')
      return
    }

    setSavingEdit(true)
    try {
      const response = await updateMealLog(editingLogId, {
        ngayGhi: editingDate,
        loaiBuaAn: editingMealType,
        ghiChu: editingNote.trim() || undefined,
      })
      toast.success(response.message)
      cancelEdit()
      await loadData(selectedDate)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật nhật ký bữa ăn.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete(logId: number) {
    const ok = window.confirm('Bạn chắc chắn muốn xóa nhật ký bữa ăn này?')
    if (!ok) return

    setDeletingId(logId)
    try {
      const response = await deleteMealLog(logId)
      toast.success(response.message)
      await loadData(selectedDate)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa nhật ký bữa ăn.')
    } finally {
      setDeletingId(null)
    }
  }

  function toUpdateDetailPayload(detail: MealLogDetail) {
    return {
      loaiNguon: detail.loai_nguon,
      thucPhamId: detail.thuc_pham_id ?? undefined,
      congThucId: detail.cong_thuc_id ?? undefined,
      soLuong: detail.so_luong,
      donVi: detail.don_vi,
    }
  }

  function startEditDetail(entry: MealLogItem, detail: MealLogDetail) {
    setEditingLogId(null)
    const key = `${entry.id}-${detail.id}`
    setEditingDetailKey(key)
    setEditingDetailQty(String(detail.so_luong))
    setEditingDetailUnit(detail.don_vi)
  }

  function cancelEditDetail() {
    setEditingDetailKey(null)
    setEditingDetailQty('')
    setEditingDetailUnit('')
  }

  async function saveDetail(entry: MealLogItem, detail: MealLogDetail) {
    const qty = Number(editingDetailQty)
    const unit = editingDetailUnit.trim()
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('Số lượng món phải lớn hơn 0.')
      return
    }
    if (!unit) {
      toast.error('Đơn vị không được để trống.')
      return
    }

    const key = `${entry.id}-${detail.id}`
    setSavingDetailKey(key)
    try {
      const nextDetails = entry.chi_tiet.map((item) =>
        item.id === detail.id
          ? {
              loaiNguon: item.loai_nguon,
              thucPhamId: item.thuc_pham_id ?? undefined,
              congThucId: item.cong_thuc_id ?? undefined,
              soLuong: qty,
              donVi: unit,
            }
          : toUpdateDetailPayload(item),
      )
      const response = await updateMealLog(entry.id, {
        chiTiet: nextDetails,
      })
      toast.success(response.message)
      cancelEditDetail()
      await loadData(selectedDate)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật món ăn.')
    } finally {
      setSavingDetailKey(null)
    }
  }

  async function removeDetail(entry: MealLogItem, detail: MealLogDetail) {
    if (entry.chi_tiet.length <= 1) {
      toast.error('Bữa ăn chỉ còn 1 món. Hãy xóa log nếu muốn bỏ toàn bộ.')
      return
    }

    const key = `${entry.id}-${detail.id}`
    setSavingDetailKey(key)
    try {
      const nextDetails = entry.chi_tiet
        .filter((item) => item.id !== detail.id)
        .map(toUpdateDetailPayload)
      const response = await updateMealLog(entry.id, {
        chiTiet: nextDetails,
      })
      toast.success(response.message)
      if (editingDetailKey === key) {
        cancelEditDetail()
      }
      await loadData(selectedDate)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa món khỏi bữa ăn.')
    } finally {
      setSavingDetailKey(null)
    }
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Nhật ký ăn uống'
          description='Theo dõi bữa ăn theo ngày và tổng hợp dinh dưỡng từ dữ liệu thực.'
        />

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <Button variant='outline' size='icon' className='h-9 w-9' onClick={() => {
              const d = new Date(selectedDate)
              d.setDate(d.getDate() - 1)
              setSelectedDate(toISODate(d))
            }}>
              <ChevronLeft className='size-4' />
            </Button>
            <div className='flex items-center gap-2 rounded-md border bg-background px-3 py-1.5'>
              <CalendarDays className='size-4 text-primary' />
              <input
                type='date'
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className='h-7 border-0 bg-transparent text-sm font-medium focus-visible:outline-none'
              />
            </div>
            <Button variant='outline' size='icon' className='h-9 w-9' onClick={() => {
              const d = new Date(selectedDate)
              d.setDate(d.getDate() + 1)
              setSelectedDate(toISODate(d))
            }}>
              <ChevronRight className='size-4' />
            </Button>
            {selectedDate !== toISODate() && (
              <Button variant='ghost' size='sm' onClick={() => setSelectedDate(toISODate())}>
                Hôm nay
              </Button>
            )}
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button variant='outline' size='sm' onClick={() => void loadData(selectedDate)} disabled={loading}>
              {loading ? <Loader2 className='mr-1.5 size-4 animate-spin' /> : <RefreshCw className='mr-1.5 size-4' />}
              Làm mới
            </Button>
            <Button variant='default' size='sm' asChild>
              <Link href='/nutrition/foods'>
                <Plus className='mr-1.5 size-4' />
                Log bữa ăn
              </Link>
            </Button>
          </div>
        </div>

        {loading && (
          <div className='flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary'>
            <Loader2 className='size-4 animate-spin' />
            Đang tải nhật ký ăn uống...
          </div>
        )}

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <StatCard
            label='Calories'
            value={`${summary?.tong_calories ?? 0}`}
            sub='kcal'
            tone={summary?.tong_calories ? 'amber' : 'default'}
          />
          <StatCard
            label='Protein'
            value={`${summary?.tong_protein_g ?? 0}`}
            sub='gam'
            tone={summary?.tong_protein_g ? 'green' : 'default'}
          />
          <StatCard label='Carb' value={`${summary?.tong_carb_g ?? 0}`} sub='gam' />
          <StatCard label='Fat' value={`${summary?.tong_fat_g ?? 0}`} sub='gam' tone={summary?.tong_fat_g ? 'red' : 'default'} />
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
          <div className='grid gap-4'>
            {mealSections.map((section) => {
              const sectionTotals = calculateEntriesTotals(section.entries)
              const sectionTarget = getMealTarget(section.key)
              const warning = toMetricWarnings(sectionTotals, sectionTarget)

              return (
                <Card key={section.key} className='overflow-hidden'>
                  {/* Accent header strip */}
                  <div className={section.accent.bg + ' px-4 py-3'}>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <div className='flex items-center gap-2'>
                        <span className={'text-lg font-bold ' + section.accent.text}>{section.label}</span>
                        <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + section.accent.badge}>
                          {section.entries.length > 0
                            ? `${section.entries.length} log · ${sectionTotals.calories.toFixed(0)} kcal`
                            : 'Chưa có log'}
                        </span>
                      </div>
                      <Link
                        href={`/nutrition/foods?meal_type=${section.key}&date=${selectedDate}`}
                        className={`flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline ${section.accent.text}`}
                      >
                        <Plus className='size-3.5' />
                        Thêm món
                      </Link>
                    </div>
                    <p className={'mt-0.5 text-xs ' + section.accent.text + '/70'}>{section.hint}</p>
                  </div>

                  <CardContent className='p-4'>
                    {editingLogId !== null && section.entries.some((e) => e.id === editingLogId) ? (
                      (() => {
                        const editingEntry = section.entries.find((e) => e.id === editingLogId)!
                        return (
                          <div className='space-y-3 rounded-lg border bg-muted/30 p-3'>
                            <div className='grid gap-2 md:grid-cols-2'>
                              <Input
                                type='date'
                                value={editingDate}
                                onChange={(event) => setEditingDate(event.target.value)}
                              />
                              <Select
                                value={editingMealType}
                                onValueChange={(value) => setEditingMealType(value as MealType)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Textarea
                              rows={2}
                              value={editingNote}
                              onChange={(event) => setEditingNote(event.target.value)}
                              placeholder='Ghi chú bữa ăn (tùy chọn)'
                            />
                            <div className='flex flex-wrap gap-2'>
                              <Button size='sm' onClick={() => void saveEdit()} disabled={savingEdit}>
                                {savingEdit ? 'Đang lưu...' : 'Lưu cập nhật'}
                              </Button>
                              <Button size='sm' variant='outline' onClick={cancelEdit} disabled={savingEdit}>
                                Hủy
                              </Button>
                            </div>
                          </div>
                        )
                      })()
                    ) : null}

                    {section.entries.length === 0 ? (
                      <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-center'>
                        <div className={'rounded-full ' + section.accent.bg + ' p-3'}>
                          <Plus className={'size-6 ' + section.accent.text + '/50'} />
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          Chưa có dữ liệu cho {section.label.toLowerCase()}.
                        </p>
                        <Button variant='outline' size='sm' asChild>
                          <Link href={`/nutrition/foods?meal_type=${section.key}&date=${selectedDate}`}>
                            <Plus className='mr-1.5 size-4' />
                            Log bữa này
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {section.entries.map((entry) => {
                          const totals = calculateLogTotals(entry)
                          return (
                            <div key={entry.id} className='rounded-xl border p-4'>
                              <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <button
                                    onClick={() => startEdit(entry)}
                                    className='text-sm font-semibold hover:text-primary'
                                  >
                                    Log #{entry.id}
                                  </button>
                                  <span className='text-xs text-muted-foreground'>
                                    {entry.ghi_chu || 'Không có ghi chú'}
                                  </span>
                                </div>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <Badge variant='outline' className='text-xs'>
                                    {entry.chi_tiet.length} món
                                  </Badge>
                                  <Badge variant='secondary' className='text-xs'>
                                    {totals.calories.toFixed(0)} kcal
                                  </Badge>
                                  <Button
                                    size='sm'
                                    variant='destructive'
                                    className='h-7 w-7 p-0'
                                    onClick={() => void handleDelete(entry.id)}
                                    disabled={deletingId === entry.id}
                                  >
                                    <Trash2 className='size-3.5' />
                                  </Button>
                                </div>
                              </div>

                              <div className='overflow-x-auto rounded-lg border'>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Món</TableHead>
                                      <TableHead className='w-32 text-right'>Lượng</TableHead>
                                      <TableHead className='w-16 text-right'>kcal</TableHead>
                                      <TableHead className='w-12 text-right'>P</TableHead>
                                      <TableHead className='w-12 text-right'>C</TableHead>
                                      <TableHead className='w-12 text-right'>F</TableHead>
                                      <TableHead className='w-16 text-right'>Thao tác</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {entry.chi_tiet.map((detail) => (
                                      <TableRow key={detail.id}>
                                        <TableCell className='font-medium'>
                                          {inferDetailName(detail as MealLogDetail & { du_lieu_chup_lai?: Record<string, unknown> })}
                                        </TableCell>
                                        <TableCell className='text-right'>
                                          {editingDetailKey === entry.id + '-' + detail.id ? (
                                            <div className='ml-auto flex w-32 gap-1'>
                                              <Input
                                                type='number'
                                                step='0.1'
                                                min='0.1'
                                                value={editingDetailQty}
                                                onChange={(event) => setEditingDetailQty(event.target.value)}
                                                className='h-7 w-16 text-right text-xs'
                                              />
                                              <Input
                                                value={editingDetailUnit}
                                                onChange={(event) => setEditingDetailUnit(event.target.value)}
                                                className='h-7 w-14 text-xs'
                                              />
                                            </div>
                                          ) : (
                                            <span className='text-sm text-muted-foreground'>
                                              {detail.so_luong} {detail.don_vi}
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell className='text-right text-sm font-medium'>
                                          {Number(detail.calories ?? 0).toFixed(0)}
                                        </TableCell>
                                        <TableCell className='text-right text-sm text-muted-foreground'>
                                          {Number(detail.protein_g ?? 0).toFixed(1)}
                                        </TableCell>
                                        <TableCell className='text-right text-sm text-muted-foreground'>
                                          {Number(detail.carb_g ?? 0).toFixed(1)}
                                        </TableCell>
                                        <TableCell className='text-right text-sm text-muted-foreground'>
                                          {Number(detail.fat_g ?? 0).toFixed(1)}
                                        </TableCell>
                                        <TableCell className='text-right'>
                                          {editingDetailKey === entry.id + '-' + detail.id ? (
                                            <div className='ml-auto flex gap-1'>
                                              <Button
                                                size='sm'
                                                className='h-7 w-7 p-0'
                                                onClick={() => void saveDetail(entry, detail)}
                                                disabled={savingDetailKey === entry.id + '-' + detail.id}
                                              >
                                                <Check className='size-3.5' />
                                              </Button>
                                              <Button
                                                size='sm'
                                                variant='outline'
                                                className='h-7 w-7 p-0'
                                                onClick={cancelEditDetail}
                                                disabled={savingDetailKey === entry.id + '-' + detail.id}
                                              >
                                                <X className='size-3.5' />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className='ml-auto flex gap-1'>
                                              <Button
                                                size='sm'
                                                variant='outline'
                                                className='h-7 w-7 p-0'
                                                onClick={() => startEditDetail(entry, detail)}
                                              >
                                                <Pencil className='size-3.5' />
                                              </Button>
                                              <Button
                                                size='sm'
                                                variant='destructive'
                                                className='h-7 w-7 p-0'
                                                onClick={() => void removeDetail(entry, detail)}
                                                disabled={savingDetailKey === entry.id + '-' + detail.id}
                                              >
                                                <Trash2 className='size-3.5' />
                                              </Button>
                                            </div>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow className='bg-muted/30'>
                                      <TableCell className='font-semibold text-xs'>Tổng bữa</TableCell>
                                      <TableCell />
                                      <TableCell className='text-right text-sm font-bold'>
                                        {totals.calories.toFixed(0)}
                                      </TableCell>
                                      <TableCell className='text-right text-sm font-semibold'>
                                        {totals.protein.toFixed(1)}
                                      </TableCell>
                                      <TableCell className='text-right text-sm font-semibold'>
                                        {totals.carb.toFixed(1)}
                                      </TableCell>
                                      <TableCell className='text-right text-sm font-semibold'>
                                        {totals.fat.toFixed(1)}
                                      </TableCell>
                                      <TableCell />
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )
                        })}

                        {warning.exceeded.length > 0 && (
                          <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'>
                            Vượt mục tiêu bữa ở: {warning.exceeded.join(', ')}.
                          </div>
                        )}
                        {warning.nearLimit.length > 0 && (
                          <div className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'>
                            Đang gần chạm mục tiêu bữa ở: {warning.nearLimit.join(', ')}.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className='space-y-5'>
            {/* Daily summary */}
            <Card>
              <CardContent className='p-5'>
                <div className='mb-4 flex items-center gap-2'>
                  <CalendarRange className='size-5 text-primary' />
                  <div>
                    <h3 className='font-semibold'>Tổng kết ngày</h3>
                    <p className='text-sm text-muted-foreground'>
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className='mb-4 flex items-center gap-2'>
                  {summary?.so_bua_da_ghi ? (
                    <span className='inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary'>
                      <Check className='size-3.5' />
                      {summary.so_bua_da_ghi} bữa đã ghi
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground'>
                      Chưa ghi bữa nào
                    </span>
                  )}
                </div>
                {(() => {
                  const dayCurrent = {
                    calories: Number(summary?.tong_calories ?? 0),
                    protein: Number(summary?.tong_protein_g ?? 0),
                    carb: Number(summary?.tong_carb_g ?? 0),
                    fat: Number(summary?.tong_fat_g ?? 0),
                  }
                  const dayTarget =
                    dailyPlanTarget.calories > 0 ||
                    dailyPlanTarget.protein > 0 ||
                    dailyPlanTarget.carb > 0 ||
                    dailyPlanTarget.fat > 0
                      ? dailyPlanTarget
                      : {
                          calories: Number(goal?.muc_tieu_calories_ngay ?? 0),
                          protein: Number(goal?.muc_tieu_protein_g ?? 0),
                          carb: Number(goal?.muc_tieu_carb_g ?? 0),
                          fat: Number(goal?.muc_tieu_fat_g ?? 0),
                        }
                  const warning = toMetricWarnings(dayCurrent, dayTarget)
                  if (warning.exceeded.length > 0) {
                    return (
                      <div className='mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'>
                        Vượt mục tiêu ngày ở: {warning.exceeded.join(', ')}.
                      </div>
                    )
                  }
                  if (warning.nearLimit.length > 0) {
                    return (
                      <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'>
                        Đang gần chạm mục tiêu ngày ở: {warning.nearLimit.join(', ')}.
                      </div>
                    )
                  }
                  return null
                })()}
                <div className='space-y-3'>
                  <MacroProgress
                    label='Calories'
                    current={summary?.tong_calories ?? 0}
                    target={
                      dailyPlanTarget.calories > 0
                        ? dailyPlanTarget.calories
                        : Number(goal?.muc_tieu_calories_ngay ?? 0)
                    }
                    unit=' kcal'
                    tone={
                      (summary?.tong_calories ?? 0) > (goal?.muc_tieu_calories_ngay ?? 0)
                        ? 'amber'
                        : 'emerald'
                    }
                  />
                  <MacroProgress
                    label='Protein'
                    current={summary?.tong_protein_g ?? 0}
                    target={
                      dailyPlanTarget.protein > 0
                        ? dailyPlanTarget.protein
                        : Number(goal?.muc_tieu_protein_g ?? 0)
                    }
                    tone='emerald'
                  />
                  <MacroProgress
                    label='Carb'
                    current={summary?.tong_carb_g ?? 0}
                    target={
                      dailyPlanTarget.carb > 0
                        ? dailyPlanTarget.carb
                        : Number(goal?.muc_tieu_carb_g ?? 0)
                    }
                  />
                  <MacroProgress
                    label='Fat'
                    current={summary?.tong_fat_g ?? 0}
                    target={
                      dailyPlanTarget.fat > 0
                        ? dailyPlanTarget.fat
                        : Number(goal?.muc_tieu_fat_g ?? 0)
                    }
                    tone='amber'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Meal target per section */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm'>So với kế hoạch đề ra</CardTitle>
                <CardDescription>Mục tiêu dinh dưỡng theo bữa ăn.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {mealSections.map((section) => {
                  const secTotals = calculateEntriesTotals(section.entries)
                  const secTarget = getMealTarget(section.key)
                  const pct = secTarget.calories > 0
                    ? Math.min(100, Math.round((secTotals.calories / secTarget.calories) * 100))
                    : 0
                  return (
                    <div key={section.key} className='space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className={'text-sm font-medium ' + section.accent.text}>{section.label}</span>
                        <span className='text-xs text-muted-foreground'>
                          {secTotals.calories.toFixed(0)} / {secTarget.calories.toFixed(0)} kcal
                        </span>
                      </div>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                        <div
                          className={'h-full rounded-full transition-all ' + (
                            pct > 100 ? 'bg-red-400' : pct > 80 ? 'bg-amber-400' : 'bg-teal-400'
                          )}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card>
              <CardContent className='p-4'>
                <div className='flex flex-col gap-2'>
                  <Button variant='outline' size='sm' className='justify-start' asChild>
                    <Link href='/nutrition/meal-plans'>
                      <CalendarDays className='mr-2 size-4' />
                      Xem kế hoạch ăn
                    </Link>
                  </Button>
                  <Button variant='outline' size='sm' className='justify-start' asChild>
                    <Link href='/nutrition/foods'>
                      <Plus className='mr-2 size-4' />
                      Tìm thực phẩm
                    </Link>
                  </Button>
                  <Button variant='outline' size='sm' className='justify-start' asChild>
                    <Link href='/nutrition/goals'>
                      <CalendarDays className='mr-2 size-4' />
                      Xem mục tiêu hiện tại
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử bữa ăn</CardTitle>
            <CardDescription>
              Dữ liệu lấy trực tiếp từ API nhật ký ăn uống.
            </CardDescription>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Bữa</TableHead>
                  <TableHead>Số món</TableHead>
                  <TableHead>Calories</TableHead>
                  <TableHead>Macro</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='h-20 text-center text-muted-foreground'
                    >
                      Chưa có nhật ký ăn uống.
                    </TableCell>
                  </TableRow>
                ) : (
                  historyLogs.map((log) => {
                    const calories = log.chi_tiet.reduce(
                      (sum, item) => sum + Number(item.calories ?? 0),
                      0,
                    )
                    const protein = log.chi_tiet.reduce(
                      (sum, item) => sum + Number(item.protein_g ?? 0),
                      0,
                    )
                    const carb = log.chi_tiet.reduce(
                      (sum, item) => sum + Number(item.carb_g ?? 0),
                      0,
                    )
                    const fat = log.chi_tiet.reduce(
                      (sum, item) => sum + Number(item.fat_g ?? 0),
                      0,
                    )
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(`${log.ngay_ghi}T00:00:00`).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>
                            {MEAL_TYPE_LABELS[log.loai_bua_an]}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.chi_tiet.length}</TableCell>
                        <TableCell>{calories.toFixed(0)} kcal</TableCell>
                        <TableCell className='text-muted-foreground'>
                          P {protein.toFixed(1)} / C {carb.toFixed(1)} / F{' '}
                          {fat.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-wrap gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => startEdit(log)}
                            >
                              Sửa
                            </Button>
                            <Button
                              size='sm'
                              variant='destructive'
                              onClick={() => void handleDelete(log.id)}
                              disabled={deletingId === log.id}
                            >
                              {deletingId === log.id ? 'Đang xóa...' : 'Xóa'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
