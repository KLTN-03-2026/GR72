'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Vui lòng nhập email' : undefined),
  }),
})

interface ForgotPasswordFormProps extends React.HTMLAttributes<HTMLFormElement> {
  onSuccess?: (email: string) => void
}

export function ForgotPasswordForm({
  className,
  onSuccess,
  ...props
}: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const { forgotPassword } = await import('@/services/auth/api')
      await forgotPassword({ email: data.email.trim().toLowerCase() })
      toast.success('Đã gửi mã đặt lại mật khẩu đến email của bạn')
      onSuccess?.(data.email)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể gửi yêu cầu'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading} type='submit'>
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Đang gửi...
            </>
          ) : (
            <>
              Gửi mã đặt lại
              <ArrowRight className='ml-2 h-4 w-4' />
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
