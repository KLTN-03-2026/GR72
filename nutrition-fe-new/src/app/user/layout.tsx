import type { Metadata } from 'next'
import { UserLayout } from '@/components/user/user-layout'
import './user.css'

export const metadata: Metadata = {
  title: 'Tài khoản | NutriConsult – Tư vấn dinh dưỡng',
  description:
    'Quản lý gói dịch vụ, đặt lịch chuyên gia, theo dõi thanh toán và chăm sóc sức khỏe cá nhân với NutriConsult.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <UserLayout>{children}</UserLayout>
}
