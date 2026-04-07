'use client'

import { useMemo, useState } from 'react'
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
import { Input } from '@/components/ui/input'
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

export function NutritionStaffRecipes() {
  const recipes = useNutritionStore((state) => state.recipes)
  const saveRecipe = useNutritionStore((state) => state.saveRecipe)
  const [selectedId, setSelectedId] = useState(recipes[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesQuery =
        recipe.name.toLowerCase().includes(query.toLowerCase()) ||
        recipe.category.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === 'all' || recipe.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [query, recipes, statusFilter])

  const totalPages = Math.max(Math.ceil(filteredRecipes.length / PAGE_SIZE), 1)
  const paginatedRecipes = filteredRecipes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selectedRecipe =
    filteredRecipes.find((recipe) => recipe.id === selectedId) ?? paginatedRecipes[0] ?? recipes[0]

  function handlePublishRecipe() {
    if (!selectedRecipe) return
    saveRecipe({ ...selectedRecipe, status: 'Xuất bản' })
    toast.success(`Đã xuất bản recipe ${selectedRecipe.name}.`)
  }

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Recipes'
          description='Danh sách món ăn/công thức chuẩn dùng cho template và meal plan của user.'
          actions={[{ label: 'Tạo recipe mới' }]}
        />

        <div className='grid gap-6 xl:grid-cols-[1fr_1fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Thư viện công thức</CardTitle>
              <CardDescription>
                Chuẩn hóa recipe giúp tái sử dụng dinh dưỡng và định lượng thống nhất.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-3 md:grid-cols-[1fr_180px]'>
                <Input
                  placeholder='Tìm theo tên hoặc danh mục recipe...'
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                  }}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Trạng thái' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='Xuất bản'>Xuất bản</SelectItem>
                    <SelectItem value='Bản nháp'>Bản nháp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='hidden md:block overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên recipe</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Khẩu phần</TableHead>
                      <TableHead>Tổng calories</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecipes.map((recipe) => (
                      <TableRow
                        key={recipe.id}
                        className='cursor-pointer'
                        onClick={() => setSelectedId(recipe.id)}
                      >
                        <TableCell className='font-medium'>{recipe.name}</TableCell>
                        <TableCell>{recipe.category}</TableCell>
                        <TableCell>{recipe.servings}</TableCell>
                        <TableCell>{recipe.totalCalories} kcal</TableCell>
                        <TableCell>
                          <Badge variant={recipe.status === 'Xuất bản' ? 'secondary' : 'outline'}>
                            {recipe.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className='md:hidden space-y-3'>
                {paginatedRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    className='w-full text-left'
                    onClick={() => setSelectedId(recipe.id)}
                    type='button'
                  >
                    <Card className={recipe.id === selectedRecipe?.id ? 'border-primary/40' : ''}>
                      <CardContent className='space-y-2 p-4'>
                        <div className='flex items-center justify-between gap-3'>
                          <p className='font-medium'>{recipe.name}</p>
                          <Badge variant={recipe.status === 'Xuất bản' ? 'secondary' : 'outline'}>
                            {recipe.status}
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground'>{recipe.category}</p>
                        <p className='text-sm text-muted-foreground'>{recipe.totalCalories} kcal</p>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>

              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </CardContent>
          </Card>

          {selectedRecipe ? (
            <Card>
              <CardHeader>
                <CardTitle>Editor recipe</CardTitle>
                <CardDescription>
                  Màn dựng form recipe để staff hoàn thiện trước khi xuất bản.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <DetailCard label='Tên món' value={selectedRecipe.name} />
                <DetailCard label='Danh mục' value={selectedRecipe.category} />
                <DetailCard label='Khẩu phần' value={`${selectedRecipe.servings} phần`} />
                <DetailCard label='Tổng calories' value={`${selectedRecipe.totalCalories} kcal`} />
                <div className='rounded-xl border p-4'>
                  <p className='font-medium'>Nguyên liệu mẫu</p>
                  <ul className='mt-2 space-y-2 text-sm text-muted-foreground'>
                    <li>Ức gà 150g</li>
                    <li>Rau xanh 120g</li>
                    <li>Sốt mè rang 20g</li>
                  </ul>
                </div>
                <div className='flex flex-wrap gap-3'>
                  <Button onClick={() => toast.success('Đã lưu recipe vào bản nháp.')}>Lưu nháp</Button>
                  <Button variant='outline' onClick={handlePublishRecipe}>Xuất bản</Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </Main>
    </>
  )
}
