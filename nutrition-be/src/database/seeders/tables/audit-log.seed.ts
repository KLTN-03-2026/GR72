import type { TableSeeder } from '../types';

const audit_logSeeder: TableSeeder = {
  table: 'audit_log',
  rows: [
    // Admin duyệt chuyên gia
    { id: 1,  actor_id: 1, actor_role: 'admin', action: 'duyet_chuyen_gia',    resource_type: 'chuyen_gia', resource_id: 1,  old_value: { trang_thai: 'cho_duyet' }, new_value: { trang_thai: 'hoat_dong' }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-001', tao_luc: '2026-01-06 08:00:00' },
    { id: 2,  actor_id: 1, actor_role: 'admin', action: 'duyet_chuyen_gia',    resource_type: 'chuyen_gia', resource_id: 2,  old_value: { trang_thai: 'cho_duyet' }, new_value: { trang_thai: 'hoat_dong' }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-002', tao_luc: '2026-01-06 08:05:00' },
    { id: 3,  actor_id: 1, actor_role: 'admin', action: 'duyet_chuyen_gia',    resource_type: 'chuyen_gia', resource_id: 3,  old_value: { trang_thai: 'cho_duyet' }, new_value: { trang_thai: 'hoat_dong' }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-003', tao_luc: '2026-01-07 08:00:00' },
    { id: 4,  actor_id: 1, actor_role: 'admin', action: 'duyet_chuyen_gia',    resource_type: 'chuyen_gia', resource_id: 5,  old_value: { trang_thai: 'cho_duyet' }, new_value: { trang_thai: 'hoat_dong' }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-004', tao_luc: '2026-01-06 09:00:00' },
    // Admin khóa tài khoản customer vi phạm
    { id: 5,  actor_id: 1, actor_role: 'admin', action: 'khoa_tai_khoan',       resource_type: 'tai_khoan',  resource_id: 25, old_value: { trang_thai: 'hoat_dong' }, new_value: { trang_thai: 'bi_khoa', ly_do: 'Vi phạm điều khoản sử dụng' }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-005', tao_luc: '2026-04-10 14:00:00' },
    // Admin ẩn đánh giá vi phạm
    { id: 6,  actor_id: 1, actor_role: 'admin', action: 'an_danh_gia',          resource_type: 'danh_gia',   resource_id: 13, old_value: { trang_thai: 'hien_thi' }, new_value: { trang_thai: 'da_an', ly_do_an: 'Vi phạm tiêu chuẩn cộng đồng' }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-006', tao_luc: '2026-04-23 10:00:00' },
    // Admin tạo gói dịch vụ mới
    { id: 7,  actor_id: 1, actor_role: 'admin', action: 'tao_goi_dich_vu',      resource_type: 'goi_dich_vu', resource_id: 1, old_value: null, new_value: { ten_goi: 'Tư vấn Dinh dưỡng Cơ bản', gia: 499000 }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-007', tao_luc: '2026-01-05 10:00:00' },
    // Admin chốt kỳ hoa hồng
    { id: 8,  actor_id: 1, actor_role: 'admin', action: 'chot_ky_hoa_hong',     resource_type: 'ky_hoa_hong', resource_id: 1, old_value: { trang_thai: 'nhap' }, new_value: { trang_thai: 'da_chot' }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-008', tao_luc: '2026-02-05 08:00:00' },
    { id: 9,  actor_id: 1, actor_role: 'admin', action: 'chi_tra_hoa_hong',     resource_type: 'ky_hoa_hong', resource_id: 1, old_value: { trang_thai: 'da_chot' }, new_value: { trang_thai: 'da_chi_tra' }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-009', tao_luc: '2026-02-10 08:00:00' },
    // Admin xử lý refund
    { id: 10, actor_id: 1, actor_role: 'admin', action: 'xu_ly_refund',          resource_type: 'refund',      resource_id: 1, old_value: { trang_thai: 'yeu_cau' }, new_value: { trang_thai: 'thanh_cong' }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-010', tao_luc: '2026-04-12 14:00:00' },
    // Admin gán chuyên gia cho gói
    { id: 11, actor_id: 1, actor_role: 'admin', action: 'gan_chuyen_gia_goi',   resource_type: 'goi_dich_vu_chuyen_gia', resource_id: 1, old_value: null, new_value: { goi_dich_vu_id: 1, chuyen_gia_id: 1 }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-011', tao_luc: '2026-01-06 09:00:00' },
    // Admin cập nhật cấu hình hoa hồng
    { id: 12, actor_id: 1, actor_role: 'admin', action: 'cap_nhat_hoa_hong',    resource_type: 'cau_hinh_hoa_hong', resource_id: 5, old_value: { ty_le: 30 }, new_value: { ty_le: 40, ly_do: 'Chuyên gia xuất sắc' }, ip_address: '192.168.1.10', user_agent: 'Mozilla/5.0 Chrome/120', request_id: 'req-012', tao_luc: '2026-01-06 08:30:00' },
  ],
};

export default audit_logSeeder;
