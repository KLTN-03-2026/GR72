'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/services/auth/api'
import {
  type AdminFoodGroup,
  type AdminFoodGroupPayload,
  createAdminFoodGroup,
  deleteAdminFoodGroup,
  getAdminFoodGroups,
  updateAdminFoodGroup,
} from '@/services/admin-foods/api'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'

const FIELD_CLASSNAME = 'w-full rounded-sm'

type FoodGroupFormState = {
  ten: string
  slug: string
  moTa: string
}

const EMPTY_GROUP_FORM: FoodGroupFormState = {
  ten: '',
  slug: '',
  moTa: '',
}

export function AdminFoodGroups() {
  const [groups, setGroups] = useState<AdminFoodGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [groupForm, setGroupForm] = useState<FoodGroupFormState>(EMPTY_GROUP_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminFoodGroup | null>(null)

  const loadFoodGroups = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getAdminFoodGroups()
      setGroups(response)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không tải được nhóm thực phẩm')
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFoodGroups()
  }, [loadFoodGroups])

  const resetGroupEditor = () => {
    setEditingGroupId(null)
    setGroupForm(EMPTY_GROUP_FORM)
    setFormOpen(false)
  }

  const buildPayload = (): AdminFoodGroupPayload => ({
    ten: groupForm.ten.trim(),
    slug: groupForm.slug.trim() || undefined,
    moTa: groupForm.moTa.trim() || undefined,
  })

  const handleSubmitGroup = async () => {
    setSaving(true)
    try {
      if (editingGroupId) {
        await updateAdminFoodGroup(editingGroupId, buildPayload())
        toast.success('Đã cập nhật nhóm thực phẩm.')
      } else {
        await createAdminFoodGroup(buildPayload())
        toast.success('Đã tạo nhóm thực phẩm.')
      }

      resetGroupEditor()
      await loadFoodGroups()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Lưu nhóm thực phẩm thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGroup = async (group: AdminFoodGroup) => {
    try {
      await deleteAdminFoodGroup(group.id)
      toast.success('Đã xóa nhóm thực phẩm.')
      if (editingGroupId === group.id) {
        resetGroupEditor()
      }
      setDeleteTarget(null)
      await loadFoodGroups()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Xóa nhóm thực phẩm thất bại')
    }
  }

  return (
    <>
      <NutritionTopbar staff />
      <Main fluid className='flex flex-1 flex-col gap-5 px-3 py-5 sm:px-4'>
        <PageHeading
          title='Quản lý nhóm thực phẩm'
          description='Quản trị danh mục nhóm thực phẩm dùng chung cho toàn bộ catalog nội bộ.'
          actions={[
            {
              label: 'Tạo nhóm thực phẩm',
              onClick: () => {
                setEditingGroupId(null)
                setGroupForm(EMPTY_GROUP_FORM)
                setFormOpen(true)
              },
            },
          ]}
        />

        <div className='overflow-hidden rounded-sm border bg-card'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên nhóm</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className='h-24 text-center text-muted-foreground'>
                    Đang tải nhóm thực phẩm...
                  </TableCell>
                </TableRow>
              ) : groups.length ? (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className='font-medium'>{group.ten}</TableCell>
                    <TableCell className='font-mono text-sm'>{group.slug}</TableCell>
                    <TableCell className='max-w-[520px] text-muted-foreground'>
                      {group.mo_ta || 'Chưa có mô tả'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          className='rounded-sm'
                          onClick={() => {
                            setEditingGroupId(group.id)
                            setGroupForm({
                              ten: group.ten,
                              slug: group.slug,
                              moTa: group.mo_ta ?? '',
                            })
                            setFormOpen(true)
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          className='rounded-sm'
                          onClick={() => setDeleteTarget(group)}
                        >
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className='h-24 text-center text-muted-foreground'>
                    Chưa có nhóm thực phẩm.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Main>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingGroupId(null)
            setGroupForm(EMPTY_GROUP_FORM)
          }
        }}
      >
        <DialogContent className='rounded-sm sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {editingGroupId ? 'Cập nhật nhóm thực phẩm' : 'Tạo nhóm thực phẩm'}
            </DialogTitle>
            <DialogDescription>Điền thông tin nhóm để lưu thay đổi.</DialogDescription>
          </DialogHeader>

          <Card className='border-0 shadow-none'>
            <CardContent className='space-y-4 px-0'>
              <div className='space-y-2'>
                <Label>Tên nhóm</Label>
                <Input
                  value={groupForm.ten}
                  onChange={(event) =>
                    setGroupForm((current) => ({ ...current, ten: event.target.value }))
                  }
                  className={FIELD_CLASSNAME}
                  disabled={saving}
                />
              </div>
              <div className='space-y-2'>
                <Label>Slug</Label>
                <Input
                  value={groupForm.slug}
                  onChange={(event) =>
                    setGroupForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  className={FIELD_CLASSNAME}
                  disabled={saving}
                />
              </div>
              <div className='space-y-2'>
                <Label>Mô tả</Label>
                <Textarea
                  value={groupForm.moTa}
                  onChange={(event) =>
                    setGroupForm((current) => ({ ...current, moTa: event.target.value }))
                  }
                  className='min-h-36 w-full rounded-sm'
                  disabled={saving}
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={resetGroupEditor}
                  className='rounded-sm'
                >
                  Hủy
                </Button>
                <Button
                  type='button'
                  onClick={handleSubmitGroup}
                  disabled={saving}
                  className='rounded-sm'
                >
                  {editingGroupId ? 'Lưu nhóm' : 'Tạo nhóm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={deleteTarget !== null}
        title='Xóa nhóm thực phẩm'
        description={
          deleteTarget
            ? `Bạn có chắc muốn xóa nhóm thực phẩm "${deleteTarget.ten}"?`
            : ''
        }
        confirmLabel='Xóa nhóm'
        loading={saving}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => {
          if (deleteTarget) {
            void handleDeleteGroup(deleteTarget)
          }
        }}
      />
    </>
  )
}
