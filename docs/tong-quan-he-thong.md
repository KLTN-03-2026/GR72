# Tổng quan hệ thống (nghiệp vụ mới)

## 1. Định hướng
Hệ thống được tái cấu trúc từ mô hình `expert-first` sang `package-first`.

- Mô hình cũ: chọn chuyên gia trước, sau đó chọn gói tư vấn của chuyên gia.
- Mô hình mới: mua gói dịch vụ hệ thống trước, sau đó mới chọn chuyên gia.

Mục tiêu của thay đổi:
- Chuẩn hóa sản phẩm dịch vụ theo 3 gói cố định.
- Chuẩn hóa luồng thanh toán và đối soát.
- Chuẩn hóa cơ chế thu nhập chuyên gia theo hoa hồng.

## 2. Domain chính

### 2.1 Package Catalog
- Quản lý 3 gói dịch vụ chuẩn.
- Quản lý giá, thời hạn, lượt sử dụng.
- Quản lý mapping giữa gói và chuyên gia.

### 2.2 Customer Purchase & Entitlement
- Quản lý mua gói và quyền sử dụng gói.
- Kiểm tra điều kiện đặt lịch theo gói.

### 2.3 Booking & Consultation
- Quản lý lịch tư vấn giữa khách hàng và chuyên gia.
- Ghi nhận trạng thái booking và hoàn thành dịch vụ.

### 2.4 Payment
- Ghi nhận thanh toán mua gói.
- Ghi nhận thanh toán booking.
- Đối soát giao dịch theo kỳ.

### 2.5 Review
- Khách hàng đánh giá chuyên gia sau tư vấn.
- Admin giám sát chất lượng đánh giá.

### 2.6 Revenue & Commission
- Tổng hợp doanh thu.
- Tính hoa hồng chuyên gia theo tháng.
- Quản lý trạng thái chi trả.

## 3. Vai trò
- Khách hàng: mua gói, đặt lịch, thanh toán, đánh giá.
- Chuyên gia: nhận lịch, tư vấn, theo dõi thu nhập.
- Admin: quản lý gói, thanh toán, đánh giá, thống kê doanh thu.

## 4. Luồng end-to-end chuẩn
1. Admin cấu hình gói dịch vụ và gán chuyên gia.
2. Khách hàng mua gói.
3. Hệ thống kích hoạt quyền sử dụng.
4. Khách hàng book chuyên gia trong phạm vi gói.
5. Khách hàng thanh toán booking.
6. Chuyên gia tư vấn và hoàn thành booking.
7. Khách hàng gửi đánh giá.
8. Hệ thống chốt doanh thu và hoa hồng tháng.
9. Admin chi trả hoa hồng chuyên gia.

## 5. Quy tắc thu nhập chuyên gia
- Thu nhập theo số booking hoàn thành.
- Hoa hồng mặc định: 30% giá trị booking hợp lệ.
- Thanh toán cho chuyên gia theo tháng.
- Cùng chuyên gia được nhiều khách book thì tổng hoa hồng tăng tương ứng.
