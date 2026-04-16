'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Edit2,
  Filter,
  Plus,
  RefreshCw,
  Scale,
  TrendingUp,
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import {
  createHealthMetric,
  getHealthMetrics,
  getLatestHealthAssessment,
  updateHealthMetric,
  type HealthAssessmentResponse,
  type HealthMetricItem,
} from '@/services/health/api'

type AssessmentData = HealthAssessmentResponse['data']

// ---- BMI classification ----
function bmiLabel(bmi: number | null): string {
  if (bmi === null) return 'Chưa có'
  if (bmi < 18.5) return 'Thiếu cân'
  if (bmi < 25) return 'Bình thường'
  if (bmi < 30) return 'Thừa cân'
  return 'Béo phì'
}

function bmiColor(bmi: number | null): string {
  if (bmi === null) return 'text-muted-foreground'
  if (bmi < 18.5) return 'text-amber-600'
  if (bmi < 25) return 'text-green-600'
  if (bmi < 30) return 'text-amber-600'
  return 'text-red-600'
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ---- Date range presets ----
type DatePreset = 'all' | '7d' | '30d' | 'custom'

function getDateRange(preset: DatePreset): { from?: string; to?: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  if (preset === '7d') {
    const from = new Date(today)
    from.setDate(today.getDate() - 7)
    return { from: fmt(from), to: fmt(today) }
  }
  if (preset === '30d') {
    const from = new Date(today)
    from.setDate(today.getDate() - 30)
    return { from: fmt(from), to: fmt(today) }
  }
  return {}
}

// ---- Assessment summary row (C06) ----
function AssessmentSummaryRow({ assessment }: { assessment: AssessmentData }) {
  if (!assessment) return null
  return (
    <div className='grid gap-3 sm:grid-cols-5'>
      {[
        { label: 'BMI', value: assessment.bmi?.toFixed(1) ?? '-', hint: bmiLabel(assessment.bmi) },
        { label: 'BMR', value: assessment.bmr ? `${assessment.bmr}` : '-', hint: 'kcal/ngày' },
        { label: 'TDEE', value: assessment.tdee ? `${assessment.tdee}` : '-', hint: 'kcal/ngày' },
        { label: 'Calories KN', value: assessment.calories_khuyen_nghi ? `${assessment.calories_khuyen_nghi}` : '-', hint: 'kcal/ngày' },
        { label: 'Đánh giá', value: bmiLabel(assessment.bmi), hint: assessment.phan_loai_bmi ?? '' },
      ].map((item) => (
        <div key={item.label} className='rounded-lg border p-3 text-center'>
          <p className='text-xs text-muted-foreground'>{item.label}</p>
          <p className={cn('mt-1 text-lg font-bold', bmiColor(item.label === 'Đánh giá' ? (item.value === 'Chưa có' ? null : (item.value === 'Bình thường' ? 22 : item.value === 'Thiếu cân' ? 17 : 27)) : assessment.bmi ?? null))}>
            {item.value}
          </p>
          <p className='mt-0.5 text-xs text-muted-foreground'>{item.hint}</p>
        </div>
      ))}
    </div>
  )
}

// ---- Edit modal (C06: PATCH /me/health-metrics/:id) ----
function EditMetricModal({
  metric,
  onClose,
  onSave,
}: {
  metric: HealthMetricItem
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    doLuc: metric.do_luc ? new Date(metric.do_luc).toISOString().slice(0, 16) : '',
    canNangKg: metric.can_nang_kg?.toString() ?? '',
    chieuCaoCm: metric.chieu_cao_cm?.toString() ?? '',
    vongEoCm: metric.vong_eo_cm?.toString() ?? '',
    vongMongCm: metric.vong_mong_cm?.toString() ?? '',
    huyetApTamThu: metric.huyet_ap_tam_thu?.toString() ?? '',
    huyetApTamTruong: metric.huyet_ap_tam_truong?.toString() ?? '',
    duongHuyet: metric.duong_huyet?.toString() ?? '',
    ghiChu: metric.ghi_chu ?? '',
  })
  const [saving, setSaving] = useState(false)

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      if (form.doLuc) payload.doLuc = new Date(form.doLuc).toISOString()
      if (form.canNangKg) payload.canNangKg = parseFloat(form.canNangKg)
      if (form.chieuCaoCm) payload.chieuCaoCm = parseFloat(form.chieuCaoCm)
      if (form.vongEoCm) payload.vongEoCm = parseFloat(form.vongEoCm)
      if (form.vongMongCm) payload.vongMongCm = parseFloat(form.vongMongCm)
      if (form.huyetApTamThu) payload.huyetApTamThu = parseInt(form.huyetApTamThu)
      if (form.huyetApTamTruong) payload.huyetApTamTruong = parseInt(form.huyetApTamTruong)
      if (form.duongHuyet) payload.duongHuyet = parseFloat(form.duongHuyet)
      payload.ghiChu = form.ghiChu.trim() || undefined

      await updateHealthMetric(metric.id, payload)
      toast.success('Đã cập nhật bản ghi.')
      onSave()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Lỗi khi cập nhật')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Edit2 className='size-4' />
            Chỉnh sửa bản ghi
          </DialogTitle>
        </DialogHeader>

        <div className='grid gap-4 sm:grid-cols-2'>
          {[
            { id: 'doLuc', label: 'Thời điểm đo', type: 'datetime-local', value: form.doLuc },
            { id: 'canNangKg', label: 'Cân nặng (kg)', type: 'number', step: '0.1', value: form.canNangKg },
            { id: 'chieuCaoCm', label: 'Chiều cao (cm)', type: 'number', step: '0.1', value: form.chieuCaoCm },
            { id: 'vongEoCm', label: 'Vòng eo (cm)', type: 'number', step: '0.1', value: form.vongEoCm },
            { id: 'vongMongCm', label: 'Vòng mông (cm)', type: 'number', step: '0.1', value: form.vongMongCm },
            { id: 'huyetApTamThu', label: 'Huyết áp tâm thu (mmHg)', type: 'number', value: form.huyetApTamThu },
            { id: 'huyetApTamTruong', label: 'Huyết áp tâm trương (mmHg)', type: 'number', value: form.huyetApTamTruong },
            { id: 'duongHuyet', label: 'Đường huyết (mmol/L)', type: 'number', step: '0.1', value: form.duongHuyet },
          ].map((field) => (
            <div key={field.id} className='space-y-1.5'>
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                type={field.type}
                step={field.step}
                value={field.value}
                onChange={(e) => setField(field.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='ghiChu-edit'>Ghi chú</Label>
          <Textarea
            id='ghiChu-edit'
            rows={2}
            value={form.ghiChu}
            onChange={(e) => setField('ghiChu', e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><RefreshCw className='mr-1.5 size-4 animate-spin' /> Đang lưu...</> : <><Check className='mr-1.5 size-4' /> Lưu thay đổi</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Input form (C06: POST) ----
type FormState = {
  doLuc: string
  canNangKg: string
  chieuCaoCm: string
  vongEoCm: string
  vongMongCm: string
  huyetApTamThu: string
  huyetApTamTruong: string
  duongHuyet: string
  ghiChu: string
}

function defaultForm(): FormState {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return {
    doLuc: now.toISOString().slice(0, 16),
    canNangKg: '',
    chieuCaoCm: '',
    vongEoCm: '',
    vongMongCm: '',
    huyetApTamThu: '',
    huyetApTamTruong: '',
    duongHuyet: '',
    ghiChu: '',
  }
}

function InputForm({
  onSuccess,
  latestMetric,
}: {
  onSuccess: () => void
  latestMetric?: HealthMetricItem
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (latestMetric) {
      return {
        doLuc: new Date().toISOString().slice(0, 16),
        canNangKg: latestMetric.can_nang_kg?.toString() ?? '',
        chieuCaoCm: latestMetric.chieu_cao_cm?.toString() ?? '',
        vongEoCm: '',
        vongMongCm: '',
        huyetApTamThu: '',
        huyetApTamTruong: '',
        duongHuyet: '',
        ghiChu: '',
      }
    }
    return defaultForm()
  })
  const [saving, setSaving] = useState(false)

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const hasAtLeastOne = ['canNangKg', 'chieuCaoCm', 'vongEoCm', 'vongMongCm', 'huyetApTamThu', 'huyetApTamTruong', 'duongHuyet']
      .some((k) => form[k as keyof FormState] !== '')
    if (!hasAtLeastOne) {
      toast.error('Cần nhập ít nhất một chỉ số sức khỏe để lưu.')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      if (form.doLuc) payload.doLuc = new Date(form.doLuc).toISOString()
      if (form.canNangKg) payload.canNangKg = parseFloat(form.canNangKg)
      if (form.chieuCaoCm) payload.chieuCaoCm = parseFloat(form.chieuCaoCm)
      if (form.vongEoCm) payload.vongEoCm = parseFloat(form.vongEoCm)
      if (form.vongMongCm) payload.vongMongCm = parseFloat(form.vongMongCm)
      if (form.huyetApTamThu) payload.huyetApTamThu = parseInt(form.huyetApTamThu)
      if (form.huyetApTamTruong) payload.huyetApTamTruong = parseInt(form.huyetApTamTruong)
      if (form.duongHuyet) payload.duongHuyet = parseFloat(form.duongHuyet)
      if (form.ghiChu.trim()) payload.ghiChu = form.ghiChu.trim()

      await createHealthMetric(payload)
      toast.success('Đã lưu chỉ số. Đánh giá sức khỏe sẽ được cập nhật tự động.')
      setForm(defaultForm())
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Lỗi khi lưu chỉ số')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[
          { id: 'doLuc' as const, label: 'Thời điểm đo', type: 'datetime-local' },
          { id: 'canNangKg' as const, label: 'Cân nặng (kg)', type: 'number', step: '0.1', placeholder: 'VD: 65.5' },
          { id: 'chieuCaoCm' as const, label: 'Chiều cao (cm)', type: 'number', step: '0.1', placeholder: 'VD: 170' },
          { id: 'vongEoCm' as const, label: 'Vòng eo (cm)', type: 'number', step: '0.1', placeholder: 'VD: 80' },
          { id: 'vongMongCm' as const, label: 'Vòng mông (cm)', type: 'number', step: '0.1', placeholder: 'VD: 95' },
          { id: 'huyetApTamThu' as const, label: 'Huyết áp tâm thu (mmHg)', type: 'number', placeholder: 'VD: 120' },
          { id: 'huyetApTamTruong' as const, label: 'Huyết áp tâm trương (mmHg)', type: 'number', placeholder: 'VD: 80' },
          { id: 'duongHuyet' as const, label: 'Đường huyết (mmol/L)', type: 'number', step: '0.1', placeholder: 'VD: 5.4' },
        ].map((field) => (
          <div key={field.id} className='space-y-1.5'>
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              type={field.type}
              step={field.step}
              placeholder={field.placeholder}
              value={form[field.id]}
              onChange={(e) => setField(field.id, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='ghiChu'>Ghi chú</Label>
        <Textarea
          id='ghiChu'
          rows={2}
          placeholder='VD: Đo sau khi thức dậy, chưa ăn sáng...'
          value={form.ghiChu}
          onChange={(e) => setField('ghiChu', e.target.value)}
        />
      </div>
      <div className='flex flex-wrap gap-3'>
        <Button type='submit' disabled={saving}>
          {saving
            ? <><RefreshCw className='mr-1.5 size-4 animate-spin' /> Đang lưu...</>
            : <><Check className='mr-1.5 size-4' /> Lưu lần đo</>
          }
        </Button>
        <Button type='button' variant='outline' onClick={() => setForm(defaultForm())}>
          <X className='mr-1.5 size-4' /> Xóa form
        </Button>
      </div>
    </form>
  )
}

// ---- History table (C06) ----
function HistoryTable({
  metrics,
  total,
  page,
  loading,
  onPageChange,
  onRefresh,
  onEdit,
}: {
  metrics: HealthMetricItem[]
  total: number
  page: number
  loading: boolean
  onPageChange: (p: number) => void
  onRefresh: () => void
  onEdit: (m: HealthMetricItem) => void
}) {
  const limit = 10
  const totalPages = Math.ceil(total / limit)

  if (!loading && metrics.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
        <ClipboardList className='size-12 text-muted-foreground' />
        <p className='font-medium'>Chưa có dữ liệu chỉ số sức khỏe</p>
        <p className='text-sm text-muted-foreground'>Nhập lần đo đầu tiên để bắt đầu theo dõi.</p>
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-10' />
              <TableHead>Ngày đo</TableHead>
              <TableHead>Cân nặng</TableHead>
              <TableHead>Chiều cao</TableHead>
              <TableHead>Huyết áp</TableHead>
              <TableHead>Đường huyết</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className='text-right' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}><div className='h-4 w-16 animate-pulse rounded bg-muted' /></TableCell>
                    ))}
                  </TableRow>
                ))
              : metrics.map((m) => <MetricRow key={m.id} metric={m} onEdit={onEdit} />)
            }
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-3'>
          <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Trang trước
          </Button>
          <span className='text-sm text-muted-foreground'>
            Trang {page} / {totalPages} ({total} bản ghi)
          </span>
          <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Trang sau
          </Button>
        </div>
      )}
    </div>
  )
}

function MetricRow({ metric, onEdit }: { metric: HealthMetricItem; onEdit: (m: HealthMetricItem) => void }) {
  const [expanded, setExpanded] = useState(false)
  const dateStr = new Date(metric.do_luc).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const timeStr = new Date(metric.do_luc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <TableRow className='cursor-pointer' onClick={() => setExpanded((v) => !v)}>
        <TableCell className='text-center'>
          {expanded ? <ChevronUp className='inline size-4' /> : <ChevronDown className='inline size-4' />}
        </TableCell>
        <TableCell>
          <div className='flex items-center gap-1.5'>
            <Calendar className='size-3.5 text-muted-foreground' />
            <span className='font-medium'>{dateStr}</span>
          </div>
          <p className='text-xs text-muted-foreground'>{timeStr}</p>
        </TableCell>
        <TableCell>
          {metric.can_nang_kg ? (
            <span className='font-semibold'>{metric.can_nang_kg} kg</span>
          ) : <span className='text-muted-foreground'>-</span>}
        </TableCell>
        <TableCell>{metric.chieu_cao_cm ? `${metric.chieu_cao_cm} cm` : '-'}</TableCell>
        <TableCell>
          {metric.huyet_ap_tam_thu && metric.huyet_ap_tam_truong
            ? `${metric.huyet_ap_tam_thu}/${metric.huyet_ap_tam_truong}`
            : '-'}
        </TableCell>
        <TableCell>{metric.duong_huyet ?? '-'}</TableCell>
        <TableCell className='max-w-[120px] truncate text-muted-foreground'>
          {metric.ghi_chu || '-'}
        </TableCell>
        <TableCell className='text-right'>
          <Button variant='ghost' size='sm' onClick={(e) => { e.stopPropagation(); onEdit(metric) }}>
            <Edit2 className='mr-1 size-3.5' />
            Sửa
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className='hover:bg-transparent'>
          <TableCell colSpan={8} className='bg-muted/10 px-4 py-4'>
            <div className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-6'>
              {[
                { label: 'Cân nặng', value: metric.can_nang_kg ? `${metric.can_nang_kg} kg` : '-' },
                { label: 'Chiều cao', value: metric.chieu_cao_cm ? `${metric.chieu_cao_cm} cm` : '-' },
                { label: 'Vòng eo', value: metric.vong_eo_cm ? `${metric.vong_eo_cm} cm` : '-' },
                { label: 'Vòng mông', value: metric.vong_mong_cm ? `${metric.vong_mong_cm} cm` : '-' },
                { label: 'Huyết áp', value: metric.huyet_ap_tam_thu && metric.huyet_ap_tam_truong ? `${metric.huyet_ap_tam_thu}/${metric.huyet_ap_tam_truong} mmHg` : '-' },
                { label: 'Đường huyết', value: metric.duong_huyet ? `${metric.duong_huyet} mmol/L` : '-' },
                { label: 'Ngày tạo', value: new Date(metric.tao_luc).toLocaleDateString('vi-VN') },
                { label: 'Cập nhật lần cuối', value: new Date(metric.cap_nhat_luc).toLocaleDateString('vi-VN') },
                { label: 'Ghi chú', value: metric.ghi_chu || '-' },
              ].map((item) => (
                <div key={item.label} className='rounded-lg border bg-background p-2'>
                  <p className='text-xs text-muted-foreground'>{item.label}</p>
                  <p className='mt-0.5 font-medium'>{item.value}</p>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// ---- Main component ----
export function NutritionUserHealthMetrics() {
  const [metrics, setMetrics] = useState<HealthMetricItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [assessment, setAssessment] = useState<AssessmentData>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [editingMetric, setEditingMetric] = useState<HealthMetricItem | null>(null)

  const fetchData = useCallback(async (p: number, preset: DatePreset) => {
    setLoading(true)
    try {
      const { from, to } = getDateRange(preset)
      const [metricsRes, assessRes] = await Promise.all([
        getHealthMetrics({ page: p, limit: 10, from, to }),
        getLatestHealthAssessment(),
      ])
      setMetrics(metricsRes.data.items)
      setTotal(metricsRes.data.pagination.total)
      setAssessment(assessRes.data)
    } catch {
      toast.error('Không thể tải dữ liệu chỉ số sức khỏe.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(page, datePreset) }, [fetchData, page, datePreset])

  async function handleRefresh() {
    await fetchData(1, datePreset)
    setPage(1)
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        {/* Heading */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Chỉ số sức khỏe</h1>
            <p className='text-sm text-muted-foreground'>
              Nhập và theo dõi các chỉ số. Mỗi lần lưu → đánh giá sức khỏe được cập nhật tự động.
            </p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? <><X className='mr-1.5 size-4' /> Đóng form</> : <><Plus className='mr-1.5 size-4' /> Nhập lần đo mới</>}
          </Button>
        </div>

        {/* Assessment summary (C06: tu dong cap nhat sau moi lan luu) */}
        {assessment && (
          <Card className='border-primary/20'>
            <CardHeader className='pb-3'>
              <div className='flex items-center gap-2'>
                <Activity className='size-4 text-primary' />
                <CardTitle className='text-sm'>Đánh giá sức khỏe (tự động cập nhật)</CardTitle>
              </div>
              <CardDescription>
                TDEE/BMR/Calories KN được tính lại mỗi khi bạn nhập chỉ số mới.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssessmentSummaryRow assessment={assessment} />
            </CardContent>
          </Card>
        )}

        {/* Input form (C06: POST /me/health-metrics) */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Nhập lần đo mới</CardTitle>
              <CardDescription>
                Hệ thống tự động tính BMI, BMR, TDEE và cập nhật đánh giá sức khỏe sau khi lưu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InputForm onSuccess={() => handleRefresh()} latestMetric={metrics[0]} />
            </CardContent>
          </Card>
        )}

        {/* History + filter */}
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <CardTitle className='text-base'>Lịch sử đo</CardTitle>
                <CardDescription>
                  {loading ? 'Đang tải...' : `${total} bản ghi`}
                  {total > 0 && ' · Click dòng để xem chi tiết'}
                </CardDescription>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                {/* Date preset filter (C06: xu hướng 7/30 ngày) */}
                <div className='flex rounded-lg border p-0.5'>
                  {([
                    { value: 'all', label: 'Tất cả' },
                    { value: '7d', label: '7 ngày' },
                    { value: '30d', label: '30 ngày' },
                  ] as { value: DatePreset; label: string }[]).map((opt) => (
                    <Button
                      key={opt.value}
                      size='sm'
                      variant={datePreset === opt.value ? 'default' : 'ghost'}
                      className='h-7 text-xs'
                      onClick={() => { setDatePreset(opt.value); setPage(1) }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                <Button variant='outline' size='sm' onClick={handleRefresh}>
                  <RefreshCw className={cn('mr-1.5 size-3.5', loading && 'animate-spin')} />
                  Làm mới
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <HistoryTable
              metrics={metrics}
              total={total}
              page={page}
              loading={loading}
              onPageChange={(p) => setPage(p)}
              onRefresh={handleRefresh}
              onEdit={(m) => setEditingMetric(m)}
            />
          </CardContent>
        </Card>
      </Main>

      {/* Edit modal */}
      {editingMetric && (
        <EditMetricModal
          metric={editingMetric}
          onClose={() => setEditingMetric(null)}
          onSave={handleRefresh}
        />
      )}
    </>
  )
}
