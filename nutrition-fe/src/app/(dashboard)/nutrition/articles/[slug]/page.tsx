import { notFound } from 'next/navigation'
import { NutritionUserArticleDetail } from '@/features/nutrition-user/article-detail'
import { getArticleBySlug, getPublishedArticles } from '@/services/articles/api'

export default async function NutritionArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article || article.status !== 'Xuất bản') {
    notFound()
  }

  const relatedArticles = getPublishedArticles()
    .filter((item) => item.id !== article.id)
    .slice(0, 3)

  return (
    <NutritionUserArticleDetail
      article={article}
      relatedArticles={relatedArticles}
    />
  )
}
