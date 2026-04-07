import { articles } from '@/features/nutrition/data/mock-data'

export function getPublishedArticles() {
  return articles.filter((article) => article.status === 'Xuất bản')
}

export function getStaffArticles() {
  return articles
}

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug)
}
