'use client'

import { apiRequest } from './auth'

export type AdminPackage = {
  id: number
  ma_goi: string
  ten_goi: string
  slug: string
  loai_goi: 'suc_khoe' | 'dinh_duong' | 'tap_luyen'
  mo_ta: string | null
  quyen_loi: string[]
  gia: number
  gia_khuyen_mai: number | null
  thoi_han_ngay: number
  so_luot_tu_van: number
  thoi_luong_tu_van_phut: number
  trang_thai: 'ban_nhap' | 'dang_ban' | 'ngung_ban'
  goi_noi_bat: boolean | number
  thu_tu_hien_thi: number
}

export type ExpertMapping = {
  id: number
  chuyen_gia_id: number
  ho_ten: string
  email: string
  chuyen_mon: string | null
  trang_thai: 'hoat_dong' | 'tam_dung'
  ty_le_hoa_hong_override: number | null
  diem_danh_gia_trung_binh: number
}

export async function adminGet<T>(path: string) {
  const response = await apiRequest<T>(`/admin${path}`)
  return response.data
}

export async function adminPost<T>(path: string, body?: unknown) {
  const response = await apiRequest<T>(`/admin${path}`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })
  return response.data
}

export async function adminPatch<T>(path: string, body?: unknown) {
  const response = await apiRequest<T>(`/admin${path}`, {
    method: 'PATCH',
    body: JSON.stringify(body ?? {}),
  })
  return response.data
}

export async function adminDelete<T>(path: string) {
  const response = await apiRequest<T>(`/admin${path}`, { method: 'DELETE' })
  return response.data
}
