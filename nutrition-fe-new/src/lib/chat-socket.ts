'use client'

import { io } from 'socket.io-client'

export type ChatSocketMessage = Record<string, any> & {
  id: number
  lich_hen_id: number
}

function getDefaultSocketUrl() {
  if (typeof window === 'undefined') return undefined

  const { hostname, protocol } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:8009`
  }

  return undefined
}

export function createChatSocket() {
  return io(process.env.NEXT_PUBLIC_SOCKET_URL ?? getDefaultSocketUrl(), {
    path: '/socket.io',
    withCredentials: true,
    autoConnect: false,
    transports: ['websocket', 'polling'],
  })
}
