import Link from 'next/link'
import { ActionButton, PageHeader, Panel, StatCard } from '@/components/admin/admin-ui'

export default function UserDashboardPage() {
  const links = [
    { href: '/dashboard/packages', label: '01. Xem và mua gói dịch vụ' },
    { href: '/dashboard/my-packages', label: '02. Quản lý gói đã mua' },
    { href: '/dashboard/experts', label: '03. Chọn chuyên gia theo gói' },
    { href: '/dashboard/bookings', label: '04. Đặt lịch tư vấn' },
    { href: '/dashboard/payments', label: '05. Thanh toán' },
  ]

  return (
    <>
      <PageHeader
        eyebrow='Customer workspace'
        title='Dashboard khách hàng'
        description='Bộ luồng customer 01-05 theo mô hình package-first, đồng bộ style với khu vực admin và expert.'
      />
      <div className='mb-5 grid gap-3 md:grid-cols-3'>
        <StatCard label='Luồng chính' value='5 chức năng' />
        <StatCard label='Bắt đầu từ' value='Mua gói dịch vụ' tone='green' />
        <StatCard label='Kết thúc tại' value='Thanh toán + xác nhận' tone='orange' />
      </div>
      <Panel title='Điều hướng nhanh customer 01-05'>
        <div className='grid gap-3 md:grid-cols-2'>
          {links.map((item) => (
            <Link key={item.href} href={item.href}>
              <ActionButton tone='secondary'>{item.label}</ActionButton>
            </Link>
          ))}
        </div>
      </Panel>
    </>
  )
}
