# Mô tả từng bảng database

Tài liệu này mô tả ngắn gọn mục đích của từng bảng trong schema package-first.

## 1. Nhóm tài khoản và hồ sơ

### `tai_khoan`
- Bảng gốc lưu thông tin đăng nhập và phân quyền (`customer`, `expert`, `admin`).
- Dùng xuyên suốt cho toàn bộ nghiệp vụ.

### `ho_so_customer`
- Hồ sơ cơ bản của customer (giới tính, ngày sinh, ảnh đại diện, ghi chú sức khỏe).
- Quan hệ 1-1 với `tai_khoan` (customer).

### `ho_so_suc_khoe`
- Hồ sơ sức khỏe chi tiết để cá nhân hóa tư vấn và AI gợi ý.
- Quan hệ 1-1 với `tai_khoan`.

### `chi_so_suc_khoe`
- Lịch sử đo chỉ số sức khỏe (cân nặng, huyết áp, nhịp tim, BMI...).
- Quan hệ n-1 về `tai_khoan`.

### `otp`
- Lưu mã OTP cho xác thực và quên mật khẩu.

## 2. Nhóm chuyên gia

### `chuyen_gia`
- Hồ sơ nghiệp vụ của expert (chuyên môn, trạng thái duyệt, nhận booking, rating tổng hợp).
- Quan hệ 1-1 với `tai_khoan` có vai trò expert.

### `lich_lam_viec_chuyen_gia`
- Khung lịch làm việc theo thứ trong tuần của expert.
- Dùng để sinh `available slots` cho booking.

### `lich_ban_chuyen_gia`
- Các khoảng thời gian expert bận/khóa lịch (nghỉ, việc đột xuất...).

## 3. Nhóm gói dịch vụ

### `goi_dich_vu`
- Danh mục gói dịch vụ chuẩn (giá, thời hạn, số lượt, trạng thái kinh doanh).
- Bao gồm media hiển thị cho UI: `thumbnail_url`, `banner_url`.

### `goi_dich_vu_chuyen_gia`
- Bảng mapping gói ↔ chuyên gia.
- Quy định expert nào được phục vụ booking thuộc gói nào.

### `goi_da_mua`
- Bản ghi entitlement gói customer đã mua.
- Theo dõi lượt còn lại, hiệu lực, khóa, hoàn tiền.

### `lich_su_su_dung_goi`
- Audit sử dụng lượt gói (giữ/trừ/hoàn lượt, hết hạn, khóa).

## 4. Nhóm booking tư vấn

### `lich_hen`
- Bản ghi booking chính: customer, expert, gói, thời gian, trạng thái tư vấn.

### `booking_timeline`
- Dòng thời gian chuyển trạng thái booking (ai thao tác, trước/sau, metadata).

### `ghi_chu_tu_van`
- Ghi chú sau tư vấn của expert cho booking.

### `cuoc_goi_tu_van`
- Metadata phiên gọi tư vấn (room, provider, thời lượng, trạng thái).

## 5. Nhóm thanh toán

### `thanh_toan`
- Giao dịch thanh toán cho 2 đối tượng: mua gói và booking.

### `payment_webhook_log`
- Log callback/IPN từ cổng thanh toán để audit và debug đối soát.

### `refund`
- Bản ghi hoàn tiền giao dịch.

## 6. Nhóm đánh giá

### `danh_gia`
- Đánh giá customer dành cho expert sau booking hoàn thành.

### `phan_hoi_danh_gia`
- Phản hồi của expert trên một đánh giá.

## 7. Nhóm AI và gợi ý

### `phien_chat_ai`
- Phiên chat AI của customer.

### `tin_nhan_chat_ai`
- Tin nhắn trong phiên chat AI (user/assistant/system).

### `goi_y_suc_khoe`
- Gợi ý kế hoạch sức khỏe tổng quát cho customer.

### `goi_y_dinh_duong_tap_luyen`
- Gợi ý chuyên sâu dinh dưỡng + tập luyện.

## 8. Nhóm hoa hồng chuyên gia

### `cau_hinh_hoa_hong`
- Cấu hình tỷ lệ hoa hồng theo phạm vi (hệ thống/gói/chuyên gia).

### `ky_hoa_hong`
- Kỳ chốt hoa hồng theo tháng.

### `chi_tiet_hoa_hong`
- Chi tiết booking hợp lệ dùng để tính hoa hồng.

### `chi_tra_hoa_hong`
- Kết quả chi trả theo expert trong một kỳ.

## 9. Nhóm khiếu nại và thông báo

### `khieu_nai`
- Ticket khiếu nại/hỗ trợ của user.

### `khieu_nai_tin_nhan`
- Hội thoại trao đổi trong một ticket khiếu nại.

### `thong_bao`
- Thông báo in-app cho customer/expert/admin.

## 10. Nhóm hệ thống

### `audit_log`
- Nhật ký thao tác nghiệp vụ để truy vết thay đổi quan trọng.

### `export_job`
- Quản lý tác vụ export báo cáo (doanh thu, thanh toán, hoa hồng...).
