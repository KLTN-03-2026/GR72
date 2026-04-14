'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CalendarRange, CheckCircle2, Clock, DollarSign, TrendingUp, Users, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import {
  getBookingReports,
  getBookingReportsByNutritionist,
  getBookings,
  type BookingDetail,
  type BookingListItem,
  type BookingReportData,
  type NutritionistStat,
} from '@/services/admin-booking/api'
import { DataTablePagination } from '@/components/data-table'
import { Main } from '@/components/layout/main'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import {
  type ColumnDef,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

function formatCurrency(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

function getBookingStatusLabel(status: string) {
  const map: Record<string, string> = {
    cho_thanh_toan: 'Chờ thanh toán',
    da_xac_nhan: 'Đã xác nhận',
    da_checkin: 'Đã check-in',
    dang_tu_van: 'Đang tư vấn',
    hoan_thanh: 'Hoàn thành',
    da_huy: 'Đã hủy',
    vo_hieu_hoa: 'Vô hiệu hóa',
  }
  return map[status] ?? status
}

function getBookingStatusVariant(status: string): 'default' | 'outline' | 'secondary' | 'destructive' {
  const map: Record<string, 'default' | 'outline' | 'secondary' | 'destructive'> = {
    cho_thanh_toan: 'outline',
    da_xac_nhan: 'secondary',
    da_checkin: 'secondary',
    dang_tu_van: 'default',
    hoan_thanh: 'default',
    da_huy: 'destructive',
    vo_hieu_hoa: 'destructive',
  }
  return map[status] ?? 'outline'
}

const PAGE_SIZE = 10

export function AdminBookingReports() {
  const [activeTab, setActiveTab] = useState<'overview' | 'by-nutritionist' | 'list'>('overview')
  const [reports, setReports] = useState<BookingReportData | null>(null)
  const [ngStats, setNgStats] = useState<NutritionistStat[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const [r, n] = await Promise.all([
        getBookingReports({ start_date: startDate, end_date: endDate }),
        getBookingReportsByNutritionist({ start_date: startDate, end_date: endDate }),
      ])
      setReports(r)
      setNgStats(n)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Lỗi tải báo cáo')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { void loadReports() }, [loadReports])

  const chartData = (reports?.thong_ke_theo_ngay ?? []).map((d) => ({
    name: d.ngay,
    Booking: d.so_booking,
    'Hoàn thành': d.so_hoan_thanh,
    Doanhthu: Number(d.doanh_thu),
  }))

  const statusChartData = (reports?.booking_theo_trang_thai ?? []).map((s, i) => ({
    name: getBookingStatusLabel(s.trang_thai),
    so_luong: s.so_luong,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <>
      <AdminTopbar />
      <Main fluid className='flex flex-1 flex-col gap-5 px-3 py-5 sm:px-4'>
        <PageHeading title='Báo cáo booking & tư vấn' description='Thống kê tổng quan về booking tư vấn dinh dưỡng, doanh thu và hiệu suất của từng Nutritionist.' />

        {/* Date Filter + Tabs */}
        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex items-center gap-2'>
            <CalendarRange className='size-4 text-muted-foreground' />
            <Input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} className='w-auto rounded-sm' />
            <span className='text-muted-foreground'>—</span>
            <Input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} className='w-auto rounded-sm' />
          </div>
          <Button variant='outline' size='sm' onClick={() => void loadReports()} className='rounded-sm'>Lọc</Button>
          <div className='ml-auto flex gap-1'>
            {(['overview', 'by-nutritionist', 'list'] as const).map((tab) => (
              <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} size='sm' onClick={() => setActiveTab(tab)} className='rounded-sm'>{tab === 'overview' ? 'Tổng quan' : tab === 'by-nutritionist' ? 'Theo Nutritionist' : 'Danh sách'}</Button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className='space-y-6'>
            {/* KPI Cards */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card><CardHeader className='flex flex-row items-center justify-between pb-2'><CardTitle className='text-sm font-medium text-muted-foreground'>Tổng booking</CardTitle><div className='rounded-lg bg-indigo-500 p-2'><CalendarRange className='size-4 text-white' /></div></CardHeader><CardContent><p className='text-2xl font-bold'>{reports?.tong_booking ?? 0}</p></CardContent></Card>
              <Card><CardHeader className='flex flex-row items-center justify-between pb-2'><CardTitle className='text-sm font-medium text-muted-foreground'>Tổng doanh thu</CardTitle><div className='rounded-lg bg-emerald-500 p-2'><DollarSign className='size-4 text-white' /></div></CardHeader><CardContent><p className='text-2xl font-bold'>{formatCurrency(reports?.tong_doanh_thu ?? 0)}</p></CardContent></Card>
              <Card><CardHeader className='flex flex-row items-center justify-between pb-2'><CardTitle className='text-sm font-medium text-muted-foreground'>Hoàn thành</CardTitle><div className='rounded-lg bg-green-500 p-2'><CheckCircle2 className='size-4 text-white' /></div></CardHeader><CardContent><p className='text-2xl font-bold'>{reports?.booking_theo_trang_thai.find(s => s.trang_thai === 'hoan_thanh')?.so_luong ?? 0}</p></CardContent></Card>
              <Card><CardHeader className='flex flex-row items-center justify-between pb-2'><CardTitle className='text-sm font-medium text-muted-foreground'>Đã hủy</CardTitle><div className='rounded-lg bg-red-500 p-2'><XCircle className='size-4 text-white' /></div></CardHeader><CardContent><p className='text-2xl font-bold'>{reports?.booking_theo_trang_thai.find(s => s.trang_thai === 'da_huy')?.so_luong ?? 0}</p></CardContent></Card>
            </div>

            {/* Booking Trend */}
            <Card>
              <CardHeader><CardTitle className='flex items-center gap-2'><TrendingUp className='size-5 text-emerald-500' />Xu hướng booking</CardTitle><CardDescription>Số booking và doanh thu theo ngày</CardDescription></CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
                      <XAxis dataKey='name' tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} yAxisId='left' />
                      <YAxis tick={{ fontSize: 11 }} yAxisId='right' orientation='right' tickFormatter={formatCurrency} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                      <Legend />
                      <Line yAxisId='left' type='monotone' dataKey='Booking' stroke='#6366f1' strokeWidth={2} dot={false} />
                      <Line yAxisId='left' type='monotone' dataKey='Hoàn thành' stroke='#10b981' strokeWidth={2} dot={false} />
                      <Line yAxisId='right' type='monotone' dataKey='Doanhthu' stroke='#f59e0b' strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className='py-10 text-center text-sm text-muted-foreground'>Chưa có dữ liệu.</p>}
              </CardContent>
            </Card>

            {/* Status Pie */}
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader><CardTitle>Phân bổ theo trạng thái</CardTitle></CardHeader>
                <CardContent className='flex items-center justify-center'>
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width='100%' height={250}>
                      <PieChart>
                        <Pie data={statusChartData} cx='50%' cy='50%' innerRadius={60} outerRadius={100} paddingAngle={3} dataKey='so_luong' label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}>
                          {statusChartData.map((s, i) => <Cell key={`sc-${i}`} fill={s.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className='py-8 text-sm text-muted-foreground'>Chưa có dữ liệu.</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Số booking theo trạng thái</CardTitle></CardHeader>
                <CardContent>
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width='100%' height={250}>
                      <BarChart data={statusChartData}>
                        <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
                        <XAxis dataKey='name' tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                        <Bar dataKey='so_luong' radius={[4, 4, 0, 0]}>
                          {statusChartData.map((s, i) => <Cell key={`bc-${i}`} fill={s.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className='py-8 text-sm text-muted-foreground'>Chưa có dữ liệu.</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'by-nutritionist' && (
          <Card>
            <CardHeader><CardTitle>Thống kê theo Nutritionist</CardTitle><CardDescription>Top Nutritionist theo số booking và doanh thu</CardDescription></CardHeader>
            <CardContent>
              {ngStats.length > 0 ? (
                <div className='overflow-auto'>
                  <Table>
                    <TableHeader><TableRow>{['Họ tên', 'Booking', 'Hoàn thành', 'Doanh thu', 'Đánh giá TB'].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
                    <TableBody>
                      {ngStats.map((n) => (
                        <TableRow key={n.chuyen_gia_id}>
                          <TableCell><p className='font-medium'>{n.ho_ten}</p><p className='text-xs text-muted-foreground'>{n.email}</p></TableCell>
                          <TableCell><Badge variant='outline'>{n.so_booking}</Badge></TableCell>
                          <TableCell><Badge variant='default'>{n.so_hoan_thanh}</Badge></TableCell>
                          <TableCell className='font-medium text-emerald-600'>{formatCurrency(n.doanh_thu)}</TableCell>
                          <TableCell>{n.diem_trung_binh > 0 ? `${n.diem_trung_binh.toFixed(1)} ★` : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : <p className='py-10 text-center text-sm text-muted-foreground'>Chưa có dữ liệu.</p>}
            </CardContent>
          </Card>
        )}

        {activeTab === 'list' && <BookingList />}
      </Main>
    </>
  )
}

function BookingList() {
  const [items, setItems] = useState<BookingListItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [pageCount, setPageCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [nutritionistFilter, setNutritionistFilter] = useState('')
  const [listStartDate, setListStartDate] = useState('')
  const [listEndDate, setListEndDate] = useState('')

  const loadData = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await getBookings({
        trang_thai: statusFilter === 'all' ? undefined : statusFilter || undefined,
        nutritionist_id: nutritionistFilter || undefined,
        start_date: listStartDate || undefined,
        end_date: listEndDate || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setItems(res.items)
      setPageCount(Math.max(Math.ceil(res.pagination.total / res.pagination.limit), 1))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Lỗi tải dữ liệu')
      setItems([])
    } finally {
      setLoadingList(false)
    }
  }, [statusFilter, nutritionistFilter, listStartDate, listEndDate, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadData() }, [loadData])

  const columns = useMemo<ColumnDef<BookingListItem>[]>(() => [
    { accessorKey: 'id', header: 'ID', cell: ({ row }) => <span className='font-mono text-sm text-muted-foreground'>{row.original.id}</span> },
    { accessorKey: 'ma_lich_hen', header: 'Mã lịch hẹn', cell: ({ row }) => <span className='font-mono text-xs'>{row.original.ma_lich_hen}</span> },
    { id: 'chuyen_gia', header: 'Nutritionist', cell: ({ row }) => <p className='text-sm'>{row.original.chuyen_gia?.ho_ten ?? '—'}</p> },
    { id: 'user', header: 'User', cell: ({ row }) => <p className='text-sm'>{row.original.user?.ho_ten ?? '—'}</p> },
    { id: 'ngay_hen', header: 'Ngày hẹn', cell: ({ row }) => <span className='text-sm'>{row.original.ngay_hen}</span> },
    { accessorKey: 'trang_thai', header: 'Trạng thái', cell: ({ row }) => <Badge variant={getBookingStatusVariant(row.original.trang_thai)}>{getBookingStatusLabel(row.original.trang_thai)}</Badge> },
    { id: 'gia', header: 'Giá', cell: ({ row }) => <span className='text-sm font-medium'>{row.original.goi_tu_van ? `${Number(row.original.goi_tu_van.gia).toLocaleString('vi-VN')}đ` : '—'}</span> },
  ], [])

  const table = useReactTable({
    data: items, columns,
    state: { pagination },
    manualPagination: true, pageCount,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-3'>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination((c) => ({ ...c, pageIndex: 0 })) }}>
          <SelectTrigger className='w-[180px] rounded-sm'><SelectValue placeholder='Trạng thái' /></SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả</SelectItem>
            <SelectItem value='cho_thanh_toan'>Chờ thanh toán</SelectItem>
            <SelectItem value='da_xac_nhan'>Đã xác nhận</SelectItem>
            <SelectItem value='hoan_thanh'>Hoàn thành</SelectItem>
            <SelectItem value='da_huy'>Đã hủy</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder='ID Nutritionist...' value={nutritionistFilter} onChange={(e) => { setNutritionistFilter(e.target.value); setPagination((c) => ({ ...c, pageIndex: 0 })) }} className='w-[160px] rounded-sm' />
        <Input type='date' value={listStartDate} onChange={(e) => { setListStartDate(e.target.value); setPagination((c) => ({ ...c, pageIndex: 0 })) }} className='w-auto rounded-sm' />
        <Input type='date' value={listEndDate} onChange={(e) => { setListEndDate(e.target.value); setPagination((c) => ({ ...c, pageIndex: 0 })) }} className='w-auto rounded-sm' />
        <Button variant='outline' size='sm' onClick={() => void loadData()} className='rounded-sm'>Lọc</Button>
      </div>
      <div className='overflow-hidden rounded-sm border bg-card'>
        <Table>
          <TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
          <TableBody>
            {loadingList ? <TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>
            : table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
            : <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Không có booking nào.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
