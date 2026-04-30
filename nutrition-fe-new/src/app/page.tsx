import Link from 'next/link'

const packages = [
  'Tư vấn sức khỏe tổng quát',
  'Tư vấn chế độ dinh dưỡng',
  'Tư vấn tập luyện cá nhân',
]

export default function HomePage() {
  return (
    <main className='min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_20%,#DBEAFE_0,transparent_30%),linear-gradient(135deg,#F8FAFC_0%,#EEF6FF_55%,#FFF7ED_100%)] text-[#1E293B]'>
      <section className='mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]'>
        <div>
          <p className='mb-5 inline-flex rounded-full border border-blue-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] shadow-sm backdrop-blur'>
            Nutrition Consult
          </p>
          <h1 className='max-w-4xl text-5xl font-semibold leading-tight text-slate-950 sm:text-6xl'>
            Chọn gói tư vấn, book chuyên gia và theo dõi sức khỏe dễ dàng.
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-8 text-slate-600'>
            Một nơi để bạn mua gói dịch vụ, đặt lịch với chuyên gia phù hợp, nhận gợi ý dinh dưỡng - tập luyện và quản lý tiến trình sức khỏe cá nhân.
          </p>
          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <Link
              href='/register'
              className='cursor-pointer rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-colors duration-200 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]'
            >
              Bắt đầu ngay
            </Link>
            <Link
              href='/login'
              className='cursor-pointer rounded-xl border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-800 transition-colors duration-200 hover:border-[#2563EB] hover:text-[#2563EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]'
            >
              Tôi đã có tài khoản
            </Link>
          </div>
        </div>

        <div className='rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur'>
          <div className='rounded-[1.5rem] bg-slate-950 p-5 text-white'>
            <p className='text-sm font-semibold text-blue-200'>Gói tư vấn nổi bật</p>
            <div className='mt-5 space-y-3'>
              {packages.map((item) => (
                <div key={item} className='rounded-2xl bg-white/10 p-4'>
                  <p className='font-semibold'>{item}</p>
                  <p className='mt-1 text-sm text-slate-300'>Chọn chuyên gia và lịch tư vấn sau khi mua gói.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
