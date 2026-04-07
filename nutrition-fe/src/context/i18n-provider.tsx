'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { nutritionMessages } from '@/lib/i18n/nutrition'
import type { AppLocale } from '@/lib/i18n/types'

const LOCALE_STORAGE_KEY = 'app_locale'

type I18nContextType = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  nutrition: (typeof nutritionMessages)[AppLocale]
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('vi')

  useEffect(() => {
    queueMicrotask(() => {
      const savedLocale = window.localStorage.getItem(
        LOCALE_STORAGE_KEY
      ) as AppLocale | null

      if (savedLocale === 'vi' || savedLocale === 'en') {
        setLocaleState(savedLocale)
        return
      }

      const browserLocale = navigator.language.toLowerCase()
      if (browserLocale.startsWith('en')) {
        setLocaleState('en')
      }
    })
  }, [])

  const setLocale = (nextLocale: AppLocale) => {
    setLocaleState(nextLocale)
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
  }

  const value = useMemo<I18nContextType>(
    () => ({
      locale,
      setLocale,
      nutrition: nutritionMessages[locale],
    }),
    [locale]
  )

  return <I18nContext value={value}>{children}</I18nContext>
}

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }

  return context
}
