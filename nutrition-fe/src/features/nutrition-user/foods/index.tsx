'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Apple,
  BarChart3,
  ChevronRight,
  Filter,
  RefreshCw,
  Salad,
  Search,
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
  DialogDescription,
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
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import {
  getFoodDetail,
  getFoods,
  type FoodGroup,
  type FoodItem,
} from '@/services/foods/api'
import {
  createMealLog,
  MEAL_TYPE_LABELS,
  type MealType,
} from '@/services/meals/api'

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ---- Compare Foods Modal (C08) ----
function CompareModal({ foods, onClose }: { foods: FoodItem[]; onClose: () => void }) {
  if (foods.length < 2) return null

  const nutrients = ['calories_100g', 'protein_100g', 'carb_100g', 'fat_100g', 'chat_xo_100g', 'duong_100g', 'natri_100g'] as const
  const labels: Record<string, string> = {
    calories_100g: 'Calories', protein_100g: 'Protein', carb_100g: 'Carb',
    fat_100g: 'Fat', chat_xo_100g: 'Chất xơ', duong_100g: 'Đường', natri_100g: 'Natri',
  }
  const units: Record<string, string> = {
    calories_100g: 'kcal', protein_100g: 'g', carb_100g: 'g',
    fat_100g: 'g', chat_xo_100g: 'g', duong_100g: 'g', natri_100g: 'mg',
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <BarChart3 className='size-4' />
            So sánh thực phẩm
          </DialogTitle>
          <DialogDescription>
            So sánh giá trị dinh dưỡng (trên 100g) giữa các thực phẩm đã chọn.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          {/* Food names */}
          <div className='grid gap-2' style={{ gridTemplateColumns: `120px repeat(${foods.length}, 1fr)` }}>
            <div />
            {foods.map((f) => (
              <div key={f.id} className='rounded-lg border bg-primary/5 p-2 text-center'>
                <p className='text-xs font-medium leading-tight'>{f.ten}</p>
              </div>
            ))}
          </div>

          {/* Nutrient rows */}
          {nutrients.map((nut) => {
            const vals = foods.map((f) => f[nut])
            const min = Math.min(...vals)
            const max = Math.max(...vals)
            return (
              <div key={nut} className='grid gap-2' style={{ gridTemplateColumns: `120px repeat(${foods.length}, 1fr)` }}>
                <div className='flex items-center text-sm text-muted-foreground'>
                  {labels[nut]} <span className='ml-1 text-xs'>({units[nut]})</span>
                </div>
                {vals.map((val, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-center rounded-lg border p-2 text-center text-sm font-semibold',
                      val === max && 'border-red-300 bg-red-50 dark:bg-red-950/30',
                      val === min && vals.filter((v) => v === min).length === 1 ? 'border-green-300 bg-green-50 dark:bg-green-950/30' : '',
                    )}
                  >
                    {val}
                    {val === max && vals.filter((v) => v === max).length === 1 && (
                      <span className='ml-1 text-xs text-red-500'>↘</span>
                    )}
                  </div>
                ))}
              </div>
            )
          })}

          {/* Serving */}
          <div className='grid gap-2' style={{ gridTemplateColumns: `120px repeat(${foods.length}, 1fr)` }}>
            <div className='flex items-center text-sm text-muted-foreground'>Khẩu phần</div>
            {foods.map((f) => (
              <div key={f.id} className='rounded-lg border p-2 text-center text-xs'>
                {f.khau_phan_tham_chieu > 0 && f.don_vi_khau_phan
                  ? `${f.khau_phan_tham_chieu} ${f.don_vi_khau_phan}`
                  : '-'}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Add to Meal Log Modal (C08) ----
function AddToMealLogModal({
  food,
  onClose,
  onSuccess,
}: {
  food: FoodItem
  onClose: () => void
  onSuccess: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [mealType, setMealType] = useState<MealType>('bua_sang')
  const [servingQty, setServingQty] = useState('1')
  const [servingUnit, setServingUnit] = useState(food.don_vi_khau_phan ?? 'g')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    const qty = parseFloat(servingQty)
    if (!qty || qty <= 0) {
      toast.error('Số lượng phải lớn hơn 0')
      return
    }

    setSaving(true)
    try {
      await createMealLog({
        ngayGhi: today,
        loaiBuaAn: mealType,
        ghiChu: note || undefined,
        chiTiet: [{
          loaiNguon: 'thuc_pham',
          thucPhamId: food.id,
          soLuong: qty,
          donVi: servingUnit,
        }],
      })
      toast.success(`Đã thêm "${food.ten}" vào ${MEAL_TYPE_LABELS[mealType]}`)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Lỗi khi thêm vào bữa ăn')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Thêm vào bữa ăn</DialogTitle>
          <DialogDescription>
            Thêm <strong>{food.ten}</strong> vào nhật ký hôm nay.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='mealType'>Bữa ăn</Label>
              <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                <SelectTrigger id='mealType'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1.5'>
              <Label>Khẩu phần</Label>
              <div className='flex gap-2'>
                <Input
                  type='number'
                  step='0.1'
                  min='0.1'
                  value={servingQty}
                  onChange={(e) => setServingQty(e.target.value)}
                  className='w-24'
                />
                <Select value={servingUnit} onValueChange={setServingUnit}>
                  <SelectTrigger className='flex-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='g'>gam (g)</SelectItem>
                    <SelectItem value='ml'>ml</SelectItem>
                    <SelectItem value='cup'>chén (cup)</SelectItem>
                    <SelectItem value='tbsp'>muỗng canh</SelectItem>
                    <SelectItem value='tsp'>muỗng cà phê</SelectItem>
                    <SelectItem value='quả'>quả</SelectItem>
                    <SelectItem value='lát'>lát</SelectItem>
                    <SelectItem value='miếng'>miếng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Nutritional preview */}
          <div className='rounded-lg border bg-muted/50 p-3 text-xs'>
            <p className='mb-2 font-medium'>Giá trị dinh dưỡng (ước tính)</p>
            <div className='grid grid-cols-4 gap-2'>
              {[
                { label: 'Calories', value: ((food.calories_100g / 100) * parseFloat(servingQty || '0') * 10).toFixed(0) },
                { label: 'Protein', value: ((food.protein_100g / 100) * parseFloat(servingQty || '0') * 10).toFixed(1) },
                { label: 'Carb', value: ((food.carb_100g / 100) * parseFloat(servingQty || '0') * 10).toFixed(1) },
                { label: 'Fat', value: ((food.fat_100g / 100) * parseFloat(servingQty || '0') * 10).toFixed(1) },
              ].map((item) => (
                <div key={item.label} className='text-center'>
                  <p className='text-muted-foreground'>{item.label}</p>
                  <p className='font-semibold'>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='note'>Ghi chú (tùy chọn)</Label>
            <Input
              id='note'
              placeholder='VD: Ăn vào buổi sáng, không ăn vỏ...'
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>Hủy</Button>
          <Button onClick={handleAdd} disabled={saving}>
            {saving
              ? <><RefreshCw className='mr-1.5 size-4 animate-spin' /> Đang thêm...</>
              : <>Thêm vào {MEAL_TYPE_LABELS[mealType]}</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Food detail panel ----
function FoodDetailPanel({ food, onAddToMeal, onCompare, onClose }: {
  food: FoodItem
  onAddToMeal: () => void
  onCompare: () => void
  onClose: () => void
}) {
  return (
    <Card className='sticky top-4'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <CardTitle className='text-lg leading-snug'>{food.ten}</CardTitle>
            <div className='mt-1.5 flex flex-wrap items-center gap-2'>
              {food.nhom_thuc_pham && (
                <Badge variant='outline'>{food.nhom_thuc_pham.ten}</Badge>
              )}
              {food.da_xac_minh ? (
                <Badge variant='secondary' className='text-xs gap-1'>
                  <span className='inline-block h-1.5 w-1.5 rounded-full bg-green-500' />
                  Đã xác minh
                </Badge>
              ) : (
                <Badge variant='outline' className='text-xs'>Nguồn nội bộ</Badge>
              )}
            </div>
          </div>
          <Button variant='ghost' size='icon' onClick={onClose} className='shrink-0'>
            <X className='size-4' />
          </Button>
        </div>
        {food.mo_ta && <CardDescription className='mt-2'>{food.mo_ta}</CardDescription>}
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Macro per 100g */}
        <div>
          <p className='mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Din dưỡng / 100g
          </p>
          <div className='grid grid-cols-2 gap-2'>
            {[
              { label: 'Calories', value: food.calories_100g, unit: 'kcal' },
              { label: 'Protein', value: food.protein_100g, unit: 'g' },
              { label: 'Carbohydrate', value: food.carb_100g, unit: 'g' },
              { label: 'Chất béo', value: food.fat_100g, unit: 'g' },
              { label: 'Chất xơ', value: food.chat_xo_100g, unit: 'g' },
              { label: 'Đường', value: food.duong_100g, unit: 'g' },
              { label: 'Natri', value: food.natri_100g, unit: 'mg' },
            ].map((item) => (
              <div key={item.label} className='rounded-lg border px-3 py-2'>
                <p className='text-xs text-muted-foreground'>{item.label}</p>
                <p className='mt-0.5 text-base font-semibold'>
                  {item.value}<span className='text-sm font-normal text-muted-foreground'>{item.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Serving info */}
        {food.khau_phan_tham_chieu > 0 && food.don_vi_khau_phan && (
          <div className='rounded-lg bg-muted/50 px-3 py-2 text-sm'>
            <span className='text-muted-foreground'>Khẩu phần tham chiếu: </span>
            <span className='font-medium'>
              {food.khau_phan_tham_chieu} {food.don_vi_khau_phan}
            </span>
          </div>
        )}

        {/* Source */}
        <div className='text-xs text-muted-foreground'>
          {food.ten_nguon && <p>Nguồn: {food.ten_nguon}</p>}
          <p>Cập nhật: {new Date(food.cap_nhat_luc).toLocaleDateString('vi-VN')}</p>
        </div>

        <Separator />

        {/* Action buttons */}
        <div className='flex flex-col gap-2'>
          <Button className='w-full' onClick={onAddToMeal}>
            Thêm vào bữa ăn hôm nay
          </Button>
          <div className='flex gap-2'>
            <Button variant='outline' className='flex-1' onClick={onCompare}>
              <BarChart3 className='mr-1.5 size-3.5' />
              So sánh
            </Button>
            <Button variant='outline' className='flex-1'>
              Thêm vào kế hoạch ăn
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Food card ----
function FoodCard({
  food,
  isSelected,
  isCompareSelected,
  onSelect,
  onToggleCompare,
}: {
  food: FoodItem
  isSelected: boolean
  isCompareSelected: boolean
  onSelect: () => void
  onToggleCompare: () => void
}) {
  return (
    <div
      className={cn(
        'group cursor-pointer rounded-xl border transition-all',
        isSelected ? 'border-primary bg-primary/[0.02]' : 'hover:border-primary/40',
      )}
      onClick={onSelect}
    >
      <div className='flex items-center gap-3 p-4'>
        {/* Food icon */}
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10'>
          <Apple className='size-5 text-primary' />
        </div>

        {/* Info */}
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='font-medium leading-tight'>{food.ten}</p>
            {food.da_xac_minh && (
              <span className='inline-block h-1.5 w-1.5 rounded-full bg-green-500' />
            )}
          </div>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            {food.nhom_thuc_pham?.ten ?? 'Không phân nhóm'}
            {food.don_vi_khau_phan && food.khau_phan_tham_chieu > 0
              ? ` · ${food.khau_phan_tham_chieu}${food.don_vi_khau_phan}`
              : ''}
          </p>
        </div>

        {/* Macro summary */}
        <div className='hidden shrink-0 grid-cols-4 gap-x-3 gap-y-0.5 text-right text-sm sm:grid'>
          <span className='col-span-1 font-semibold'>{food.calories_100g} kcal</span>
          <span className='col-span-1 text-muted-foreground'>P {food.protein_100g}g</span>
          <span className='col-span-1 text-muted-foreground'>C {food.carb_100g}g</span>
          <span className='col-span-1 text-muted-foreground'>F {food.fat_100g}g</span>
        </div>

        {/* Compare checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCompare() }}
          className={cn(
            'shrink-0 rounded border p-1 transition-colors',
            isCompareSelected
              ? 'border-primary bg-primary text-white'
              : 'border-muted-foreground/30 text-transparent hover:border-primary/60',
          )}
          title='Chọn để so sánh'
        >
          <BarChart3 className='size-3.5' />
        </button>
      </div>
    </div>
  )
}

// ---- Main component ----
export function NutritionUserFoods() {
  const [items, setItems] = useState<FoodItem[]>([])
  const [groups, setGroups] = useState<FoodGroup[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(15)

  const [keyword, setKeyword] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [loading, setLoading] = useState(true)

  // Compare state
  const [compareSelected, setCompareSelected] = useState<number[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)

  // Meal log modal
  const [showMealModal, setShowMealModal] = useState(false)
  const [mealModalFood, setMealModalFood] = useState<FoodItem | null>(null)

  const fetchItems = useCallback(async (p: number, grp?: string, kw?: string) => {
    setLoading(true)
    try {
      const res = await getFoods({
        page: p, limit,
        nhomThucPhamId: grp && grp !== 'all' ? parseInt(grp) : undefined,
        keyword: kw || undefined,
      })
      setItems(res.data.items)
      setTotal(res.data.pagination.total)
      setGroups(res.data.filters.nhom_thuc_pham)
    } catch {
      toast.error('Không thể tải danh sách thực phẩm')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    const timer = setTimeout(() => { fetchItems(page, selectedGroup, keyword) }, 300)
    return () => clearTimeout(timer)
  }, [page, selectedGroup, keyword, fetchItems])

  function handleSelectFood(food: FoodItem) {
    setSelectedFood(food)
    setMealModalFood(food)
  }

  function handleToggleCompare(foodId: number) {
    setCompareSelected((prev) => {
      if (prev.includes(foodId)) return prev.filter((id) => id !== foodId)
      if (prev.length >= 5) {
        toast.error('Tối đa 5 thực phẩm để so sánh')
        return prev
      }
      return [...prev, foodId]
    })
  }

  const compareFoods = items.filter((f) => compareSelected.includes(f.id))
  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        {/* Heading */}
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Thực phẩm</h1>
          <p className='text-sm text-muted-foreground'>
            Tra cứu giá trị dinh dưỡng của thực phẩm để ghi bữa ăn hoặc tham khảo.
          </p>
        </div>

        <div className='grid gap-6 xl:grid-cols-[1fr_380px]'>
          {/* Left: search + list */}
          <div className='space-y-4'>
            {/* Search + filter bar */}
            <div className='flex flex-wrap items-center gap-3'>
              <div className='relative min-w-0 flex-1'>
                <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  className='pl-9'
                  placeholder='Tìm theo tên thực phẩm...'
                  value={keyword}
                  onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
                />
              </div>

              <Select value={selectedGroup} onValueChange={(v) => { setSelectedGroup(v); setPage(1) }}>
                <SelectTrigger className='w-48'>
                  <Filter className='mr-1.5 size-3.5' />
                  <SelectValue placeholder='Nhóm thực phẩm' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả nhóm</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.ten}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant='outline' size='icon' onClick={() => fetchItems(page, selectedGroup, keyword)} title='Làm mới'>
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
              </Button>

              {compareSelected.length >= 2 && (
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => setShowCompareModal(true)}
                >
                  <BarChart3 className='mr-1.5 size-3.5' />
                  So sánh ({compareSelected.length})
                </Button>
              )}
            </div>

            {/* Info bar */}
            <div className='flex items-center justify-between text-sm text-muted-foreground'>
              <span>{loading ? 'Đang tải...' : `${total} kết quả`}</span>
              {compareSelected.length > 0 && (
                <span className='text-xs'>
                  Đã chọn {compareSelected.length}/5 để so sánh
                </span>
              )}
            </div>

            {/* Food list */}
            {loading ? (
              <div className='flex h-64 items-center justify-center'>
                <RefreshCw className='size-8 animate-spin text-muted-foreground' />
              </div>
            ) : items.length === 0 ? (
              <Card>
                <CardContent className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
                  <Salad className='size-12 text-muted-foreground' />
                  <div>
                    <p className='font-medium'>Không tìm thấy thực phẩm</p>
                    <p className='mt-1 text-sm text-muted-foreground'>Thử từ khóa khác hoặc bỏ bộ lọc.</p>
                  </div>
                  <Button
                    variant='outline'
                    onClick={() => { setKeyword(''); setSelectedGroup('all'); setPage(1) }}
                  >
                    Xóa bộ lọc
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className='space-y-2'>
                {items.map((food) => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    isSelected={selectedFood?.id === food.id}
                    isCompareSelected={compareSelected.includes(food.id)}
                    onSelect={() => { handleSelectFood(food); setMealModalFood(food) }}
                    onToggleCompare={() => handleToggleCompare(food.id)}
                  />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='flex items-center justify-center gap-3 pt-2'>
                    <Button variant='outline' size='sm' disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                      Trang trước
                    </Button>
                    <span className='text-sm text-muted-foreground'>{page} / {totalPages}</span>
                    <Button variant='outline' size='sm' disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                      Trang sau
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: detail panel */}
          <div>
            {selectedFood ? (
              <FoodDetailPanel
                food={selectedFood}
                onAddToMeal={() => setShowMealModal(true)}
                onCompare={() => {
                  if (!compareSelected.includes(selectedFood.id)) handleToggleCompare(selectedFood.id)
                  setShowCompareModal(true)
                }}
                onClose={() => setSelectedFood(null)}
              />
            ) : (
              <Card>
                <CardContent className='flex h-64 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground'>
                  <Apple className='size-10' />
                  <p>Click vào thực phẩm để xem chi tiết dinh dưỡng</p>
                  <p className='text-xs'>Chọn từ 2-5 thực phẩm để so sánh</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Main>

      {/* Compare modal */}
      {showCompareModal && (
        <CompareModal
          foods={compareFoods.length >= 2 ? compareFoods : items.filter((f) => compareSelected.includes(f.id))}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {/* Add to meal log modal */}
      {showMealModal && mealModalFood && (
        <AddToMealLogModal
          food={mealModalFood}
          onClose={() => { setShowMealModal(false); setMealModalFood(null) }}
          onSuccess={() => { setShowMealModal(false); setMealModalFood(null) }}
        />
      )}
    </>
  )
}
