'use client'

import { Check, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/context/i18n-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitch() {
  const { locale, setLocale, nutrition } = useI18n()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='scale-95 rounded-full'>
          <Languages className='size-[1.1rem]' />
          <span className='sr-only'>{nutrition.language.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => setLocale('vi')}>
          {nutrition.language.vietnamese}
          <Check size={14} className={cn('ms-auto', locale !== 'vi' && 'hidden')} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('en')}>
          {nutrition.language.english}
          <Check size={14} className={cn('ms-auto', locale !== 'en' && 'hidden')} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
