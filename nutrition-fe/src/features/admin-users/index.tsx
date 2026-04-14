'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type ColumnDef,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Eye, KeyRound, Pencil, ShieldCheck, ShieldX, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import {
  type AdminUser,
  type AdminUserDetail,
  type AdminUserRole,
  type AdminUserStatus,
  deleteAdminUser,
  getAdminUserDetail,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserStatus,
} from '@/services/admin/api'
import { DataTablePagination } from '@/components/data-table'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

const PAGE_SIZE = 10
const DEFAULT_RESET_PASSWORD = '12345678'
const FIELD_CLASSNAME = 'h-10 rounded-sm'

type AdminUserFormState = {
  hoTen: string
  email: string
}

function getRoleLabel(role: AdminUserRole) {
  switch (role) {
    case 'quan_tri':
      return 'Admin'
    case 'chuyen_gia_dinh_duong':
      return 'Nutritionist'
    case 'nguoi_dung':
    default:
      return 'User'
  }
}

function getStatusLabel(status: AdminUserStatus) {
  switch (status) {
    case 'hoat_dong':
      return 'Hoạt động'
    case 'khong_hoat_dong':
      return 'Không hoạt động'
    case 'bi_khoa':
    default:
      return 'Bị khóa'
  }
}

function formatDateTime(value: string | null) {
  if (!value) return 'Chưa có'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function UserDetailDialog({
  open,
  user,
  form,
  editMode,
  loading,
  saving,
  onOpenChange,
  onEditModeChange,
  onFormChange,
  onResetPassword,
  onSubmit,
}: {
  open: boolean
  user: AdminUserDetail | null
  form: AdminUserFormState
  editMode: boolean
  loading: boolean
  saving: boolean
  onOpenChange: (open: boolean) => void
  onEditModeChange: (value: boolean) => void
  onFormChange: (patch: Partial<AdminUserFormState>) => void
  onResetPassword: () => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-sm p-4 sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{editMode ? 'Chỉnh sửa tài khoản' : 'Chi tiết tài khoản'}</DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Cập nhật thông tin tài khoản rồi lưu thay đổi trực tiếp qua API.'
              : 'Xem nhanh dữ liệu người dùng. Bạn có thể chuyển sang chế độ chỉnh sửa từ menu thao tác.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='py-10 text-center text-sm text-muted-foreground'>
            Đang tải chi tiết tài khoản...
          </div>
        ) : user ? (
          <>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Mã user</Label>
                <Input value={String(user.id)} disabled className={FIELD_CLASSNAME} />
              </div>
              <div className='space-y-2'>
                <Label>Hoạt động gần nhất</Label>
                <Input
                  value={formatDateTime(user.dang_nhap_cuoi_luc)}
                  disabled
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Họ tên</Label>
                <Input
                  value={form.hoTen}
                  disabled={!editMode || saving}
                  onChange={(event) => onFormChange({ hoTen: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Email</Label>
                <Input
                  value={form.email}
                  disabled={!editMode || saving}
                  onChange={(event) => onFormChange({ email: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Role</Label>
                <Select
                  value={user.vai_tro}
                  disabled
                >
                  <SelectTrigger className={FIELD_CLASSNAME}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='nguoi_dung'>Người dùng</SelectItem>
                    <SelectItem value='chuyen_gia_dinh_duong'>Chuyên gia dinh dưỡng</SelectItem>
                    <SelectItem value='quan_tri'>Quản trị</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Trạng thái</Label>
                <Select
                  value={user.trang_thai}
                  disabled
                >
                  <SelectTrigger className={FIELD_CLASSNAME}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='hoat_dong'>Hoạt động</SelectItem>
                    <SelectItem value='khong_hoat_dong'>Không hoạt động</SelectItem>
                    <SelectItem value='bi_khoa'>Bị khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className='gap-2 sm:justify-between'>
              <Button
                variant='outline'
                onClick={onResetPassword}
                disabled={saving}
                className='rounded-sm'
              >
                <KeyRound />
                Reset mật khẩu
              </Button>
              <div className='flex gap-2'>
                {editMode ? (
                  <>
                    <Button
                      variant='outline'
                      onClick={() => onEditModeChange(false)}
                      disabled={saving}
                      className='rounded-sm'
                    >
                      Hủy
                    </Button>
                    <Button onClick={onSubmit} disabled={saving} className='rounded-sm'>
                      Lưu thay đổi
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant='outline'
                      onClick={() => onEditModeChange(true)}
                      className='rounded-sm'
                    >
                      <Pencil />
                      Chỉnh sửa
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => onOpenChange(false)}
                      className='rounded-sm'
                    >
                      Đóng
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          </>
        ) : (
          <div className='py-10 text-center text-sm text-muted-foreground'>
            Không tìm thấy dữ liệu tài khoản.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | AdminUserRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | AdminUserStatus>('all')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [pageCount, setPageCount] = useState(0)
  const [form, setForm] = useState<AdminUserFormState>({
    hoTen: '',
    email: '',
  })

  const loadUsers = useCallback(async () => {
    setLoading(true)

    try {
      const response = await getAdminUsers({
        keyword,
        vaiTro: roleFilter === 'all' ? undefined : roleFilter,
        trangThai: statusFilter === 'all' ? undefined : statusFilter,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })

      setUsers(response.items)
      setPageCount(Math.max(Math.ceil(response.pagination.total / response.pagination.limit), 1))
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không tải được danh sách user')
      setUsers([])
      setPageCount(1)
    } finally {
      setLoading(false)
    }
  }, [keyword, pagination.pageIndex, pagination.pageSize, roleFilter, statusFilter])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  useEffect(() => {
    if (!selectedUserId) return

    let isMounted = true
    setDetailLoading(true)

    void getAdminUserDetail(selectedUserId)
      .then((user) => {
        if (!isMounted) return
        setSelectedUser(user)
        setForm({
          hoTen: user.ho_ten,
          email: user.email,
        })
      })
      .catch((error) => {
        if (!isMounted) return
        toast.error(error instanceof ApiError ? error.message : 'Không tải được chi tiết user')
        setSelectedUser(null)
      })
      .finally(() => {
        if (isMounted) {
          setDetailLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedUserId])

  const updateListItem = (user: AdminUser) => {
    setUsers((current) =>
      current.map((item) => (item.id === user.id ? { ...item, ...user } : item))
    )
    setSelectedUser((current) =>
      current && current.id === user.id ? { ...current, ...user } : current
    )
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      await resetAdminUserPassword(selectedUser.id, DEFAULT_RESET_PASSWORD)
      toast.success(`Đã reset mật khẩu về ${DEFAULT_RESET_PASSWORD}.`)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Reset mật khẩu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const updatedUser = await updateAdminUser(selectedUser.id, {
        hoTen: form.hoTen.trim(),
        email: form.email.trim(),
      })

      updateListItem(updatedUser)
      setIsEditMode(false)
      toast.success('Đã cập nhật thông tin tài khoản.')
      await loadUsers()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Cập nhật tài khoản thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = useCallback(async (user: AdminUser) => {
    try {
      await deleteAdminUser(user.id)
      setUsers((current) => current.filter((item) => item.id !== user.id))
      if (selectedUser?.id === user.id) {
        setSelectedUser(null)
        setSelectedUserId(null)
      }
      toast.success('Đã xóa tài khoản.')
      setDeleteTarget(null)
      await loadUsers()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Xóa tài khoản thất bại')
    }
  }, [loadUsers, selectedUser?.id])

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className='font-mono text-sm text-muted-foreground'>
            {row.original.id}
          </span>
        ),
      },
      {
        accessorKey: 'ho_ten',
        header: 'Họ tên',
        cell: ({ row }) => (
          <p className='font-medium'>{row.original.ho_ten}</p>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'vai_tro',
        header: 'Vai trò',
        cell: ({ row }) => <Badge variant='outline'>{getRoleLabel(row.original.vai_tro)}</Badge>,
      },
      {
        accessorKey: 'trang_thai',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Badge variant={row.original.trang_thai === 'hoat_dong' ? 'secondary' : 'outline'}>
            {getStatusLabel(row.original.trang_thai)}
          </Badge>
        ),
      },
      {
        accessorKey: 'dang_nhap_cuoi_luc',
        header: 'Hoạt động gần nhất',
        cell: ({ row }) => formatDateTime(row.original.dang_nhap_cuoi_luc),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='size-8 p-0'>
                <DotsHorizontalIcon className='size-4' />
                <span className='sr-only'>Mở menu thao tác</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUserId(row.original.id)
                  setIsEditMode(false)
                }}
              >
                <Eye />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUserId(row.original.id)
                  setIsEditMode(true)
                }}
              >
                <Pencil />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await updateAdminUserStatus(
                      row.original.id,
                      row.original.trang_thai === 'hoat_dong' ? 'bi_khoa' : 'hoat_dong'
                    )
                    await loadUsers()
                    toast.success('Đã cập nhật trạng thái tài khoản.')
                  } catch (error) {
                    toast.error(
                      error instanceof ApiError ? error.message : 'Cập nhật trạng thái thất bại'
                    )
                  }
                }}
              >
                {row.original.trang_thai === 'hoat_dong' ? <ShieldX /> : <ShieldCheck />}
                {row.original.trang_thai === 'hoat_dong' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await resetAdminUserPassword(row.original.id, DEFAULT_RESET_PASSWORD)
                    toast.success(`Đã reset mật khẩu về ${DEFAULT_RESET_PASSWORD}.`)
                  } catch (error) {
                    toast.error(
                      error instanceof ApiError ? error.message : 'Reset mật khẩu thất bại'
                    )
                  }
                }}
              >
                <KeyRound />
                Reset mật khẩu
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 />
                Xóa tài khoản
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [loadUsers]
  )

  const table = useReactTable({
    data: users,
    columns,
    state: {
      pagination,
    },
    manualPagination: true,
    pageCount,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <>
      <AdminTopbar />
      <Main fluid className='flex flex-1 flex-col gap-5 px-3 py-5 sm:px-4'>
        <PageHeading
          title='Quản lý người dùng'
          description='Bảng quản trị tài khoản dùng API thật, hỗ trợ tra cứu, cập nhật thông tin cơ bản, trạng thái và reset mật khẩu an toàn.'
        />

        <div className='space-y-4'>
          <div className='flex flex-wrap gap-3'>
            <Input
              placeholder='Tìm theo họ tên hoặc email...'
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setPagination((current) => ({ ...current, pageIndex: 0 }))
              }}
              className='w-full max-w-sm'
            />
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value as 'all' | AdminUserRole)
                setPagination((current) => ({ ...current, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className='w-[220px] rounded-sm'>
                <SelectValue placeholder='Lọc role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả role</SelectItem>
                <SelectItem value='nguoi_dung'>User</SelectItem>
                <SelectItem value='chuyen_gia_dinh_duong'>Nutritionist</SelectItem>
                <SelectItem value='quan_tri'>Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as 'all' | AdminUserStatus)
                setPagination((current) => ({ ...current, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className='w-[220px] rounded-sm'>
                <SelectValue placeholder='Lọc trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='hoat_dong'>Hoạt động</SelectItem>
                <SelectItem value='khong_hoat_dong'>Không hoạt động</SelectItem>
                <SelectItem value='bi_khoa'>Bị khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='h-24 text-center'>
                      Đang tải danh sách tài khoản...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center text-muted-foreground'
                    >
                      Không tìm thấy tài khoản phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </Main>

      <UserDetailDialog
        open={selectedUserId !== null}
        user={selectedUser}
        form={form}
        editMode={isEditMode}
        loading={detailLoading}
        saving={saving}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUserId(null)
            setSelectedUser(null)
            setIsEditMode(false)
          }
        }}
        onEditModeChange={(value) => {
          setIsEditMode(value)
          if (!value && selectedUser) {
            setForm({
              hoTen: selectedUser.ho_ten,
              email: selectedUser.email,
            })
          }
        }}
        onFormChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        onResetPassword={handleResetPassword}
        onSubmit={handleUpdateUser}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        title='Xóa tài khoản'
        description={
          deleteTarget
            ? `Bạn có chắc muốn xóa tài khoản "${deleteTarget.ho_ten}"? Hành động này sẽ xóa mềm người dùng.`
            : ''
        }
        confirmLabel='Xóa tài khoản'
        loading={saving}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => {
          if (deleteTarget) {
            void handleDeleteUser(deleteTarget)
          }
        }}
      />
    </>
  )
}
