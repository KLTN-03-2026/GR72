'use client'

type StandaloneCallRole = 'nutrition' | 'nutritionist'

export function getStandaloneCallPath(role: StandaloneCallRole, bookingId: number) {
  return `/call/${role}/bookings/${bookingId}`
}

export function openStandaloneCallWindow(role: StandaloneCallRole, bookingId: number) {
  if (typeof window === 'undefined') return

  const path = getStandaloneCallPath(role, bookingId)
  const width = Math.min(1600, Math.max(1100, window.screen.availWidth - 80))
  const height = Math.min(980, Math.max(760, window.screen.availHeight - 80))
  const left = Math.max(0, Math.floor((window.screen.availWidth - width) / 2))
  const top = Math.max(0, Math.floor((window.screen.availHeight - height) / 2))

  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
  ].join(',')

  const popup = window.open(path, '_blank', features)
  if (popup) {
    popup.focus()
    return
  }

  window.location.assign(path)
}
