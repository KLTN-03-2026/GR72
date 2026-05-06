'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles, Plus, Archive, RefreshCw, MessageSquare, User, Heart, Apple, Dumbbell, Stethoscope } from 'lucide-react'
import { customerGet, customerPatch, customerPost } from '@/lib/customer-api'
import { Card, SectionHeader, UserButton } from '@/components/user/user-ui'

type Row = Record<string, any>

const CONTEXT_PRESETS: { value: string; label: string; desc: string; icon: React.ComponentType<{ size?: number }>; color: string }[] = [
  { value: 'tu_van_chung', label: 'Tư vấn chung', desc: 'Câu hỏi sức khỏe tổng quát', icon: Stethoscope, color: '#6366f1' },
  { value: 'dinh_duong', label: 'Dinh dưỡng', desc: 'Chế độ ăn, calo, dinh dưỡng', icon: Apple, color: '#16a34a' },
  { value: 'tap_luyen', label: 'Tập luyện', desc: 'Bài tập, lịch tập, vận động', icon: Dumbbell, color: '#ea580c' },
  { value: 'suc_khoe', label: 'Sức khỏe', desc: 'Theo dõi chỉ số, lối sống', icon: Heart, color: '#ec4899' },
]

function contextLabel(value: string) {
  return CONTEXT_PRESETS.find((c) => c.value === value)?.label ?? value
}

export default function UserAiChatPage() {
  const [sessions, setSessions] = useState<Row[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Row[]>([])
  const [input, setInput] = useState('')
  const [msg, setMsg] = useState<{ text: string; tone: 'success' | 'error' } | null>(null)
  const [sending, setSending] = useState(false)
  const [showStarter, setShowStarter] = useState(false)
  const [starterContext, setStarterContext] = useState('tu_van_chung')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  async function loadSessions() {
    const rows = await customerGet<Row[]>('/ai-chat/sessions')
    setSessions(rows)
    if (!currentSessionId && rows.length) {
      setCurrentSessionId(Number(rows[0].id))
    } else if (!rows.length) {
      setShowStarter(true)
    }
  }

  async function loadMessages(sessionId: number) {
    setMessages(await customerGet<Row[]>(`/ai-chat/sessions/${sessionId}/messages`))
  }

  async function loadSuggestions(sessionId: number | null) {
    setLoadingSuggestions(true)
    try {
      const data = await customerGet<{ questions: string[] }>(
        sessionId ? `/ai-chat/suggested-questions?sessionId=${sessionId}` : '/ai-chat/suggested-questions',
      )
      setSuggestions(data.questions ?? [])
    } catch {
      setSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }

  useEffect(() => {
    loadSessions().catch((e) => setMsg({ text: e.message, tone: 'error' }))
  }, [])

  useEffect(() => {
    if (!currentSessionId) {
      setMessages([])
      return
    }
    loadMessages(currentSessionId).catch((e) => setMsg({ text: e.message, tone: 'error' }))
    loadSuggestions(currentSessionId)
  }, [currentSessionId])

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  async function createSession(contextType: string, firstMessage?: string) {
    try {
      const preset = CONTEXT_PRESETS.find((c) => c.value === contextType)
      const s = await customerPost<Row>('/ai-chat/sessions', {
        tieu_de: preset?.label ?? 'Phiên chat AI',
        loai_context: contextType,
      })
      setShowStarter(false)
      const newId = Number(s.id)
      setCurrentSessionId(newId)
      await loadSessions()

      if (firstMessage) {
        // Gửi câu hỏi đầu tiên ngay
        await sendToSession(newId, firstMessage)
      }
    } catch (e: any) {
      setMsg({ text: e.message ?? 'Tạo phiên thất bại', tone: 'error' })
    }
  }

  async function sendToSession(sessionId: number, content: string) {
    setSending(true)
    try {
      const rows = await customerPost<Row[]>(`/ai-chat/sessions/${sessionId}/messages`, { noi_dung: content })
      setMessages(rows)
      setInput('')
      // Reload suggestions for follow-up
      loadSuggestions(sessionId)
    } catch (e: any) {
      setMsg({ text: e.message ?? 'Gửi tin nhắn thất bại', tone: 'error' })
    } finally {
      setSending(false)
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    if (!input.trim() || sending) return
    if (!currentSessionId) {
      // Tự động tạo phiên + gửi
      await createSession('tu_van_chung', input.trim())
      return
    }
    await sendToSession(currentSessionId, input.trim())
  }

  function pickSuggestion(question: string) {
    if (!currentSessionId) {
      createSession('tu_van_chung', question)
    } else {
      sendToSession(currentSessionId, question)
    }
  }

  async function archiveSession() {
    if (!currentSessionId) return
    try {
      await customerPatch(`/ai-chat/sessions/${currentSessionId}/archive`, {})
      setMsg({ text: 'Đã lưu trữ phiên chat.', tone: 'success' })
      setCurrentSessionId(null)
      setMessages([])
      await loadSessions()
    } catch (e: any) {
      setMsg({ text: e.message ?? 'Thất bại', tone: 'error' })
    }
  }

  const currentSession = sessions.find((s) => Number(s.id) === currentSessionId)
  const isArchived = currentSession?.trang_thai === 'da_luu_tru'

  return (
    <>
      <SectionHeader
        title='Trợ lý AI sức khỏe'
        subtitle='Hỏi đáp nhanh về sức khỏe, dinh dưỡng và tập luyện. AI gợi ý dựa trên hồ sơ của bạn — chỉ mang tính tham khảo.'
      />

      {msg ? (
        <div style={{
          marginBottom: 16,
          padding: '12px 16px',
          borderRadius: 12,
          background: msg.tone === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${msg.tone === 'error' ? '#fca5a5' : '#86efac'}`,
          color: msg.tone === 'error' ? '#991b1b' : '#166534',
          fontSize: 14,
        }}>
          {msg.text}
        </div>
      ) : null}

      {/* Starter modal nếu chưa có session */}
      {showStarter && (
        <Card>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64, height: 64, margin: '0 auto 16px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={28} color='white' />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Bạn muốn tư vấn về điều gì?
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              Chọn chủ đề để AI hiểu rõ ngữ cảnh và trả lời chính xác hơn.
            </p>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', maxWidth: 720, margin: '0 auto' }}>
              {CONTEXT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => createSession(preset.value)}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all .15s',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = preset.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${preset.color}15`,
                    color: preset.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <preset.icon size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{preset.label}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>{preset.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!showStarter && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Sessions sidebar */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Phiên chat</h3>
              <button
                onClick={() => setShowStarter(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                <Plus size={12} /> Mới
              </button>
            </div>
            <div style={{ display: 'grid', gap: 6, maxHeight: 500, overflow: 'auto' }}>
              {sessions.length === 0 ? (
                <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 20 }}>
                  Chưa có phiên chat nào.
                </p>
              ) : sessions.map((s) => {
                const isActive = Number(s.id) === currentSessionId
                const preset = CONTEXT_PRESETS.find((c) => c.value === s.loai_context)
                const Icon = preset?.icon ?? MessageSquare
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSessionId(Number(s.id))}
                    style={{
                      textAlign: 'left',
                      border: `1px solid ${isActive ? '#6366f1' : '#e2e8f0'}`,
                      borderRadius: 10,
                      padding: 10,
                      background: isActive ? '#eef2ff' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `${preset?.color ?? '#94a3b8'}15`,
                      color: preset?.color ?? '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={14} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.tieu_de}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {contextLabel(s.loai_context)} {s.trang_thai === 'da_luu_tru' && '· Đã lưu trữ'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            {currentSessionId && !isArchived ? (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={archiveSession}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  <Archive size={12} /> Lưu trữ phiên này
                </button>
              </div>
            ) : null}
          </Card>

          {/* Chat area */}
          <Card>
            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                minHeight: 380,
                maxHeight: 520,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 12,
                padding: 4,
              }}
            >
              {messages.length === 0 && currentSessionId ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Bot size={36} color='#cbd5e1' style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                    Chưa có tin nhắn. Bắt đầu bằng câu hỏi hoặc chọn gợi ý bên dưới.
                  </p>
                </div>
              ) : null}

              {messages.map((m) => {
                const isUser = m.vai_tro === 'user'
                const meta = typeof m.metadata === 'string' ? safeParse(m.metadata) : m.metadata
                const isFallback = meta?.fallback === true
                return (
                  <div key={m.id} style={{ display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: isUser ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                      color: isUser ? 'white' : '#059669',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isUser ? <User size={15} /> : <Bot size={15} />}
                    </div>
                    <div style={{
                      maxWidth: '78%',
                      borderRadius: 14,
                      padding: '10px 14px',
                      background: isUser ? '#6366f1' : '#f8fafc',
                      color: isUser ? 'white' : '#0f172a',
                      border: isUser ? 'none' : '1px solid #e2e8f0',
                    }}>
                      <div style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                        {m.noi_dung}
                      </div>
                      {!isUser && isFallback ? (
                        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>
                          ⚠️ Phản hồi dự phòng (chưa kết nối được GPT)
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })}

              {sending ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                    color: '#059669',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bot size={15} />
                  </div>
                  <div style={{
                    borderRadius: 14,
                    padding: '12px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                  }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1.4s infinite' }} />
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1.4s infinite', animationDelay: '.2s' }} />
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1.4s infinite', animationDelay: '.4s' }} />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Suggested questions */}
            {suggestions.length > 0 && !isArchived ? (
              <div style={{ marginBottom: 12, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Sparkles size={13} color='#8b5cf6' />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Gợi ý câu hỏi</span>
                  <button
                    onClick={() => loadSuggestions(currentSessionId)}
                    disabled={loadingSuggestions}
                    title='Tạo gợi ý mới'
                    style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                  >
                    <RefreshCw size={12} className={loadingSuggestions ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {suggestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => pickSuggestion(q)}
                      disabled={sending || isArchived}
                      style={{
                        fontSize: 12,
                        padding: '6px 12px',
                        borderRadius: 999,
                        border: '1px solid #e0e7ff',
                        background: '#f5f3ff',
                        color: '#5b21b6',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Input */}
            {isArchived ? (
              <div style={{ padding: 12, borderRadius: 10, background: '#f1f5f9', textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                Phiên chat đã được lưu trữ. Tạo phiên mới để tiếp tục.
              </div>
            ) : (
              <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='Nhập câu hỏi sức khỏe của bạn...'
                  disabled={sending}
                  style={{
                    flex: 1,
                    border: '1px solid #cbd5e1',
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  type='submit'
                  disabled={sending || !input.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0 18px',
                    borderRadius: 12,
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: sending || !input.trim() ? 0.6 : 1,
                  }}
                >
                  <Send size={15} />
                  {sending ? 'Đang gửi...' : 'Gửi'}
                </button>
              </form>
            )}
          </Card>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
    </>
  )
}

function safeParse(value: string) {
  try { return JSON.parse(value) } catch { return null }
}
