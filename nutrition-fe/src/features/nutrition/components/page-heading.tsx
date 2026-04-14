import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type ActionConfig = {
  label: string
  disabled?: boolean
  onClick?: () => void
}

type PageHeadingProps = {
  title: string
  description: string
  actions?: ActionConfig[]
}

export function PageHeading({
  title,
  description,
  actions = [],
}: PageHeadingProps) {
  return (
    <div className='flex flex-wrap items-start justify-between gap-4'>
      <div className='space-y-1'>
        <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
        <p className='max-w-3xl text-sm text-muted-foreground'>
          {description}
        </p>
      </div>

      {actions.length > 0 ? (
        <div className='flex flex-wrap gap-2'>
          {actions.map((action) => (
            <Button
              key={action.label}
              disabled={action.disabled}
              onClick={() => {
                if (action.onClick) {
                  action.onClick()
                  return
                }

                toast.success(`Đã chọn: ${action.label}.`)
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
