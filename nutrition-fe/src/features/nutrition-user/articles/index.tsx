'use client'

import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Search } from 'lucide-react'
import { toast } from 'sonner'
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
import {
  getPublishedArticles,
  type UserPublishedArticle,
} from '@/services/content/api'

export function NutritionUserArticles() {
  const [articles, setArticles] = useState<UserPublishedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function loadArticles() {
      setLoading(true)
      try {
        const response = await getPublishedArticles({ page: 1, limit: 50 })
        setArticles(response.items)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Không tải được bài viết',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadArticles()
  }, [])

  const filteredArticles = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return articles
    return articles.filter(
      (article) =>
        article.tieu_de.toLowerCase().includes(keyword) ||
        (article.danh_muc ?? '').toLowerCase().includes(keyword) ||
        (article.tom_tat ?? '').toLowerCase().includes(keyword)
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

        {loading && (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <LoaderCircle className='size-4 animate-spin' />
            Đang tải bài viết...
          </div>
        )}

        {featuredArticle ? (
          <Link
            to={`/nutrition/articles/${featuredArticle.slug}`}
            className='block'
          >
            <Card className='border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background transition hover:border-primary/40'>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>
                    {featuredArticle.danh_muc ?? 'Tổng hợp'}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    {new Date(
                      featuredArticle.xuat_ban_luc ?? featuredArticle.cap_nhat_luc,
                    ).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <CardTitle className='text-2xl'>
                  {featuredArticle.tieu_de}
                </CardTitle>
                <CardDescription>{featuredArticle.tom_tat}</CardDescription>
              </CardHeader>
              <CardContent className='flex flex-wrap gap-2'>
                {featuredArticle.the_gan?.map((item) => (
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
              to={`/nutrition/articles/${article.slug}`}
              className='block'
            >
              <Card className='h-full transition hover:border-primary/40'>
                <CardHeader>
                  <div className='flex items-start justify-between gap-3'>
                    <Badge variant='secondary'>
                      {article.danh_muc ?? 'Tổng hợp'}
                    </Badge>
                    <span className='text-xs text-muted-foreground'>
                      {new Date(
                        article.xuat_ban_luc ?? article.cap_nhat_luc,
                      ).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <CardTitle className='leading-snug'>{article.tieu_de}</CardTitle>
                  <CardDescription>{article.tom_tat}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-wrap gap-2'>
                    {article.the_gan?.slice(0, 2).map((item) => (
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
