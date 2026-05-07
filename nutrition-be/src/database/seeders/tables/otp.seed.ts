import type { TableSeeder } from '../types';

// OTP hash tương ứng với mã '123456' để test
const OTP_HASH = '$2b$10$P4HGyCQLiNNa3u3EHnRsPeEnpvecOcFT/xaA5grxiJJJ.EmlT7zPW';

const otpSeeder: TableSeeder = {
  table: 'otp',
  rows: [
    // OTP đã sử dụng (đăng ký)
    { id: 1, email: 'mai.nguyen@example.com',     ma_otp: OTP_HASH, loai: 'xac_thuc',            da_su_dung: true,  het_han_luc: '2026-01-15 09:15:00', tao_luc: '2026-01-15 09:00:00' },
    // OTP đã sử dụng (reset mật khẩu)
    { id: 2, email: 'binh.tran@example.com',      ma_otp: OTP_HASH, loai: 'dat_lai_mat_khau',    da_su_dung: true,  het_han_luc: '2026-02-01 10:15:00', tao_luc: '2026-02-01 10:00:00' },
    // OTP hợp lệ chưa dùng (để test flow reset password)
    { id: 3, email: 'bich.ngo@example.com',       ma_otp: OTP_HASH, loai: 'dat_lai_mat_khau',    da_su_dung: false, het_han_luc: '2026-12-31 23:59:59', tao_luc: '2026-05-07 09:00:00' },
    // OTP hết hạn (để test edge case)
    { id: 4, email: 'duc.hoang@example.com',      ma_otp: OTP_HASH, loai: 'xac_thuc',            da_su_dung: false, het_han_luc: '2026-03-01 09:15:00', tao_luc: '2026-03-01 09:00:00' },
  ],
};

export default otpSeeder;
