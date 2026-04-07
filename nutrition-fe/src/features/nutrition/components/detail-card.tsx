type DetailCardProps = {
  label: string
  value: string
}

export function DetailCard({ label, value }: DetailCardProps) {
  return (
    <div className='rounded-xl border p-4'>
      <p className='text-sm text-muted-foreground'>{label}</p>
      <p className='mt-2 font-medium'>{value}</p>
    </div>
  )
}
