'use client'

import { FormEvent, useEffect, useState } from 'react'
import { customerGet, customerPatch, customerPost } from '@/lib/customer-api'
import { Card, SectionHeader, UserButton } from '@/components/user/user-ui'

type Row = Record<string, any>

export default function UserAiChatPage() {
  const [sessions, setSessions] = useState<Row[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Row[]>([])
  const [input, setInput] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadSessions() {
    const rows = await customerGet<Row[]>('/ai-chat/sessions')
    setSessions(rows)
    if (!currentSessionId && rows.length) setCurrentSessionId(Number(rows[0].id))
  }

  async function loadMessages(sessionId: number) {
    setMessages(await customerGet<Row[]>(`/ai-chat/sessions/${sessionId}/messages`))
  }

  useEffect(() => {
    loadSessions().catch((e) => setMsg(e.message))
  }, [])

  useEffect(() => {
    if (!currentSessionId) return
    loadMessages(currentSessionId).catch((e) => setMsg(e.message))
  }, [currentSessionId])

  async function createSession() {
    try {
      const s = await customerPost<Row>('/ai-chat/sessions', { tieu_de: 'Phiên mới', loai_context: 'tu_van_chung' })
      await loadSessions()
      setCurrentSessionId(Number(s.id))
    } catch (e: any) {
      setMsg(e.message)
    }
  }

  async function archiveSession() {
    if (!currentSessionId) return
    try {
      await customerPatch(`/ai-chat/sessions/${currentSessionId}/archive`, {})
      setMsg('Đã lưu trữ phiên chat.')
      setCurrentSessionId(null)
      setMessages([])
      await loadSessions()
    } catch (e: any) {
      setMsg(e.message)
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    if (!currentSessionId || !input.trim()) return
    setLoading(true)
    try {
      const rows = await customerPost<Row[]>(`/ai-chat/sessions/${currentSessionId}/messages`, { noi_dung: input })
      setMessages(rows)
      setInput('')
    } catch (e: any) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SectionHeader title='Chatbox AI sức khỏe' subtitle='Hỏi đáp nhanh về sức khỏe, dinh dưỡng và tập luyện. Nội dung chỉ mang tính tham khảo.' />
      {msg ? <div style={{ marginBottom: 12, border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 12, padding: 12, background: '#fef2f2' }}>{msg}</div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700 }}>Phiên chat</h3>
            <UserButton size='sm' onClick={createSession}>+ Mới</UserButton>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {sessions.map((s) => (
              <button key={s.id} onClick={() => setCurrentSessionId(Number(s.id))} style={{ textAlign: 'left', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, background: Number(s.id) === currentSessionId ? '#eef2ff' : 'white' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.tieu_de}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.loai_context} • {s.trang_thai}</div>
              </button>
            ))}
          </div>
          {currentSessionId ? <div style={{ marginTop: 12 }}><UserButton variant='ghost' size='sm' onClick={archiveSession}>Lưu trữ phiên hiện tại</UserButton></div> : null}
        </Card>

        <Card>
          <div style={{ minHeight: 360, maxHeight: 500, overflow: 'auto', display: 'grid', gap: 10, marginBottom: 12 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ borderRadius: 10, padding: 10, background: m.vai_tro === 'assistant' ? '#f8fafc' : '#eef2ff', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{m.vai_tro}</div>
                <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{m.noi_dung}</div>
              </div>
            ))}
            {!messages.length ? <div style={{ color: '#64748b', fontSize: 14 }}>Chưa có tin nhắn. Hãy đặt câu hỏi để bắt đầu.</div> : null}
          </div>
          <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder='Nhập câu hỏi sức khỏe...' style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }} />
            <UserButton disabled={loading || !currentSessionId}>{loading ? 'Đang gửi...' : 'Gửi'}</UserButton>
          </form>
        </Card>
      </div>
    </>
  )
}
