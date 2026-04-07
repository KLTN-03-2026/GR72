import { ArrowLeft, CalendarDays, UserCircle2 } from 'lucide-react'
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
import type { ArticleRecord } from '@/features/nutrition/types'

type NutritionUserArticleDetailProps = {
  article: ArticleRecord
  relatedArticles: ArticleRecord[]
}

export function NutritionUserArticleDetail({
  article,
  relatedArticles,
}: NutritionUserArticleDetailProps) {
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

          <div className='space-y-3'>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='secondary'>{article.category}</Badge>
              {article.tags?.map((tag) => (
                <Badge key={tag} variant='outline'>
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className='max-w-4xl text-3xl font-bold tracking-tight'>
              {article.title}
            </h1>
            <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
              {article.summary}
            </p>
            <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
              <span className='inline-flex items-center gap-2'>
                <UserCircle2 className='size-4' />
                {article.author ?? 'NutriWise Team'}
              </span>
              <span className='inline-flex items-center gap-2'>
                <CalendarDays className='size-4' />
                {article.publishedAt ?? article.updatedAt}
              </span>
            </div>
          </div>
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Nội dung bài viết</CardTitle>
              <CardDescription>
                Nội dung chi tiết giúp người dùng dễ áp dụng vào thực tế hằng ngày.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {article.content?.split('\n\n').map((paragraph) => (
                <p
                  key={paragraph}
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
                <CardTitle>Điểm nổi bật</CardTitle>
                <CardDescription>
                  Những guideline và lưu ý được nutritionist gắn trực tiếp vào bài viết.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                {article.aiGuidelines?.map((item) => (
                  <div
                    key={item}
                    className='rounded-xl border p-3 text-sm text-muted-foreground'
                  >
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bài viết liên quan</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {relatedArticles.map((relatedArticle) => (
                  <Link
                    key={relatedArticle.id}
                    to={`/nutrition/articles/${relatedArticle.slug ?? relatedArticle.id}`}
                    className='block rounded-xl border p-4 transition hover:border-primary/40'
                  >
                    <p className='font-medium'>{relatedArticle.title}</p>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {relatedArticle.summary}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
