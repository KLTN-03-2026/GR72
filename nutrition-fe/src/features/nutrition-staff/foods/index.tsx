'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Main } from '@/components/layout/main'
import { DetailCard } from '@/features/nutrition/components/detail-card'
import { PaginationControls } from '@/features/nutrition/components/pagination-controls'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { useNutritionStore } from '@/stores/nutrition-store'

const PAGE_SIZE = 4

export function NutritionStaffFoods() {
  const foods = useNutritionStore((state) => state.foods)
  const saveFood = useNutritionStore((state) => state.saveFood)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState<'name' | 'calories'>('name')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(foods[0]?.id ?? '')

  const filteredFoods = useMemo(() => {
    let result = foods.filter((food) => {
      const matchesQuery =
        food.name.toLowerCase().includes(query.toLowerCase()) ||
        food.group.toLowerCase().includes(query.toLowerCase()) ||
        food.source.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === 'all' || food.status === statusFilter
      return matchesQuery && matchesStatus
    })

    result = result.sort((a, b) =>
      sortKey === 'calories' ? b.calories - a.calories : a.name.localeCompare(b.name)
    )

    return result
  }, [foods, query, sortKey, statusFilter])

  const totalPages = Math.max(Math.ceil(filteredFoods.length / PAGE_SIZE), 1)
  const paginatedFoods = filteredFoods.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selectedFood =
    filteredFoods.find((food) => food.id === selectedId) ??
    paginatedFoods[0] ??
    foods[0]

  function handleVerifyFood() {
    if (!selectedFood) return
    saveFood({ ...selectedFood, status: 'Đã xác minh', source: 'Nội bộ' })
    toast.success(`Đã xác minh ${selectedFood.name}.`)
  }

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Quản lý thực phẩm'
          description='Catalog trung tâm dùng cho user, recipes, meal templates và nhật ký ăn uống.'
          actions={[{ label: 'Thêm thực phẩm' }, { label: 'Import dữ liệu' }]}
        />

        <div className='grid gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Danh sách thực phẩm</CardTitle>
              <CardDescription>
                Staff có thể lọc, cập nhật trạng thái xác minh và chuẩn hóa dữ liệu dinh dưỡng tại đây.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-3 md:grid-cols-[1fr_180px_180px]'>
                <Input
                  placeholder='Tìm theo tên thực phẩm, nhóm hoặc nguồn dữ liệu...'
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                  }}
                />
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Trạng thái' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                    <SelectItem value='Đã xác minh'>Đã xác minh</SelectItem>
                    <SelectItem value='Từ nguồn ngoài'>Từ nguồn ngoài</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortKey} onValueChange={(value) => setSortKey(value as typeof sortKey)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Sắp xếp' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='name'>Theo tên</SelectItem>
                    <SelectItem value='calories'>Theo calories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='md:hidden space-y-3'>
                {paginatedFoods.map((food) => (
                  <button
                    key={food.id}
                    className='w-full text-left'
                    onClick={() => setSelectedId(food.id)}
                    type='button'
                  >
                    <Card className={food.id === selectedFood?.id ? 'border-primary/40' : ''}>
                      <CardContent className='space-y-2 p-4'>
                        <div className='flex items-center justify-between gap-3'>
                          <p className='font-medium'>{food.name}</p>
                          <Badge variant={food.status === 'Đã xác minh' ? 'secondary' : 'outline'}>
                            {food.status}
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground'>{food.group}</p>
                        <p className='text-sm text-muted-foreground'>{food.calories} kcal / {food.serving}</p>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>

              <div className='hidden md:block overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên thực phẩm</TableHead>
                      <TableHead>Nhóm</TableHead>
                      <TableHead>Calories</TableHead>
                      <TableHead>Nguồn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFoods.map((food) => (
                      <TableRow
                        key={food.id}
                        className='cursor-pointer'
                        onClick={() => setSelectedId(food.id)}
                      >
                        <TableCell className='font-medium'>{food.name}</TableCell>
                        <TableCell>{food.group}</TableCell>
                        <TableCell>{food.calories} kcal / {food.serving}</TableCell>
                        <TableCell>{food.source}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              food.status === 'Đã xác minh' ? 'secondary' : 'outline'
                            }
                          >
                            {food.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </CardContent>
          </Card>

          {selectedFood ? (
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết và chuẩn hóa dữ liệu</CardTitle>
                <CardDescription>
                  Khu vực staff dùng để rà giá trị dinh dưỡng trước khi lưu chính thức.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-xl font-semibold'>{selectedFood.name}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Nhóm {selectedFood.group} • nguồn {selectedFood.source}
                  </p>
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <DetailCard label='Khẩu phần' value={selectedFood.serving} />
                  <DetailCard label='Calories' value={`${selectedFood.calories} kcal`} />
                  <DetailCard label='Protein' value={`${selectedFood.protein} g`} />
                  <DetailCard label='Carb' value={`${selectedFood.carbs} g`} />
                  <DetailCard label='Fat' value={`${selectedFood.fat} g`} />
                  <DetailCard label='Trạng thái' value={selectedFood.status} />
                </div>
                <div className='flex flex-wrap gap-3'>
                  <Button onClick={() => toast.success('Đã lưu chỉnh sửa thực phẩm.')}>
                    Lưu chỉnh sửa
                  </Button>
                  <Button variant='outline' onClick={handleVerifyFood}>
                    Gửi duyệt / xác minh
                  </Button>
                  <Button variant='outline' onClick={() => toast.success('Đã nhân bản thực phẩm.')}>
                    Nhân bản
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </Main>
    </>
  )
}
