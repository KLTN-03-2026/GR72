import auditLogSeeder from './audit-log.seed';
import bookingTimelineSeeder from './booking-timeline.seed';
import cauHinhHoaHongSeeder from './cau-hinh-hoa-hong.seed';
import chiSoSucKhoeSeeder from './chi-so-suc-khoe.seed';
import chiTietHoaHongSeeder from './chi-tiet-hoa-hong.seed';
import chiTraHoaHongSeeder from './chi-tra-hoa-hong.seed';
import chuyenGiaSeeder from './chuyen-gia.seed';
import cuocGoiTuVanSeeder from './cuoc-goi-tu-van.seed';
import danhGiaSeeder from './danh-gia.seed';
import exportJobSeeder from './export-job.seed';
import ghiChuTuVanSeeder from './ghi-chu-tu-van.seed';
import goiDaMuaSeeder from './goi-da-mua.seed';
import goiDichVuSeeder from './goi-dich-vu.seed';
import goiDichVuChuyenGiaSeeder from './goi-dich-vu-chuyen-gia.seed';
import goiYSucKhoeSeeder from './goi-y-suc-khoe.seed';
import goiYDinhDuongTapLuyenSeeder from './goi-y-dinh-duong-tap-luyen.seed';
import hoSoCustomerSeeder from './ho-so-customer.seed';
import hoSoSucKhoeSeeder from './ho-so-suc-khoe.seed';
import khieuNaiSeeder from './khieu-nai.seed';
import khieuNaiTinNhanSeeder from './khieu-nai-tin-nhan.seed';
import kyHoaHongSeeder from './ky-hoa-hong.seed';
import lichBanChuyenGiaSeeder from './lich-ban-chuyen-gia.seed';
import lichHenSeeder from './lich-hen.seed';
import lichLamViecChuyenGiaSeeder from './lich-lam-viec-chuyen-gia.seed';
import lichSuSuDungGoiSeeder from './lich-su-su-dung-goi.seed';
import otpSeeder from './otp.seed';
import paymentWebhookLogSeeder from './payment-webhook-log.seed';
import phanHoiDanhGiaSeeder from './phan-hoi-danh-gia.seed';
import phienChatAiSeeder from './phien-chat-ai.seed';
import refundSeeder from './refund.seed';
import taiKhoanSeeder from './tai-khoan.seed';
import thanhToanSeeder from './thanh-toan.seed';
import thongBaoSeeder from './thong-bao.seed';
import tinNhanSeeder from './tin-nhan.seed';
import tinNhanChatAiSeeder from './tin-nhan-chat-ai.seed';
import type { TableSeeder } from '../types';

export const seeders: TableSeeder[] = [
  taiKhoanSeeder,
  hoSoCustomerSeeder,
  hoSoSucKhoeSeeder,
  chiSoSucKhoeSeeder,
  otpSeeder,
  chuyenGiaSeeder,
  goiDichVuSeeder,
  goiDichVuChuyenGiaSeeder,
  goiDaMuaSeeder,
  thanhToanSeeder,
  paymentWebhookLogSeeder,
  refundSeeder,
  lichLamViecChuyenGiaSeeder,
  lichBanChuyenGiaSeeder,
  lichHenSeeder,
  lichSuSuDungGoiSeeder,
  bookingTimelineSeeder,
  ghiChuTuVanSeeder,
  tinNhanSeeder,
  cuocGoiTuVanSeeder,
  danhGiaSeeder,
  phanHoiDanhGiaSeeder,
  phienChatAiSeeder,
  tinNhanChatAiSeeder,
  goiYSucKhoeSeeder,
  goiYDinhDuongTapLuyenSeeder,
  cauHinhHoaHongSeeder,
  kyHoaHongSeeder,
  chiTietHoaHongSeeder,
  chiTraHoaHongSeeder,
  khieuNaiSeeder,
  khieuNaiTinNhanSeeder,
  thongBaoSeeder,
  auditLogSeeder,
  exportJobSeeder,
];
