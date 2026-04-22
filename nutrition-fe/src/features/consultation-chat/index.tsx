'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CalendarClock,
  FileText,
  LoaderCircle,
  Lock,
  MessageSquare,
  SendHorizonal,
  WifiOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  createConsultationChatSocketUrl,
  markConsultationChatSeen,
  getConsultationChatRoom,
  type ChatMessage,
  type ChatParticipant,
  type ConsultationChatRoom,
  type SendChatMessagePayload,
} from '@/services/consultation-chat/api'

type Props = {
  bookingId: number
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

function roomStateLabel(room?: ConsultationChatRoom | null) {
  if (!room) return 'Đang tải'
  if (room.room_state.room_locked && room.room_state.lock_reason === 'after_end') {
    return 'Đã khóa sau giờ hẹn'
  }
  if (room.room_state.room_locked) {
    return 'Phòng chat đã khóa'
  }
  if (!room.room_state.can_chat) {
    return 'Chờ check-in'
  }
  return 'Đang mở'
}

function isSameMessage(left: ChatMessage, right: ChatMessage) {
  return left.id === right.id
}

function applySeenState(
  messages: ChatMessage[],
  readerId: number,
  upToMessageId: number,
  seenAt: string,
) {
  return messages.map((message) =>
    message.nguoi_gui.id !== readerId && message.id <= upToMessageId
      ? { ...message, da_doc_luc: seenAt }
      : message,
  )
}

async function fileToAttachment(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Không thể đọc file'))
    reader.readAsDataURL(file)
  })

  return {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    dataUrl,
  }
}

function ParticipantChip({ participant }: { participant: ChatParticipant }) {
  return (
    <div className='flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-3 shadow-sm'>
      <Avatar className='size-9 border'>
        <AvatarImage src={participant.anh_dai_dien_url ?? undefined} alt={participant.ho_ten} />
        <AvatarFallback>{getInitials(participant.ho_ten)}</AvatarFallback>
      </Avatar>
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium'>{participant.ho_ten}</p>
        <p className='text-xs text-muted-foreground'>
          {participant.vai_tro === 'nguoi_dung' ? 'Người dùng' : 'Nutritionist'}
        </p>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isSelf,
  showStatus,
}: {
  message: ChatMessage
  isSelf: boolean
  showStatus: boolean
}) {
  const attachment = message.tep_dinh_kem
  const isFile = message.loai === 'file' && attachment

  return (
    <div className={cn('flex', isSelf ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[min(88%,42rem)] rounded-xl border px-4 py-3 shadow-sm',
          isSelf
            ? 'border-border/70 bg-muted/40 text-foreground'
            : 'border-border/70 bg-background',
        )}
      >
        <div className='flex items-center justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-2'>
            <Avatar className='size-7 border border-border/60'>
              <AvatarImage src={message.nguoi_gui.anh_dai_dien_url ?? undefined} alt={message.nguoi_gui.ho_ten} />
              <AvatarFallback className='text-[10px]'>{getInitials(message.nguoi_gui.ho_ten)}</AvatarFallback>
            </Avatar>
            <p className={cn('truncate text-sm font-medium')}>
              {message.nguoi_gui.ho_ten}
            </p>
          </div>
          <p
            className={cn(
              'shrink-0 text-xs',
              'text-muted-foreground',
            )}
          >
            {formatTime(message.tao_luc)}
          </p>
        </div>

        {message.noi_dung ? (
          <p
            className={cn(
              'mt-2 whitespace-pre-wrap text-sm leading-6',
              'text-foreground',
            )}
          >
            {message.noi_dung}
          </p>
        ) : null}

        {isFile ? (
          <a
            href={attachment.dataUrl}
            download={attachment.name}
            className={cn(
              'mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
              isSelf
                ? 'border-border/70 bg-background text-foreground hover:border-primary/40'
                : 'border-border/70 bg-muted/30 text-foreground hover:border-primary/40',
            )}
            target='_blank'
            rel='noreferrer'
          >
            <FileText className='size-4' />
            {attachment.name}
          </a>
        ) : null}

        {showStatus ? (
          <p
            className={cn(
              'mt-2 text-right text-xs',
              'text-muted-foreground',
            )}
          >
            {message.da_doc_luc ? 'Đã xem' : 'Đã gửi'}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function ConsultationChat({
  bookingId,
}: Props) {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const shouldReconnectRef = useRef(false)
  const pollTimerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const roomRef = useRef<ConsultationChatRoom | null>(null)
  const [room, setRoom] = useState<ConsultationChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [socketRetryToken, setSocketRetryToken] = useState(0)

  const canChat = room?.room_state.can_chat ?? false
  const currentRoomLabel = useMemo(() => roomStateLabel(room), [room])

  useEffect(() => {
    roomRef.current = room
  }, [room])

  const syncSeenState = useCallback(
    async (sourceRoom: ConsultationChatRoom, sourceMessages: ChatMessage[]) => {
      if (!sourceRoom.messages.length) {
        return
      }

      const unreadMessages = sourceMessages.filter(
        (message) => message.nguoi_gui.id !== sourceRoom.participant.id && !message.da_doc_luc,
      )
      const lastUnreadMessage = unreadMessages[unreadMessages.length - 1]

      if (!lastUnreadMessage) {
        return
      }

      try {
        const result = await markConsultationChatSeen(bookingId, lastUnreadMessage.id)
        setRoom((current) =>
          current
            ? {
                ...current,
                room_state: {
                  ...current.room_state,
                  unread_count: 0,
                },
                messages: applySeenState(
                  current.messages,
                  result.reader_id,
                  result.up_to_message_id ?? lastUnreadMessage.id,
                  result.seen_at,
                ),
              }
            : current,
        )
        setMessages((current) =>
          applySeenState(
            current,
            result.reader_id,
            result.up_to_message_id ?? lastUnreadMessage.id,
            result.seen_at,
          ),
        )
      } catch {
        // Ignore; chat still works without seen sync.
      }
    },
    [bookingId],
  )

  const loadRoom = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getConsultationChatRoom(bookingId)
      setRoom(data)
      setMessages(data.messages)
      setLoadError(null)
      void syncSeenState(data, data.messages)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải phòng chat'
      setLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [bookingId, syncSeenState])

  useEffect(() => {
    void loadRoom()
  }, [loadRoom])

  useEffect(() => {
    if (!room || room.room_state.can_chat || room.room_state.room_locked) {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
      return
    }

    pollTimerRef.current = window.setInterval(() => {
      void loadRoom()
    }, 15000)

    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [loadRoom, room])

  useEffect(() => {
    if (!canChat) {
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      shouldReconnectRef.current = false
      setSocketConnected(false)
      return
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const socketUrl = createConsultationChatSocketUrl(bookingId)
    const socket = new WebSocket(socketUrl)
    socketRef.current = socket
    shouldReconnectRef.current = true

    socket.onopen = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      setSocketConnected(true)
    }

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as
        | { type: 'room_state'; data: ConsultationChatRoom }
        | { type: 'message_created'; data: ChatMessage }
        | { type: 'messages_seen'; data: { reader_id: number; up_to_message_id: number; seen_at: string } }
        | { type: 'room_closed'; data: { reason: string; ended_at: string } }
        | { type: 'error'; message: string }
        | { type: 'pong' }

      if (payload.type === 'room_state') {
        setRoom(payload.data)
        setMessages(payload.data.messages)
        shouldReconnectRef.current = payload.data.room_state.can_chat
        void syncSeenState(payload.data, payload.data.messages)
        return
      }

      if (payload.type === 'message_created') {
        setMessages((current) =>
          current.some((item) => isSameMessage(item, payload.data))
            ? current
            : [...current, payload.data],
        )
        if (payload.data.nguoi_gui.id !== roomRef.current?.participant.id) {
          void markConsultationChatSeen(bookingId, payload.data.id)
        }
        return
      }

      if (payload.type === 'messages_seen') {
        setRoom((current) =>
          current
            ? {
                ...current,
                room_state: {
                  ...current.room_state,
                  unread_count:
                    payload.data.reader_id === current.participant.id
                      ? 0
                      : current.room_state.unread_count,
                },
              }
            : current,
        )
        setMessages((current) =>
          applySeenState(
            current,
            payload.data.reader_id,
            payload.data.up_to_message_id,
            payload.data.seen_at,
          ),
        )
        return
      }

      if (payload.type === 'room_closed') {
        shouldReconnectRef.current = false
        setRoom((current) =>
          current
            ? {
                ...current,
                room_state: {
                  ...current.room_state,
                  can_chat: false,
                  room_locked: true,
                  lock_reason: payload.data.reason,
                  room_end_at: payload.data.ended_at,
                },
                booking: {
                  ...current.booking,
                  can_chat: false,
                  room_locked: true,
                  lock_reason: payload.data.reason,
                  room_end_at: payload.data.ended_at,
                },
              }
            : current,
        )
        toast.message('Phòng chat đã được khóa')
        return
      }

      if (payload.type === 'error') {
        toast.error(payload.message)
      }
    }

    socket.onerror = () => {
      setSocketConnected(false)
    }

    socket.onclose = () => {
      setSocketConnected(false)
      if (!shouldReconnectRef.current) {
        return
      }

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        setSocketRetryToken((value) => value + 1)
      }, 3000)
    }

    return () => {
      socket.close()
      socketRef.current = null
      shouldReconnectRef.current = false
    }
  }, [bookingId, canChat, socketRetryToken, syncSeenState])

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
      }
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current)
      }
      socketRef.current?.close()
    }
  }, [])

  async function handleSend() {
    if (!room || !canChat) {
      toast.error('Phòng chat hiện chưa mở')
      return
    }

    const text = draft.trim()
    const file = attachment
    if (!text && !file) {
      toast.error('Hãy nhập tin nhắn hoặc chọn file')
      return
    }

    if (file && file.size > 10 * 1024 * 1024) {
      toast.error('File đính kèm không được vượt quá 10MB')
      return
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast.error('Kết nối chat chưa sẵn sàng')
      return
    }

    setSending(true)
    try {
      let payload: SendChatMessagePayload
      if (file) {
        const fileAttachment = await fileToAttachment(file)
        payload = {
          loai: 'file',
          noiDung: text || undefined,
          tepDinhKem: fileAttachment,
        }
      } else {
        payload = {
          loai: 'text',
          noiDung: text,
        }
      }

      socketRef.current.send(
        JSON.stringify({
          type: 'send_message',
          payload,
        }),
      )

      setDraft('')
      setAttachment(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  const statusTone =
    room?.room_state.room_locked && room.room_state.lock_reason === 'after_end'
      ? 'secondary'
      : room?.room_state.can_chat
        ? 'default'
        : 'outline'

  return (
    <section className='flex min-h-[calc(100vh-12rem)] flex-col gap-3'>
      <header className='flex items-center justify-between gap-4'>
        <p className='text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground'>
          Phòng chat booking
        </p>
        <Badge variant={statusTone}>{currentRoomLabel}</Badge>
      </header>

      {loading ? (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <LoaderCircle className='size-4 animate-spin' />
          Đang tải phòng chat...
        </div>
      ) : loadError && !room ? (
        <div className='rounded-xl border bg-background p-6 shadow-sm'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <WifiOff className='size-4' />
            {loadError}
          </div>
          <Button variant='outline' className='mt-4 w-fit' onClick={() => void loadRoom()}>
            Thử lại
          </Button>
        </div>
      ) : room ? (
        <div className='grid flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]'>
          <aside className='space-y-4 rounded-xl border bg-background p-4 shadow-sm'>
            <div className='rounded-lg bg-muted/30 px-4 py-3 text-sm'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <CalendarClock className='size-4' />
                <span className='font-mono text-xs'>{room.booking.ma_lich_hen}</span>
              </div>
              <p className='mt-2 font-medium'>
                {room.booking.ngay_hen} · {room.booking.gio_bat_dau.slice(0, 5)} -{' '}
                {room.booking.gio_ket_thuc.slice(0, 5)}
              </p>
            </div>

            <div className='space-y-3'>
              <ParticipantChip participant={room.participant} />
              <ParticipantChip participant={room.counterpart} />
            </div>

            {!room.room_state.can_chat && room.room_state.lock_reason === 'not_checked_in' ? (
              <p className='text-sm text-muted-foreground'>Chờ booking chuyển sang `da_checkin`.</p>
            ) : null}
            {!room.room_state.can_chat && room.room_state.room_locked ? (
              <p className='text-sm text-muted-foreground'>Phòng đã khóa, chỉ xem lịch sử.</p>
            ) : null}
          </aside>

          <main className='flex min-h-[70vh] flex-col overflow-hidden rounded-xl border bg-background shadow-sm'>
            <div className='flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(15,23,42,0.02),transparent_40%)] px-5 py-5'>
              <div className='space-y-3'>
                {messages.length === 0 ? (
                  <div className='flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background/80 text-center text-sm text-muted-foreground'>
                    <AlertCircle className='size-5' />
                    <p>Chưa có tin nhắn nào trong phòng chat này.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isSelf={message.nguoi_gui.id === room.participant.id}
                      showStatus={message.nguoi_gui.id === room.participant.id}
                    />
                  ))
                )}
              </div>
            </div>

            <div className='border-t bg-muted/20 px-5 py-4'>
              <div className='mt-3 space-y-3'>
                <div className='relative rounded-xl border border-border/70 bg-background p-3 pr-24 shadow-sm'>
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    disabled={!room.room_state.can_chat || sending}
                    rows={2}
                    placeholder='Nhập tin nhắn...'
                    className='min-h-16 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0'
                  />

                  <div className='absolute right-3 top-3 flex items-center gap-2'>
                    {attachment ? (
                      <Badge variant='secondary' className='max-w-28 truncate'>
                        {attachment.name}
                      </Badge>
                    ) : null}
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      className='size-8 rounded-lg'
                      disabled={!room.room_state.can_chat || sending}
                      onClick={() => fileInputRef.current?.click()}
                      aria-label='Chọn tệp'
                    >
                      <FileText className='size-4' />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type='file'
                      className='hidden'
                      disabled={!room.room_state.can_chat || sending}
                      onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>

                <div className='flex items-center justify-end gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={!room.room_state.can_chat || sending}
                    onClick={() => {
                      setDraft('')
                      setAttachment(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    Xóa
                  </Button>
                  <Button size='sm' disabled={!room.room_state.can_chat || sending} onClick={() => void handleSend()}>
                    {sending ? (
                      <>
                        <LoaderCircle className='mr-1.5 size-4 animate-spin' />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <SendHorizonal className='mr-1.5 size-4' />
                        Gửi
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <WifiOff className='size-4' />
          Không tải được phòng chat.
        </div>
      )}
    </section>
  )
}
