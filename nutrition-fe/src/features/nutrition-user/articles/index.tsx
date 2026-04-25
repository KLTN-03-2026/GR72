'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, LoaderCircle, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@/lib/router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

function estimateReadTime(content: string | null) {
  const words = (content ?? '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

export function NutritionUserArticles() {
  const [articles, setArticles] = useState<UserPublishedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

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

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    articles.forEach((article) => {
      const key = article.danh_muc?.trim() || 'Tổng hợp'
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [articles])

  const filteredArticles = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return articles.filter((article) => {
      const inCategory =
        category === 'all' || (article.danh_muc?.trim() || 'Tổng hợp') === category
      if (!inCategory) return false
      if (!keyword) return true
      return (
        article.tieu_de.toLowerCase().includes(keyword) ||
        (article.danh_muc ?? '').toLowerCase().includes(keyword) ||
        (article.tom_tat ?? '').toLowerCase().includes(keyword) ||
        (article.noi_dung ?? '').toLowerCase().includes(keyword)
      )
    })
  }, [articles, query, category])

  const featuredArticle = filteredArticles[0]

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Bài viết dinh dưỡng'
          description='Thư viện kiến thức thực hành về dinh dưỡng, sức khỏe và lối sống cân bằng.'
        />

        <div className='rounded-2xl border bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent p-4 sm:p-5'>
          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <Badge variant='secondary' className='gap-1'>
              <Sparkles className='size-3.5' />
              Nội dung chọn lọc
            </Badge>
            <span className='text-muted-foreground'>
              {articles.length} bài viết đã xuất bản
            </span>
          </div>

          <div className='mt-4 grid gap-3 lg:grid-cols-[1fr_auto]'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                className='pl-9'
                placeholder='Tìm theo tiêu đề, mô tả hoặc nội dung...'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Button variant='outline' onClick={() => { setQuery(''); setCategory('all') }}>
              Xóa lọc
            </Button>
          </div>

          {categories.length > 0 ? (
            <div className='mt-3 flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() => setCategory('all')}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  category === 'all'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:border-primary/50'
                }`}
              >
                Tất cả
              </button>
              {categories.map(([name, count]) => (
                <button
                  key={name}
                  type='button'
                  onClick={() => setCategory(name)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    category === name
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:border-primary/50'
                  }`}
                >
                  {name} ({count})
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <LoaderCircle className='size-4 animate-spin' />
            Đang tải bài viết...
          </div>
        ) : null}

        {featuredArticle ? (
          <Link to={`/nutrition/articles/${featuredArticle.slug}`} className='block'>
            <Card className='overflow-hidden border-primary/20 transition hover:border-primary/40'>
              <div className='grid gap-0 lg:grid-cols-[1.1fr_0.9fr]'>
                <div className='relative min-h-[220px] bg-muted'>
                  {featuredArticle.anh_dai_dien_url ? (
                    <img
                      src={featuredArticle.anh_dai_dien_url}
                      alt={featuredArticle.tieu_de}
                      className='absolute inset-0 h-full w-full object-cover'
                    />
                  ) : (
                    <div className='absolute inset-0 bg-gradient-to-br from-emerald-200/60 to-sky-200/60' />
                  )}
                </div>

                <div className='p-5 sm:p-6'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='secondary'>
                      {featuredArticle.danh_muc ?? 'Tổng hợp'}
                    </Badge>
                    <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                      <CalendarDays className='size-3.5' />
                      {new Date(
                        featuredArticle.xuat_ban_luc ?? featuredArticle.cap_nhat_luc,
                      ).toLocaleDateString('vi-VN')}
                    </span>
                    <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                      <Clock3 className='size-3.5' />
                      {estimateReadTime(featuredArticle.noi_dung)} phút đọc
                    </span>
                  </div>

                  <h2 className='mt-3 text-2xl font-semibold leading-tight'>
                    {featuredArticle.tieu_de}
                  </h2>
                  <p className='mt-2 line-clamp-3 text-sm text-muted-foreground'>
                    {featuredArticle.tom_tat || 'Bài viết chia sẻ kiến thức thực hành dinh dưỡng.'}
                  </p>

                  <div className='mt-4 flex flex-wrap gap-2'>
                    {featuredArticle.the_gan?.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant='outline'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ) : null}

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {filteredArticles.slice(featuredArticle ? 1 : 0).map((article) => (
            <Link key={article.id} to={`/nutrition/articles/${article.slug}`} className='block'>
              <Card className='h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/40'>
                <div className='relative h-44 bg-muted'>
                  {article.anh_dai_dien_url ? (
                    <img
                      src={article.anh_dai_dien_url}
                      alt={article.tieu_de}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='h-full w-full bg-gradient-to-br from-emerald-200/60 to-sky-200/60' />
                  )}
                </div>

                <CardHeader>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <Badge variant='secondary'>{article.danh_muc ?? 'Tổng hợp'}</Badge>
                    <span className='text-xs text-muted-foreground'>
                      {new Date(article.xuat_ban_luc ?? article.cap_nhat_luc).toLocaleDateString(
                        'vi-VN',
                      )}
                    </span>
                  </div>
                  <CardTitle className='line-clamp-2 leading-snug'>{article.tieu_de}</CardTitle>
                  <CardDescription className='line-clamp-3'>
                    {article.tom_tat || 'Bài viết kiến thức dinh dưỡng thực hành.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className='flex items-center justify-between gap-2'>
                  <div className='flex flex-wrap gap-2'>
                    {article.the_gan?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant='outline'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                    <Clock3 className='size-3.5' />
                    {estimateReadTime(article.noi_dung)}p
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {!loading && filteredArticles.length === 0 ? (
          <Card>
            <CardContent className='py-10 text-center text-sm text-muted-foreground'>
              Không tìm thấy bài viết phù hợp bộ lọc hiện tại.
            </CardContent>
          </Card>
        ) : null}
      </Main>
    </>
  )
}
