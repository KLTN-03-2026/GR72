# Spec chức năng hệ thống (phiên bản nghiệp vụ mới)

## 1. Mục tiêu hệ thống
Hệ thống chuyển sang mô hình `package-first`:
- Khách hàng mua gói dịch vụ trước.
- Sau khi có gói hợp lệ, khách hàng mới chọn chuyên gia để đặt lịch tư vấn.
- Thu nhập chuyên gia tính theo hoa hồng trên booking hoàn thành và đối soát theo tháng.

## 2. Bộ gói dịch vụ chuẩn
Hệ thống có 3 gói chuẩn:
- Gói 1: Tư vấn dịch vụ sức khỏe.
- Gói 2: Tư vấn chế độ dinh dưỡng.
- Gói 3: Tư vấn tập luyện.

Mỗi gói có:
- Tên gói, mô tả, giá, thời hạn.
- Số lượt đặt lịch được phép sử dụng.
- Trạng thái kinh doanh.
- Danh sách chuyên gia được gán vào gói.

## 3. Vai trò và chức năng

### 3.1 Khách hàng
- Xem danh sách và chi tiết 3 gói dịch vụ.
- Mua gói dịch vụ.
- Xem danh sách gói đã mua (còn hạn, hết hạn, còn lượt, hết lượt).
- Xem danh sách chuyên gia thuộc gói đã mua.
- Đặt lịch tư vấn với chuyên gia theo gói đang sở hữu.
- Thanh toán đơn tư vấn.
- Đánh giá chuyên gia sau buổi tư vấn.

### 3.2 Chuyên gia
- Quản lý lịch tư vấn (ngày, giờ, ghi chú).
- Nhận và xử lý booking từ khách hàng.
- Xem danh sách đánh giá từ khách hàng.
- Xem thu nhập tháng theo booking hoàn thành.
- Nhận chi trả theo hoa hồng.

### 3.3 Admin
- Quản lý gói dịch vụ.
- Gán chuyên gia vào từng gói dịch vụ.
- Quản lý thanh toán.
- Quản lý đánh giá user.
- Theo dõi và chi trả hoa hồng chuyên gia theo tháng.
- Theo dõi báo cáo với tên chuẩn: `Thống kê Doanh thu`.

## 4. Luồng nghiệp vụ chính

### 4.1 Luồng mua gói và đặt lịch
1. Khách hàng chọn 1 trong 3 gói dịch vụ.
2. Khách hàng thanh toán gói.
3. Hệ thống kích hoạt quyền sử dụng gói.
4. Khách hàng chọn chuyên gia thuộc gói.
5. Khách hàng tạo booking theo slot còn trống.
6. Khách hàng thanh toán booking (nếu booking cần thanh toán riêng).
7. Chuyên gia tư vấn.
8. Khách hàng đánh giá chuyên gia.

### 4.2 Luồng tính hoa hồng chuyên gia
1. Hệ thống tổng hợp booking hoàn thành theo tháng của từng chuyên gia.
2. Xác định doanh thu hợp lệ để tính hoa hồng.
3. Tính hoa hồng theo tỷ lệ mặc định `30%`.
4. Admin chốt kỳ đối soát.
5. Admin thực hiện chi trả chuyên gia theo tháng.

## 5. Quy tắc nghiệp vụ bắt buộc
- Chỉ cho phép đặt lịch khi khách hàng có gói hợp lệ.
- Chuyên gia chỉ nhận booking từ các gói mà chuyên gia được gán.
- Booking chỉ được đánh giá sau khi hoàn thành.
- Báo cáo doanh thu và hoa hồng phải có dữ liệu theo kỳ tháng.
- Tỷ lệ hoa hồng mặc định là 30%, cho phép admin cấu hình.

## 6. KPI vận hành tối thiểu
- Doanh thu theo gói/tháng.
- Số booking theo chuyên gia/gói.
- Hoa hồng phải trả theo chuyên gia/tháng.
- Tỷ lệ booking hoàn thành.
- Điểm đánh giá trung bình của chuyên gia.
