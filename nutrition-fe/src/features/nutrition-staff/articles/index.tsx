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
import { Main } from '@/components/layout/main'
import { DetailCard } from '@/features/nutrition/components/detail-card'
import { PaginationControls } from '@/features/nutrition/components/pagination-controls'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { useNutritionStore } from '@/stores/nutrition-store'

export function NutritionStaffArticles() {
  const articles = useNutritionStore((state) => state.articles)
  const saveArticle = useNutritionStore((state) => state.saveArticle)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(articles[0]?.id ?? '')
  const filteredArticles = useMemo(
    () =>
      articles.filter(
        (article) =>
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.category.toLowerCase().includes(query.toLowerCase())
      ),
    [articles, query]
  )
  const totalPages = Math.max(Math.ceil(filteredArticles.length / 4), 1)
  const paginatedArticles = filteredArticles.slice((page - 1) * 4, page * 4)
  const selectedArticle =
    filteredArticles.find((article) => article.id === selectedId) ?? paginatedArticles[0] ?? articles[0]

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Bài viết và AI guideline'
          description='Nutritionist quản lý bài viết chuyên môn, đồng thời cập nhật guideline AI ngay trong từng bài.'
          actions={[{ label: 'Tạo bài viết mới' }]}
        />

        <div className='grid gap-6 xl:grid-cols-[0.85fr_1.15fr]'>
          <div className='space-y-4'>
            <Input
              placeholder='Tìm theo tiêu đề hoặc danh mục...'
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
            {paginatedArticles.map((article) => (
              <button
                key={article.id}
                className='w-full text-left'
                onClick={() => setSelectedId(article.id)}
                type='button'
              >
                <Card className={article.id === selectedArticle?.id ? 'border-primary/40 shadow-sm' : ''}>
                  <CardHeader>
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div>
                        <CardTitle className='text-lg'>{article.title}</CardTitle>
                        <CardDescription>
                          {article.category} • cập nhật {article.updatedAt}
                        </CardDescription>
                      </div>
                      <Badge variant={article.status === 'Xuất bản' ? 'secondary' : 'outline'}>
                        {article.status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              </button>
            ))}
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>

          {selectedArticle ? (
            <Card>
              <CardHeader>
                <CardTitle>Editor bài viết</CardTitle>
                <CardDescription>
                  Nơi nutritionist cập nhật nội dung và guideline AI cho từng bài.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <DetailCard label='Tiêu đề' value={selectedArticle.title} />
                <DetailCard label='Danh mục' value={selectedArticle.category} />
                <DetailCard label='Tóm tắt' value={selectedArticle.summary} />
                <div className='rounded-xl border p-4'>
                  <p className='font-medium'>AI guideline</p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {selectedArticle.aiGuidelines?.map((guideline) => (
                      <Badge key={guideline} variant='outline'>
                        {guideline}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className='flex flex-wrap gap-3'>
                  <Button onClick={() => toast.success('Đã lưu bài viết vào bản nháp.')}>Lưu nháp</Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      saveArticle({ ...selectedArticle, status: 'Xuất bản' })
                      toast.success('Đã xuất bản bài viết.')
                    }}
                  >
                    Xuất bản
                  </Button>
                  <Button variant='outline' onClick={() => toast.success('Đã mở chế độ xem trước.')}>
                    Xem trước
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
