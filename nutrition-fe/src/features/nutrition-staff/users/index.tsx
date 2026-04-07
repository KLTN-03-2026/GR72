'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
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
import { DetailCard } from '@/features/nutrition/components/detail-card'
import { PaginationControls } from '@/features/nutrition/components/pagination-controls'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { StaffAccessGuard } from '@/features/nutrition/components/staff-access-guard'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNutritionStore } from '@/stores/nutrition-store'

const PAGE_SIZE = 4

export function NutritionStaffUsers() {
  const users = useNutritionStore((state) => state.staffUsers)
  const updateStaffUser = useNutritionStore((state) => state.updateStaffUser)
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesQuery =
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        return matchesQuery && matchesRole
      }),
    [query, roleFilter, users]
  )
  const totalPages = Math.max(Math.ceil(filteredUsers.length / PAGE_SIZE), 1)
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selectedUser =
    filteredUsers.find((user) => user.id === selectedId) ?? paginatedUsers[0] ?? users[0]

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Quản lý user'
          description='Màn hình quản trị tài khoản dành riêng cho Admin.'
        />

        <StaffAccessGuard
          allow='admin'
          title='Màn quản lý user chỉ mở cho Admin trong không gian staff.'
          description='Bạn có thể đổi role trong menu hồ sơ sang Admin để xem đầy đủ màn quản trị.'
        >
          <div className='grid gap-6 xl:grid-cols-[1.05fr_0.95fr]'>
            <Card>
              <CardHeader>
                <CardTitle>Danh sách tài khoản</CardTitle>
                <CardDescription>
                  Quản lý role, trạng thái tài khoản và hoạt động gần nhất.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-3 md:grid-cols-[1fr_180px]'>
                  <Input
                    placeholder='Tìm theo tên hoặc email...'
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setPage(1)
                    }}
                  />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Role' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Tất cả role</SelectItem>
                      <SelectItem value='User'>User</SelectItem>
                      <SelectItem value='Nutritionist'>Nutritionist</SelectItem>
                      <SelectItem value='Admin'>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hoạt động gần nhất</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className='cursor-pointer'
                        onClick={() => setSelectedId(user.id)}
                      >
                        <TableCell className='font-medium'>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant='outline'>{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.status}</TableCell>
                        <TableCell className='text-muted-foreground'>
                          {user.lastActive}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
              </CardContent>
            </Card>

            {selectedUser ? (
              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết tài khoản</CardTitle>
                  <CardDescription>
                    Panel thao tác nhanh dành cho admin.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <DetailCard label='Họ tên' value={selectedUser.name} />
                  <DetailCard label='Email' value={selectedUser.email} />
                  <DetailCard label='Role' value={selectedUser.role} />
                  <DetailCard label='Trạng thái' value={selectedUser.status} />
                  <DetailCard label='Hoạt động gần nhất' value={selectedUser.lastActive} />
                  <div className='flex flex-wrap gap-3'>
                    <Button
                      onClick={() => {
                        const nextRole =
                          selectedUser.role === 'User'
                            ? 'Nutritionist'
                            : selectedUser.role === 'Nutritionist'
                              ? 'Admin'
                              : 'User'
                        updateStaffUser(selectedUser.id, { role: nextRole })
                        toast.success(`Đã đổi role sang ${nextRole}.`)
                      }}
                    >
                      Đổi role
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => {
                        const nextStatus =
                          selectedUser.status === 'Hoạt động' ? 'Tạm khóa' : 'Hoạt động'
                        updateStaffUser(selectedUser.id, { status: nextStatus })
                        toast.success(`Đã cập nhật trạng thái thành ${nextStatus.toLowerCase()}.`)
                      }}
                    >
                      Khóa/Mở khóa
                    </Button>
                    <Button variant='outline' onClick={() => toast.success('Đã reset mật khẩu thủ công.')}>
                      Reset mật khẩu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </StaffAccessGuard>
      </Main>
    </>
  )
}
