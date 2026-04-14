export enum BookingStatus {
  CHO_THANH_TOAN = 'cho_thanh_toan',
  DA_XAC_NHAN = 'da_xac_nhan',
  DA_CHECKIN = 'da_checkin',
  DANG_TU_VAN = 'dang_tu_van',
  HOAN_THANH = 'hoan_thanh',
  DA_HUY = 'da_huy',
  VO_HIEU_HOA = 'vo_hieu_hoa',
}

export const BookingStatusList = Object.values(BookingStatus);
