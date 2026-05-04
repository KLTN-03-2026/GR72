# Luồng nghiệp vụ mới (chi tiết)

## 1. Luồng khách hàng
1. Vào màn hình gói dịch vụ.
2. Chọn 1 trong 3 gói.
3. Thanh toán mua gói.
4. Vào danh sách chuyên gia theo gói đã mua.
5. Chọn chuyên gia và slot lịch phù hợp.
6. Tạo booking.
7. Thanh toán booking.
8. Tham gia buổi tư vấn.
9. Đánh giá chuyên gia.

## 2. Luồng chuyên gia
1. Thiết lập lịch rảnh và ghi chú tư vấn.
2. Nhận booking từ khách hàng.
3. Tư vấn theo lịch.
4. Cập nhật booking hoàn thành.
5. Theo dõi số booking hoàn thành trong tháng.
6. Theo dõi hoa hồng và trạng thái chi trả.

## 3. Luồng admin
1. Quản lý gói dịch vụ và chuyên gia theo gói.
2. Theo dõi thanh toán khách hàng.
3. Quản lý đánh giá user.
4. Tổng hợp số liệu `Thống kê Doanh thu`.
5. Chốt công nợ và chi trả hoa hồng chuyên gia theo tháng.

## 4. Điều kiện chặn bắt buộc
- Không có gói hợp lệ: không cho đặt lịch.
- Chuyên gia không thuộc gói: không cho đặt lịch.
- Booking chưa hoàn thành: không cho đánh giá.
- Giao dịch thất bại: không kích hoạt quyền sử dụng.

## 5. Công thức hoa hồng
`hoa_hong_thang_chuyen_gia = tong_gia_tri_booking_hoan_thanh_hop_le * 30%`
