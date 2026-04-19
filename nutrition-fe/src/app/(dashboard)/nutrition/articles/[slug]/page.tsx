import { NutritionUserArticleDetail } from '@/features/nutrition-user/article-detail'

export default async function NutritionArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <NutritionUserArticleDetail slug={slug} />
}
