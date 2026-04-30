'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Field, Notice, PageHeader, Panel, StatCard, StatusPill, Toolbar, inputClass, money } from '@/components/admin/admin-ui'
import { DataTable, Modal, Td, Th } from '@/components/admin/admin-table'
import { adminDelete, adminGet, adminPatch, adminPost, AdminPackage, ExpertMapping } from '@/lib/admin-api'

type ExpertData = { assigned: ExpertMapping[]; available: ExpertMapping[] }
type ModalMode = 'form' | 'experts' | null

const blank = {
  ten_goi: '',
  ma_goi: '',
  slug: '',
  loai_goi: 'suc_khoe',
  mo_ta: '',
  quyen_loi: '1 buổi tư vấn\nTheo dõi tiến trình\nGợi ý cá nhân hóa',
  gia: 300000,
  gia_khuyen_mai: '',
  thoi_han_ngay: 30,
  so_luot_tu_van: 1,
  thoi_luong_tu_van_phut: 45,
  trang_thai: 'ban_nhap',
  goi_noi_bat: false,
  thu_tu_hien_thi: 1,
}

export default function ServicePackagesPage() {
  const [packages, setPackages] = useState<AdminPackage[]>([])
  const [selected, setSelected] = useState<AdminPackage | null>(null)
  const [experts, setExperts] = useState<ExpertData | null>(null)
  const [form, setForm] = useState<Record<string, any>>(blank)
  const [expertId, setExpertId] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatusFilter] = useState('')
  const [type, setTypeFilter] = useState('')
  const [modal, setModal] = useState<ModalMode>(null)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (type) params.set('type', type)
      setPackages(await adminGet<AdminPackage[]>(`/service-packages${params.toString() ? `?${params}` : ''}`))
    } finally {
      setLoading(false)
    }
  }

  async function loadExperts(packageId: number) {
    setExperts(await adminGet<ExpertData>(`/service-packages/${packageId}/experts`))
  }

  useEffect(() => { load().catch((err) => setMessage(err.message)) }, [status, type])

  function openCreate() {
    setSelected(null)
    setForm(blank)
    setErrors({})
    setModal('form')
  }

  function openEdit(pkg: AdminPackage) {
    setSelected(pkg)
    setForm({
      ...pkg,
      quyen_loi: Array.isArray(pkg.quyen_loi) ? pkg.quyen_loi.join('\n') : '',
      gia_khuyen_mai: pkg.gia_khuyen_mai ?? '',
      goi_noi_bat: Boolean(pkg.goi_noi_bat),
    })
    setErrors({})
    setModal('form')
  }

  async function openExperts(pkg: AdminPackage) {
    setSelected(pkg)
    setExpertId('')
    setErrors({})
    setModal('experts')
    await loadExperts(pkg.id)
  }

  const payload = useMemo(() => ({
    ...form,
    quyen_loi: String(form.quyen_loi).split('\n').map((item) => item.trim()).filter(Boolean),
    gia: Number(form.gia),
    gia_khuyen_mai: form.gia_khuyen_mai === '' ? null : Number(form.gia_khuyen_mai),
    thoi_han_ngay: Number(form.thoi_han_ngay),
    so_luot_tu_van: Number(form.so_luot_tu_van),
    thoi_luong_tu_van_phut: Number(form.thoi_luong_tu_van_phut),
    thu_tu_hien_thi: Number(form.thu_tu_hien_thi),
  }), [form])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    const nextErrors: Record<string, string> = {}
    if (String(form.ten_goi).trim().length < 3) nextErrors.ten_goi = 'Tên gói cần ít nhất 3 ký tự.'
    if (!String(form.ma_goi).trim()) nextErrors.ma_goi = 'Vui lòng nhập mã gói để admin dễ đối soát.'
    if (!String(form.slug).trim()) nextErrors.slug = 'Vui lòng nhập slug để tạo URL/định danh gói.'
    if (!String(form.mo_ta).trim()) nextErrors.mo_ta = 'Mô tả giúp khách hiểu gói trước khi mua.'
    if (!String(form.quyen_loi).split('\n').some((item) => item.trim())) nextErrors.quyen_loi = 'Cần ít nhất 1 quyền lợi.'
    if (Number(form.gia) <= 0) nextErrors.gia = 'Giá gói phải lớn hơn 0.'
    if (form.gia_khuyen_mai !== '' && Number(form.gia_khuyen_mai) >= Number(form.gia)) nextErrors.gia_khuyen_mai = 'Giá khuyến mãi phải nhỏ hơn giá gốc.'
    if (Number(form.thoi_han_ngay) <= 0) nextErrors.thoi_han_ngay = 'Thời hạn phải lớn hơn 0 ngày.'
    if (Number(form.so_luot_tu_van) <= 0) nextErrors.so_luot_tu_van = 'Số lượt tư vấn phải lớn hơn 0.'
    if (Number(form.thoi_luong_tu_van_phut) < 15) nextErrors.thoi_luong_tu_van_phut = 'Thời lượng nên tối thiểu 15 phút.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    try {
      if (selected) await adminPatch(`/service-packages/${selected.id}`, payload)
      else await adminPost('/service-packages', payload)
      setMessage('Đã lưu gói dịch vụ.')
      setModal(null)
      await load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không thể lưu gói.')
    }
  }

  async function updateStatus(pkg: AdminPackage, nextStatus: string) {
    await adminPatch(`/service-packages/${pkg.id}/status`, { trang_thai: nextStatus })
    await load()
  }

  async function assignExpert() {
    if (!selected) return
    if (!expertId) {
      setErrors({ expertId: 'Vui lòng chọn chuyên gia trước khi gán vào gói.' })
      return
    }
    await adminPost(`/service-packages/${selected.id}/experts`, { chuyen_gia_id: Number(expertId) })
    setExpertId('')
    setErrors({})
    await loadExperts(selected.id)
  }

  return (
    <>
      <PageHeader eyebrow='Service catalog' title='Quản lý gói dịch vụ' description='Danh sách dạng bảng để quản trị nhiều gói. Tạo, sửa, bật/ngừng bán hoặc gán chuyên gia qua modal để không vỡ bố cục khi dữ liệu lớn.' action={<ActionButton tone='accent' onClick={openCreate}>Tạo gói mới</ActionButton>} />
      {message ? <Notice>{message}</Notice> : null}
      <div className='mb-5 grid gap-4 md:grid-cols-3'>
        <StatCard label='Tổng gói' value={String(packages.length)} />
        <StatCard label='Đang bán' value={String(packages.filter((pkg) => pkg.trang_thai === 'dang_ban').length)} tone='green' />
        <StatCard label='Ngừng bán/nháp' value={String(packages.filter((pkg) => pkg.trang_thai !== 'dang_ban').length)} tone='orange' />
      </div>

      <Panel title='Danh sách gói dịch vụ' description='Dùng filter để tìm nhanh, mọi thao tác nằm ở cột hành động.'>
        <Toolbar>
          <input className={inputClass} placeholder='Tìm tên gói, mã gói hoặc slug' value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') load() }} />
          <select className={inputClass} value={status} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value=''>Tất cả trạng thái</option>
            <option value='ban_nhap'>Bản nháp</option>
            <option value='dang_ban'>Đang bán</option>
            <option value='ngung_ban'>Ngừng bán</option>
          </select>
          <select className={inputClass} value={type} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value=''>Tất cả loại gói</option>
            <option value='suc_khoe'>Tư vấn sức khỏe</option>
            <option value='dinh_duong'>Tư vấn dinh dưỡng</option>
            <option value='tap_luyen'>Tư vấn tập luyện</option>
          </select>
          <ActionButton tone='secondary' onClick={load}>Lọc</ActionButton>
        </Toolbar>
        <DataTable minWidth='1040px'>
          <thead><tr><Th>Gói dịch vụ</Th><Th>Loại</Th><Th>Giá</Th><Th>Thời hạn</Th><Th>Lượt</Th><Th>Trạng thái</Th><Th className='text-right'>Hành động</Th></tr></thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id} className='transition-colors duration-200 hover:bg-blue-50/40'>
                <Td><div><p className='font-semibold text-slate-950'>{pkg.ten_goi}</p><p className='font-mono text-xs text-slate-500'>{pkg.ma_goi} · {pkg.slug}</p></div></Td>
                <Td>{pkg.loai_goi}</Td>
                <Td><b>{money(pkg.gia)}</b>{pkg.gia_khuyen_mai ? <p className='text-xs text-[#F97316]'>KM {money(pkg.gia_khuyen_mai)}</p> : null}</Td>
                <Td>{pkg.thoi_han_ngay} ngày</Td>
                <Td>{pkg.so_luot_tu_van} lượt</Td>
                <Td><StatusPill value={pkg.trang_thai} /></Td>
                <Td className='text-right'><div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => openEdit(pkg)}>Sửa</ActionButton><ActionButton tone='secondary' onClick={() => openExperts(pkg)}>Chuyên gia</ActionButton><ActionButton tone={pkg.trang_thai === 'dang_ban' ? 'danger' : 'primary'} onClick={() => updateStatus(pkg, pkg.trang_thai === 'dang_ban' ? 'ngung_ban' : 'dang_ban')}>{pkg.trang_thai === 'dang_ban' ? 'Ngừng bán' : 'Bật bán'}</ActionButton></div></Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {!packages.length && !loading ? <div className='mt-4'><EmptyState text='Chưa có gói dịch vụ phù hợp.' /></div> : null}
      </Panel>

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={selected ? `Sửa gói: ${selected.ten_goi}` : 'Tạo gói dịch vụ'} description='Thông tin trong form sẽ áp dụng cho giao dịch mới sau khi lưu.'>
        <form className='space-y-4' onSubmit={submit}>
          <Field label='Tên gói' error={errors.ten_goi}><input className={inputClass} value={form.ten_goi} onChange={(e) => setForm({ ...form, ten_goi: e.target.value })} /></Field>
          <div className='grid gap-4 md:grid-cols-2'><Field label='Mã gói' error={errors.ma_goi}><input className={inputClass} value={form.ma_goi} onChange={(e) => setForm({ ...form, ma_goi: e.target.value })} /></Field><Field label='Slug' error={errors.slug}><input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field></div>
          <Field label='Loại gói'><select className={inputClass} value={form.loai_goi} onChange={(e) => setForm({ ...form, loai_goi: e.target.value })}><option value='suc_khoe'>Tư vấn sức khỏe</option><option value='dinh_duong'>Tư vấn dinh dưỡng</option><option value='tap_luyen'>Tư vấn tập luyện</option></select></Field>
          <Field label='Mô tả' error={errors.mo_ta}><textarea className={inputClass} rows={3} value={form.mo_ta ?? ''} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} /></Field>
          <Field label='Quyền lợi, mỗi dòng một ý' error={errors.quyen_loi}><textarea className={inputClass} rows={4} value={form.quyen_loi} onChange={(e) => setForm({ ...form, quyen_loi: e.target.value })} /></Field>
          <div className='grid gap-4 md:grid-cols-3'><Field label='Giá' error={errors.gia}><input type='number' className={inputClass} value={form.gia} onChange={(e) => setForm({ ...form, gia: e.target.value })} /></Field><Field label='Giá khuyến mãi' error={errors.gia_khuyen_mai}><input type='number' className={inputClass} value={form.gia_khuyen_mai} onChange={(e) => setForm({ ...form, gia_khuyen_mai: e.target.value })} /></Field><Field label='Thời hạn ngày' error={errors.thoi_han_ngay}><input type='number' className={inputClass} value={form.thoi_han_ngay} onChange={(e) => setForm({ ...form, thoi_han_ngay: e.target.value })} /></Field></div>
          <div className='grid gap-4 md:grid-cols-3'><Field label='Số lượt tư vấn' error={errors.so_luot_tu_van}><input type='number' className={inputClass} value={form.so_luot_tu_van} onChange={(e) => setForm({ ...form, so_luot_tu_van: e.target.value })} /></Field><Field label='Thời lượng/phút' error={errors.thoi_luong_tu_van_phut}><input type='number' className={inputClass} value={form.thoi_luong_tu_van_phut} onChange={(e) => setForm({ ...form, thoi_luong_tu_van_phut: e.target.value })} /></Field><Field label='Thứ tự hiển thị'><input type='number' className={inputClass} value={form.thu_tu_hien_thi} onChange={(e) => setForm({ ...form, thu_tu_hien_thi: e.target.value })} /></Field></div>
          <div className='flex justify-end gap-2'><ActionButton tone='secondary' onClick={() => setModal(null)}>Hủy</ActionButton><ActionButton type='submit'>Lưu gói</ActionButton></div>
        </form>
      </Modal>

      <Modal open={modal === 'experts'} onClose={() => setModal(null)} title={selected ? `Gán chuyên gia: ${selected.ten_goi}` : 'Gán chuyên gia'} description='Chỉ chuyên gia đang hoạt động và nhận booking mới có thể được gán.' width='max-w-4xl'>
        {selected ? <div className='space-y-5'><Toolbar><Field label='Chuyên gia' error={errors.expertId}><select className={inputClass} value={expertId} onChange={(e) => setExpertId(e.target.value)}><option value=''>Chọn chuyên gia đang hoạt động</option>{experts?.available.map((expert) => <option key={expert.id} value={expert.id}>{expert.ho_ten} · {expert.chuyen_mon}</option>)}</select></Field><div className='flex items-end'><ActionButton onClick={assignExpert}>Gán vào gói</ActionButton></div></Toolbar><DataTable minWidth='760px'><thead><tr><Th>Chuyên gia</Th><Th>Chuyên môn</Th><Th>Rating</Th><Th>Trạng thái</Th><Th className='text-right'>Hành động</Th></tr></thead><tbody>{experts?.assigned.map((expert) => <tr key={expert.chuyen_gia_id} className='hover:bg-blue-50/40'><Td><b>{expert.ho_ten}</b><p className='text-xs text-slate-500'>{expert.email}</p></Td><Td>{expert.chuyen_mon}</Td><Td>{expert.diem_danh_gia_trung_binh}</Td><Td><StatusPill value={expert.trang_thai} /></Td><Td className='text-right'><ActionButton tone='secondary' onClick={() => adminDelete(`/service-packages/${selected.id}/experts/${expert.chuyen_gia_id}`).then(() => loadExperts(selected.id))}>Tạm dừng</ActionButton></Td></tr>)}</tbody></DataTable></div> : null}
      </Modal>
    </>
  )
}
