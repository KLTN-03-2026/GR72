import { RoleDashboard } from '@/components/dashboard/role-dashboard'

export default function UserDashboardPage() {
  return (
    <RoleDashboard
      eyebrow='Người dùng'
      title='Dashboard khách hàng'
      description='Khu vực dành cho người dùng mua gói tư vấn, book chuyên gia, theo dõi sức khỏe và nhận gợi ý cá nhân hóa.'
      stats={[
        { label: 'Gói đã mua', value: '0' },
        { label: 'Lịch tư vấn', value: '0' },
        { label: 'Gợi ý sức khỏe', value: '0' },
      ]}
      actions={[
        'Mua gói tư vấn sức khỏe, dinh dưỡng, tập luyện',
        'Book chuyên gia theo gói đã mua',
        'Theo dõi hồ sơ và chỉ số sức khỏe',
        'Chatbox AI hỗ trợ hỏi đáp nhanh',
      ]}
    />
  )
}
