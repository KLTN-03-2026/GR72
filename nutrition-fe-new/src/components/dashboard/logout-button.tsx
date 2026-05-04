'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { logout } from '@/lib/auth-api'

export function LogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await logout()
      router.replace('/login')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (iconOnly) {
    return (
      <button
        type='button'
        onClick={handleLogout}
        disabled={loading}
        title='Đăng xuất'
        className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors duration-150 hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60'
      >
        <LogOut size={14} />
      </button>
    )
  }

  return (
    <button
      type='button'
      onClick={handleLogout}
      disabled={loading}
      className='flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60'
    >
      <LogOut size={14} className='shrink-0' />
      {loading ? 'Đang xuất...' : 'Đăng xuất'}
    </button>
  )
}
