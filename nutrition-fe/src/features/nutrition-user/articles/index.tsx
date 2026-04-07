'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from '@/lib/router'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { useNutritionStore } from '@/stores/nutrition-store'

export function NutritionUserArticles() {
  const articles = useNutritionStore((state) => state.articles)
  const [query, setQuery] = useState('')
  const filteredArticles = useMemo(() => {
    const publishedArticles = articles.filter((article) => article.status === 'Xuất bản')
    const keyword = query.trim().toLowerCase()
    if (!keyword) return publishedArticles
    return publishedArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(keyword) ||
        article.category.toLowerCase().includes(keyword) ||
        article.summary.toLowerCase().includes(keyword)
    )
  }, [articles, query])
  const featuredArticle = filteredArticles[0]

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Bài viết dinh dưỡng'
          description='Kho kiến thức và thực đơn mẫu do nutritionist biên soạn.'
        />

        <div className='relative max-w-md'>
          <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            className='pl-9'
            placeholder='Tìm theo tiêu đề hoặc danh mục...'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {featuredArticle ? (
          <Link
            to={`/nutrition/articles/${featuredArticle.slug ?? featuredArticle.id}`}
            className='block'
          >
            <Card className='border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background transition hover:border-primary/40'>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>{featuredArticle.category}</Badge>
                  <span className='text-xs text-muted-foreground'>{featuredArticle.updatedAt}</span>
                </div>
                <CardTitle className='text-2xl'>{featuredArticle.title}</CardTitle>
                <CardDescription>{featuredArticle.summary}</CardDescription>
              </CardHeader>
              <CardContent className='flex flex-wrap gap-2'>
                {featuredArticle.aiGuidelines?.map((item) => (
                  <Badge key={item} variant='outline'>
                    {item}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </Link>
        ) : null}

        <div className='grid gap-4 xl:grid-cols-3'>
          {filteredArticles.map((article) => (
            <Link
              key={article.id}
              to={`/nutrition/articles/${article.slug ?? article.id}`}
              className='block'
            >
              <Card className='h-full transition hover:border-primary/40'>
                <CardHeader>
                  <div className='flex items-start justify-between gap-3'>
                    <Badge variant='secondary'>{article.category}</Badge>
                    <span className='text-xs text-muted-foreground'>
                      {article.updatedAt}
                    </span>
                  </div>
                  <CardTitle className='leading-snug'>{article.title}</CardTitle>
                  <CardDescription>{article.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-wrap gap-2'>
                    {article.aiGuidelines?.slice(0, 2).map((item) => (
                      <Badge key={item} variant='outline'>
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Main>
    </>
  )
}
