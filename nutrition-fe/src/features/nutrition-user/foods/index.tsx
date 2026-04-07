'use client'

import { useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { useNutritionStore } from '@/stores/nutrition-store'

export function NutritionUserFoods() {
  const foods = useNutritionStore((state) => state.foods)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(foods[0]?.id ?? '')
  const filteredFoods = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return foods
    return foods.filter(
      (food) =>
        food.name.toLowerCase().includes(keyword) ||
        food.group.toLowerCase().includes(keyword) ||
        food.source.toLowerCase().includes(keyword)
    )
  }, [foods, query])
  const selectedFood =
    filteredFoods.find((food) => food.id === selectedId) ?? filteredFoods[0] ?? foods[0]

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Thực phẩm'
          description='Tra cứu nhanh dữ liệu dinh dưỡng để thêm vào nhật ký ăn uống hoặc meal plan.'
          actions={[{ label: 'Thêm vào meal log' }]}
        />

        <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Tìm kiếm thực phẩm</CardTitle>
              <CardDescription>
                Dữ liệu ưu tiên catalog nội bộ đã xác minh.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex flex-wrap gap-3'>
                <div className='relative min-w-[280px] flex-1'>
                  <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    className='pl-9'
                    placeholder='Tìm theo tên thực phẩm, nhóm hoặc nguồn dữ liệu...'
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <Button variant='outline'>Đã xác minh</Button>
                <Button variant='outline'>Ít carb</Button>
                <Button variant='outline'>Giàu protein</Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Nhóm</TableHead>
                    <TableHead>Khẩu phần</TableHead>
                    <TableHead>Calories</TableHead>
                    <TableHead>Macro</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFoods.map((food) => (
                    <TableRow
                      key={food.id}
                      className='cursor-pointer'
                      onClick={() => setSelectedId(food.id)}
                    >
                      <TableCell className='font-medium'>{food.name}</TableCell>
                      <TableCell>{food.group}</TableCell>
                      <TableCell>{food.serving}</TableCell>
                      <TableCell>{food.calories} kcal</TableCell>
                      <TableCell className='text-muted-foreground'>
                        P {food.protein} / C {food.carbs} / F {food.fat}
                      </TableCell>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chi tiết thực phẩm</CardTitle>
              <CardDescription>
                Panel chi tiết để thêm nhanh vào nhật ký hoặc kế hoạch ăn.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
              {selectedFood ? (
                <>
                  <div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h3 className='text-xl font-semibold'>{selectedFood.name}</h3>
                      <Badge variant='outline'>{selectedFood.group}</Badge>
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                      Dữ liệu theo khẩu phần tham chiếu {selectedFood.serving}. Có thể dùng trực tiếp
                      khi log bữa ăn hoặc so sánh thực phẩm cùng nhóm.
                    </p>
                  </div>

                  <div className='grid gap-3 sm:grid-cols-2'>
                    <FoodMetric label='Calories' value={`${selectedFood.calories} kcal`} />
                    <FoodMetric label='Protein' value={`${selectedFood.protein} g`} />
                    <FoodMetric label='Carb' value={`${selectedFood.carbs} g`} />
                    <FoodMetric label='Fat' value={`${selectedFood.fat} g`} />
                  </div>

                  <div className='rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground'>
                    Nguồn dữ liệu: {selectedFood.source}. Trạng thái hiện tại là {selectedFood.status}.
                  </div>

                  <div className='grid gap-3'>
                    <Button>Thêm vào bữa ăn hôm nay</Button>
                    <Button variant='outline'>Thêm vào kế hoạch ăn</Button>
                    <Button variant='outline'>So sánh với món tương tự</Button>
                  </div>

                  <div className='rounded-xl border p-4'>
                    <p className='flex items-center gap-2 font-medium'>
                      <Sparkles className='size-4 text-primary' />
                      Gợi ý dùng
                    </p>
                    <p className='mt-2 text-sm text-muted-foreground'>
                      Phù hợp để thêm vào bữa sáng hoặc bữa trưa nếu bạn cần tăng đạm mà vẫn
                      kiểm soát calories.
                    </p>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

function FoodMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border p-4'>
      <p className='text-sm text-muted-foreground'>{label}</p>
      <p className='mt-2 text-lg font-semibold'>{value}</p>
    </div>
  )
}
