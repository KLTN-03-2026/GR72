'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, LoaderCircle, UserCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@/lib/router'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import {
  getPublishedArticleBySlug,
  getPublishedArticles,
  type UserPublishedArticle,
} from '@/services/content/api'

type NutritionUserArticleDetailProps = {
  slug: string
}

export function NutritionUserArticleDetail({
  slug,
}: NutritionUserArticleDetailProps) {
  const [article, setArticle] = useState<UserPublishedArticle | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<UserPublishedArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const detail = await getPublishedArticleBySlug(slug)
        const list = await getPublishedArticles({ page: 1, limit: 20 })
        setArticle(detail)
        setRelatedArticles(
          list.items.filter((item) => item.id !== detail.id).slice(0, 3),
        )
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Không tải được bài viết',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [slug])

  const publishedDate = useMemo(() => {
    if (!article) return ''
    const value = article.xuat_ban_luc ?? article.cap_nhat_luc
    return new Date(value).toLocaleDateString('vi-VN')
  }, [article])

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <div className='space-y-4'>
          <Link
            to='/nutrition/articles'
            className='inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground'
          >
            <ArrowLeft className='size-4' />
            Quay lại danh sách bài viết
          </Link>

          {loading ? (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <LoaderCircle className='size-4 animate-spin' />
              Đang tải chi tiết bài viết...
            </div>
          ) : article ? (
            <div className='space-y-3'>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary'>{article.danh_muc ?? 'Tổng hợp'}</Badge>
                {article.the_gan?.map((tag) => (
                  <Badge key={tag} variant='outline'>
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className='max-w-4xl text-3xl font-bold tracking-tight'>
                {article.tieu_de}
              </h1>
              <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
                {article.tom_tat}
              </p>
              <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                <span className='inline-flex items-center gap-2'>
                  <UserCircle2 className='size-4' />
                  {article.tac_gia?.ho_ten ?? 'NutriWise Team'}
                </span>
                <span className='inline-flex items-center gap-2'>
                  <CalendarDays className='size-4' />
                  {publishedDate}
                </span>
              </div>
            </div>
          ) : (
            <div className='text-sm text-destructive'>Không tìm thấy bài viết.</div>
          )}
        </div>

        {article && (
          <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
            <Card>
              <CardHeader>
                <CardTitle>Nội dung bài viết</CardTitle>
                <CardDescription>
                  Nội dung chi tiết giúp người dùng dễ áp dụng vào thực tế hằng
                  ngày.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {article.noi_dung?.split('\n\n').map((paragraph, index) => (
                  <p
                    key={`${index}-${paragraph.slice(0, 12)}`}
                    className='text-sm leading-7 text-muted-foreground'
                  >
                    {paragraph}
                  </p>
                ))}
              </CardContent>
            </Card>

            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Bài viết liên quan</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {relatedArticles.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>
                      Chưa có bài viết liên quan.
                    </p>
                  ) : (
                    relatedArticles.map((relatedArticle) => (
                      <Link
                        key={relatedArticle.id}
                        to={`/nutrition/articles/${relatedArticle.slug}`}
                        className='block rounded-xl border p-4 transition hover:border-primary/40'
                      >
                        <p className='font-medium'>{relatedArticle.tieu_de}</p>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {relatedArticle.tom_tat}
                        </p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Main>
    </>
  )
}
