import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = { success: true; message: string; data: T }
type ApiErrorResponse = { success: false; message?: string | string[] }

export type ChatAttachment = {
  name: string
  mimeType: string
  size: number
  dataUrl: string
}

export type ChatParticipant = {
  id: number
  ho_ten: string
  vai_tro: 'nguoi_dung' | 'chuyen_gia_dinh_duong'
  anh_dai_dien_url: string | null
}

export type ChatMessage = {
  id: number
  lich_hen_id: number
  nguoi_gui: ChatParticipant
  loai: 'text' | 'file'
  noi_dung: string | null
  tep_dinh_kem: ChatAttachment | null
  da_doc_luc: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export type ChatRoomState = {
  can_chat: boolean
  room_locked: boolean
  lock_reason: string | null
  room_end_at: string
  unread_count: number
}

export type ConsultationChatRoom = {
  booking: {
    id: number
    ma_lich_hen: string
    ngay_hen: string
    gio_bat_dau: string
    gio_ket_thuc: string
    trang_thai: string
    can_chat: boolean
    room_locked: boolean
    lock_reason: string | null
    current_time: string
    room_end_at: string
  }
  participant: {
    id: number
    vai_tro: 'nguoi_dung' | 'chuyen_gia_dinh_duong'
    ho_ten: string
    anh_dai_dien_url: string | null
  }
  counterpart: ChatParticipant
  messages: ChatMessage[]
  room_state: ChatRoomState
}

export type SendChatMessagePayload = {
  loai?: 'text' | 'file'
  noiDung?: string
  tepDinhKem?: ChatAttachment | null
}

export type MarkChatSeenResponse = {
  booking_id: number
  reader_id: number
  up_to_message_id: number | null
  seen_at: string
  affected: number
}

function buildBaseUrl() {
  const env = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
  return env || 'http://localhost:8009'
}

function buildWsUrl(path: string) {
  const base = buildBaseUrl().replace(/^http/i, 'ws')
  return `${base}/api${path}`
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

export async function getConsultationChatRoom(bookingId: number) {
  const response = await request<ConsultationChatRoom>(`/consultation-chat/bookings/${bookingId}`)
  return response.data
}

export async function getConsultationChatMessages(bookingId: number) {
  const response = await request<ConsultationChatRoom>(`/consultation-chat/bookings/${bookingId}/messages`)
  return response.data
}

export async function sendConsultationChatMessage(
  bookingId: number,
  payload: SendChatMessagePayload,
) {
  const response = await request<ChatMessage>(
    `/consultation-chat/bookings/${bookingId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  return response.data
}

export async function markConsultationChatSeen(
  bookingId: number,
  upToMessageId?: number,
) {
  const query = upToMessageId ? `?upToMessageId=${encodeURIComponent(String(upToMessageId))}` : ''
  const response = await request<MarkChatSeenResponse>(
    `/consultation-chat/bookings/${bookingId}/seen${query}`,
    {
      method: 'POST',
    },
  )

  return response.data
}

export function createConsultationChatSocketUrl(bookingId: number) {
  return buildWsUrl(`/consultation-chat/bookings/${bookingId}/ws`)
}
