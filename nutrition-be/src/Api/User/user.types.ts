export const USER_ROLES = [
  'nguoi_dung',
  'chuyen_gia_dinh_duong',
  'quan_tri',
] as const;

export const USER_STATUSES = [
  'hoat_dong',
  'khong_hoat_dong',
  'bi_khoa',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

export interface PublicUser {
  id: number;
  email: string;
  vai_tro: UserRole;
  trang_thai: UserStatus;
  ho_ten: string;
  dang_nhap_cuoi_luc: string | null;
  tao_luc: string;
  cap_nhat_luc: string;
}
