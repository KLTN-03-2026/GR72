'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'

const formSchema = z.object({
  otp: z
    .string()
    .min(6, 'Vui lòng nhập đủ 6 chữ số')
    .max(6, 'Vui lòng nhập đủ 6 chữ số'),
})

interface OtpFormProps extends React.HTMLAttributes<HTMLFormElement> {
  email: string
  onVerified?: (email: string) => void
  onResend?: () => Promise<void>
}

export function OtpForm({
  className,
  email,
  onVerified,
  onResend,
  ...props
}: OtpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  })

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const otp = form.watch('otp') ?? ''

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const { verifyOtp } = await import('@/services/auth/api')
      await verifyOtp({ email, maOtp: data.otp.trim() })
      toast.success('Xác thực thành công!')
      onVerified?.(email)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Mã OTP không hợp lệ'
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    setIsResending(true)
    try {
      const { resendOtp } = await import('@/services/auth/api')
      await resendOtp(email)
      toast.success('Đã gửi lại mã OTP')
      setCountdown(60)
      onResend?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể gửi lại mã OTP'
      )
    } finally {
      setIsResending(false)
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
          name='otp'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  {...field}
                  containerClassName='justify-between sm:[&>[data-slot="input-otp-group"]>div]:w-12'
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className='mt-2'
          disabled={otp.length < 6 || isLoading}
          type='submit'
        >
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Đang xác thực...
            </>
          ) : (
            'Xác thực'
          )}
        </Button>
        <div className='text-center text-sm text-muted-foreground'>
          Không nhận được mã?{' '}
          <button
            type='button'
            disabled={isResending || countdown > 0}
            onClick={handleResend}
            className='font-medium text-primary underline underline-offset-4 hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isResending
              ? 'Đang gửi...'
              : countdown > 0
                ? `Gửi lại sau ${countdown}s`
                : 'Gửi lại mã'}
          </button>
        </div>
      </form>
    </Form>
  )
}
