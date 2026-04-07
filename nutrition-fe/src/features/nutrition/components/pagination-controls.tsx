import { Button } from '@/components/ui/button'

type PaginationControlsProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <p className='text-sm text-muted-foreground'>
        Trang {page} / {totalPages}
      </p>
      <div className='flex gap-2'>
        <Button
          size='sm'
          variant='outline'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Trước
        </Button>
        <Button
          size='sm'
          variant='outline'
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  )
}
