import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = { success: true; message: string; data: T }
type ApiErrorResponse = { success: false; message?: string | string[] }

export type CallParticipant = {
  id: number
  ho_ten: string
  vai_tro: 'nguoi_dung' | 'chuyen_gia_dinh_duong'
  anh_dai_dien_url: string | null
}

export type ConsultationCallRoom = {
  booking: {
    id: number
    ma_lich_hen: string
    ngay_hen: string
    gio_bat_dau: string
    gio_ket_thuc: string
    trang_thai: string
  }
  participant: CallParticipant
  counterpart: CallParticipant
  room: {
    name: string
  }
  room_state: {
    can_join: boolean
    room_locked: boolean
    lock_reason: string | null
    room_end_at: string
    current_time: string
  }
}

export type ConsultationCallTokenSession = {
  server_url: string
  room_name: string
  token: string
  participant: CallParticipant
  counterpart: CallParticipant
  room_state: ConsultationCallRoom['room_state']
  booking: ConsultationCallRoom['booking']
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null

  if (!response.ok) {
    const rawMessage = payload?.message
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage || `Lỗi ${response.status}`
    throw new ApiError(message, response.status)
  }

  return payload as ApiSuccessResponse<T>
}

export async function getConsultationCallRoom(bookingId: number) {
  const response = await request<ConsultationCallRoom>(`/consultation-call/bookings/${bookingId}`)
  return response.data
}

export async function createConsultationCallToken(bookingId: number) {
  const response = await request<ConsultationCallTokenSession>(
    `/consultation-call/bookings/${bookingId}/token`,
    { method: 'POST' },
  )
  return response.data
}

