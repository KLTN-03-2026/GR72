'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  LoaderCircle,
  UserCircle2,
} from 'lucide-react'
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

function estimateReadTime(content: string | null) {
  const words = (content ?? '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

function renderArticleBlocks(content: string) {
  const blocks = content
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean)

  const imageRegex = /^!\[(.*?)\]\((.*?)\)$/

  return blocks.map((block, index) => {
    const lines = block.split('\n').map((line) => line.trim())
    const imageLines = lines
      .map((line) => line.match(imageRegex))
      .filter(Boolean) as RegExpMatchArray[]

    if (imageLines.length === lines.length && imageLines.length > 0) {
      return (
        <div key={`img-${index}`} className='grid gap-3 sm:grid-cols-2'>
          {imageLines.map((match, imageIndex) => (
            <figure key={`${match[2]}-${imageIndex}`} className='overflow-hidden rounded-xl border'>
              <img
                src={match[2]}
                alt={match[1] || `article-image-${index + 1}`}
                className='h-56 w-full object-cover sm:h-64'
              />
              {match[1] ? (
                <figcaption className='px-3 py-2 text-xs text-muted-foreground'>
                  {match[1]}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      )
    }

    if (block.startsWith('### ')) {
      return (
        <h3 key={`h3-${index}`} className='text-xl font-semibold'>
          {block.replace(/^###\s+/, '')}
        </h3>
      )
    }

    if (block.startsWith('## ')) {
      return (
        <h2 key={`h2-${index}`} className='text-2xl font-semibold'>
          {block.replace(/^##\s+/, '')}
        </h2>
      )
    }

    if (block.startsWith('# ')) {
      return (
        <h1 key={`h1-${index}`} className='text-3xl font-semibold'>
          {block.replace(/^#\s+/, '')}
        </h1>
      )
    }

    const listItems = lines.filter((line) => line.startsWith('- '))
    if (listItems.length === lines.length && listItems.length > 0) {
      return (
        <ul key={`ul-${index}`} className='list-disc space-y-2 pl-5 text-sm leading-7 text-foreground/90'>
          {listItems.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{item.replace(/^-\s+/, '')}</li>
          ))}
        </ul>
      )
    }

    return (
      <p key={`p-${index}`} className='text-sm leading-7 text-foreground/90'>
        {block}
      </p>
    )
  })
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
        const list = await getPublishedArticles({ page: 1, limit: 24 })
        setArticle(detail)
        setRelatedArticles(
          list.items.filter((item) => item.id !== detail.id).slice(0, 4),
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
          <>
            <Card className='overflow-hidden border-primary/20'>
              <div className='grid gap-0 lg:grid-cols-[1.15fr_0.85fr]'>
                <div className='relative min-h-[260px] bg-muted'>
                  {article.anh_dai_dien_url ? (
                    <img
                      src={article.anh_dai_dien_url}
                      alt={article.tieu_de}
                      className='absolute inset-0 h-full w-full object-cover'
                    />
                  ) : (
                    <div className='absolute inset-0 bg-gradient-to-br from-emerald-200/60 to-sky-200/60' />
                  )}
                </div>

                <div className='p-5 sm:p-6'>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='secondary'>{article.danh_muc ?? 'Tổng hợp'}</Badge>
                    {article.the_gan?.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant='outline'>
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h1 className='mt-3 text-3xl font-semibold tracking-tight'>
                    {article.tieu_de}
                  </h1>
                  <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                    {article.tom_tat}
                  </p>

                  <div className='mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground'>
                    <span className='inline-flex items-center gap-1.5'>
                      <UserCircle2 className='size-4' />
                      {article.tac_gia?.ho_ten ?? 'NutriWise Team'}
                    </span>
                    <span className='inline-flex items-center gap-1.5'>
                      <CalendarDays className='size-4' />
                      {publishedDate}
                    </span>
                    <span className='inline-flex items-center gap-1.5'>
                      <Clock3 className='size-4' />
                      {estimateReadTime(article.noi_dung)} phút đọc
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
              <Card>
                <CardHeader>
                  <CardTitle>Nội dung bài viết</CardTitle>
                  <CardDescription>
                    Thông tin được trình bày theo hướng dễ áp dụng vào bữa ăn hằng ngày.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-5'>
                  {renderArticleBlocks(article.noi_dung ?? '')}
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
                          className='block overflow-hidden rounded-xl border transition hover:border-primary/40'
                        >
                          <div className='grid grid-cols-[96px_1fr] gap-0'>
                            <div className='h-full min-h-[96px] bg-muted'>
                              {relatedArticle.anh_dai_dien_url ? (
                                <img
                                  src={relatedArticle.anh_dai_dien_url}
                                  alt={relatedArticle.tieu_de}
                                  className='h-full w-full object-cover'
                                />
                              ) : (
                                <div className='h-full w-full bg-gradient-to-br from-emerald-200/50 to-sky-200/50' />
                              )}
                            </div>
                            <div className='p-3'>
                              <p className='line-clamp-2 text-sm font-medium'>
                                {relatedArticle.tieu_de}
                              </p>
                              <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>
                                {relatedArticle.tom_tat || 'Bài viết dinh dưỡng'}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className='text-sm text-destructive'>Không tìm thấy bài viết.</div>
        )}
      </Main>
    </>
  )
}
