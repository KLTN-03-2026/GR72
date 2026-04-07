'use client'

import { Activity, BookOpenText, Database, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { StatCard } from '@/features/nutrition/components/stat-card'
import { useNutritionStore } from '@/stores/nutrition-store'

export function NutritionStaffDashboard() {
  const mealLogs = useNutritionStore((state) => state.mealLogs)
  const foodReviewRequests = useNutritionStore((state) => state.foodReviewRequests)
  const articles = useNutritionStore((state) => state.articles)
  const staffUsers = useNutritionStore((state) => state.staffUsers)
  const foods = useNutritionStore((state) => state.foods)
  const aiAdvisor = useNutritionStore((state) => state.aiAdvisor)

  const stats = {
    totalUsers: staffUsers.length,
    totalMealLogs: mealLogs.length,
    totalAiSessions: Math.ceil(aiAdvisor.messages.length / 2),
    publishedArticles: articles.filter((article) => article.status === 'Xuất bản').length,
    pendingFoodReviews: foodReviewRequests.filter((request) => request.status === 'Chờ duyệt').length,
  }

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Dashboard staff'
          description='Tổng quan hoạt động người dùng, AI, dữ liệu thực phẩm và nội dung chuyên môn.'
          actions={[{ label: 'Mở quản trị thực phẩm' }]}
        />

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
          <StatCard label='Tổng user' value={String(stats.totalUsers)} hint='Tài khoản đang hoạt động trên hệ thống' />
          <StatCard label='Meal logs' value={String(stats.totalMealLogs)} hint='Bản ghi ăn uống đã được lưu' />
          <StatCard label='Phiên AI' value={String(stats.totalAiSessions)} hint='Số lượt user tương tác với AI' />
          <StatCard label='Bài viết publish' value={String(stats.publishedArticles)} hint='Nội dung đang hiển thị cho user' />
          <StatCard label='Chờ duyệt' value={String(stats.pendingFoodReviews)} hint='Yêu cầu thực phẩm cần staff xử lý' />
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu duyệt dữ liệu gần nhất</CardTitle>
              <CardDescription>
                Các request import dữ liệu và chỉnh sửa catalog đang cần staff xử lý.
              </CardDescription>
            </CardHeader>
            <CardContent className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại yêu cầu</TableHead>
                    <TableHead>Thực phẩm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {foodReviewRequests.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.requestType}</TableCell>
                      <TableCell>{review.foodName}</TableCell>
                      <TableCell>
                        <Badge variant='outline'>{review.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Nội dung chuyên môn mới cập nhật</CardTitle>
                <CardDescription>
                  Danh sách bài viết và guideline AI vừa được chỉnh sửa gần đây.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {articles.map((article) => (
                  <div key={article.id} className='rounded-xl border p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='font-medium'>{article.title}</p>
                        <p className='mt-1 text-sm text-muted-foreground'>{article.summary}</p>
                      </div>
                      <Badge variant={article.status === 'Xuất bản' ? 'secondary' : 'outline'}>
                        {article.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Điểm nóng vận hành hôm nay</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <FocusRow icon={Database} title='Catalog thực phẩm' description={`${foods.length} thực phẩm đang được quản lý, ${stats.pendingFoodReviews} yêu cầu đang chờ duyệt.`} />
                <FocusRow icon={Activity} title='AI tư vấn' description={`${aiAdvisor.messages.length} tin nhắn đang có trong phiên demo gần nhất.`} />
                <FocusRow icon={BookOpenText} title='Nội dung' description={`${stats.publishedArticles} bài viết đang được publish cho user.`} />
                <FocusRow icon={Users} title='Người dùng' description={`${staffUsers.length} tài khoản mẫu đang hoạt động trong workspace.`} />
              </CardContent>
            </Card>

            <div className='flex flex-wrap gap-3'>
              <Button>Đi tới meal templates</Button>
              <Button variant='outline'>Đi tới articles</Button>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}

function FocusRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Activity
  title: string
  description: string
}) {
  return (
    <div className='flex items-start gap-3 rounded-xl border p-4'>
      <div className='rounded-full bg-primary/10 p-2 text-primary'>
        <Icon className='size-4' />
      </div>
      <div>
        <p className='font-medium'>{title}</p>
        <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
      </div>
    </div>
  )
}
