-- ============================================================
-- PACKAGE-FIRST CONSULTATION SYSTEM - TARGET DATABASE SCHEMA
-- Updated for new business flow:
-- Customer buys service package -> chooses expert in package -> books consultation
-- Expert commission is calculated monthly from completed valid bookings.
-- ============================================================

-- ============================================================
-- 1. IDENTITY & PROFILE
-- ============================================================

CREATE TABLE tai_khoan (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(191) NOT NULL,
  mat_khau_ma_hoa VARCHAR(255) NOT NULL,
  vai_tro ENUM('customer', 'expert', 'admin') NOT NULL,
  trang_thai ENUM('hoat_dong', 'khong_hoat_dong', 'bi_khoa') NOT NULL DEFAULT 'hoat_dong',
  ho_ten VARCHAR(150) NOT NULL,
  so_dien_thoai VARCHAR(30) NULL,
  ma_dat_lai_mat_khau VARCHAR(255) NULL,
  het_han_ma_dat_lai DATETIME NULL,
  dang_nhap_cuoi_luc DATETIME NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  xoa_luc DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tai_khoan_email (email),
  KEY idx_tai_khoan_vai_tro_trang_thai (vai_tro, trang_thai)
);

CREATE TABLE ho_so_customer (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  gioi_tinh ENUM('nam', 'nu', 'khac') NULL,
  ngay_sinh DATE NULL,
  anh_dai_dien_url VARCHAR(500) NULL,
  ghi_chu_suc_khoe TEXT NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ho_so_customer_tai_khoan (tai_khoan_id),
  CONSTRAINT fk_ho_so_customer_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ho_so_suc_khoe (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  gioi_tinh ENUM('nam', 'nu', 'khac') NULL,
  ngay_sinh DATE NULL,
  chieu_cao_cm DECIMAL(10,2) NULL,
  can_nang_hien_tai_kg DECIMAL(10,2) NULL,
  muc_do_van_dong ENUM('it_van_dong', 'van_dong_nhe', 'van_dong_vua', 'nang_dong', 'rat_nang_dong') NULL,
  muc_tieu_suc_khoe ENUM('giam_can', 'tang_can', 'giu_can', 'cai_thien_suc_khoe') NULL,
  tinh_trang_suc_khoe JSON NULL,
  di_ung JSON NULL,
  che_do_an_uu_tien JSON NULL,
  thuc_pham_khong_dung JSON NULL,
  ghi_chu_cho_chuyen_gia TEXT NULL,
  da_hoan_thanh TINYINT(1) NOT NULL DEFAULT 0,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ho_so_suc_khoe_tai_khoan (tai_khoan_id),
  CONSTRAINT fk_ho_so_suc_khoe_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE chi_so_suc_khoe (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  do_luc DATETIME NOT NULL,
  can_nang_kg DECIMAL(10,2) NULL,
  vong_eo_cm DECIMAL(10,2) NULL,
  vong_mong_cm DECIMAL(10,2) NULL,
  huyet_ap_tam_thu SMALLINT UNSIGNED NULL,
  huyet_ap_tam_truong SMALLINT UNSIGNED NULL,
  nhip_tim SMALLINT UNSIGNED NULL,
  duong_huyet DECIMAL(10,2) NULL,
  chat_luong_giac_ngu INT UNSIGNED NULL,
  muc_nang_luong INT UNSIGNED NULL,
  bmi DECIMAL(10,2) NULL,
  canh_bao JSON NULL,
  ghi_chu TEXT NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  xoa_luc DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_chi_so_suc_khoe_tai_khoan_do_luc (tai_khoan_id, do_luc),
  CONSTRAINT fk_chi_so_suc_khoe_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE otp (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(191) NOT NULL,
  ma_otp VARCHAR(255) NOT NULL,
  loai ENUM('xac_thuc', 'dat_lai_mat_khau') NOT NULL,
  da_su_dung TINYINT(1) NOT NULL DEFAULT 0,
  het_han_luc DATETIME NOT NULL,
  tao_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_otp_email_loai_su_dung (email, loai, da_su_dung)
);

CREATE TABLE chuyen_gia (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  chuyen_mon TEXT NULL,
  mo_ta TEXT NULL,
  kinh_nghiem TEXT NULL,
  hoc_vi VARCHAR(150) NULL,
  chung_chi TEXT NULL,
  anh_dai_dien_url VARCHAR(500) NULL,
  trang_thai ENUM('cho_duyet', 'tu_choi', 'hoat_dong', 'tam_dung', 'bi_khoa') NOT NULL DEFAULT 'cho_duyet',
  nhan_booking TINYINT(1) NOT NULL DEFAULT 1,
  diem_danh_gia_trung_binh DECIMAL(3,2) NOT NULL DEFAULT 0,
  so_luot_danh_gia INT UNSIGNED NOT NULL DEFAULT 0,
  so_booking_hoan_thanh INT UNSIGNED NOT NULL DEFAULT 0,
  ly_do_tu_choi TEXT NULL,
  ly_do_bi_khoa TEXT NULL,
  duyet_boi BIGINT UNSIGNED NULL,
  duyet_luc DATETIME NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  xoa_luc DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chuyen_gia_tai_khoan (tai_khoan_id),
  KEY idx_chuyen_gia_trang_thai_nhan_booking (trang_thai, nhan_booking),
  CONSTRAINT fk_chuyen_gia_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_chuyen_gia_duyet_boi FOREIGN KEY (duyet_boi) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================
-- 2. SERVICE PACKAGES
-- ============================================================

CREATE TABLE goi_dich_vu (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ma_goi VARCHAR(50) NOT NULL,
  ten_goi VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  loai_goi ENUM('suc_khoe', 'dinh_duong', 'tap_luyen') NOT NULL,
  mo_ta TEXT NULL,
  quyen_loi JSON NULL,
  gia DECIMAL(12,2) NOT NULL DEFAULT 0,
  gia_khuyen_mai DECIMAL(12,2) NULL,
  thoi_han_ngay INT UNSIGNED NOT NULL DEFAULT 30,
  so_luot_tu_van INT UNSIGNED NOT NULL DEFAULT 1,
  thoi_luong_tu_van_phut INT UNSIGNED NOT NULL DEFAULT 30,
  trang_thai ENUM('ban_nhap', 'dang_ban', 'ngung_ban') NOT NULL DEFAULT 'ban_nhap',
  goi_noi_bat TINYINT(1) NOT NULL DEFAULT 0,
  thu_tu_hien_thi INT UNSIGNED NOT NULL DEFAULT 1,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  xoa_luc DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_goi_dich_vu_ma_goi (ma_goi),
  UNIQUE KEY uq_goi_dich_vu_slug (slug),
  KEY idx_goi_dich_vu_loai_trang_thai (loai_goi, trang_thai)
);

CREATE TABLE goi_dich_vu_chuyen_gia (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  goi_dich_vu_id BIGINT UNSIGNED NOT NULL,
  chuyen_gia_id BIGINT UNSIGNED NOT NULL,
  trang_thai ENUM('hoat_dong', 'tam_dung') NOT NULL DEFAULT 'hoat_dong',
  ty_le_hoa_hong_override DECIMAL(5,2) NULL,
  gan_boi BIGINT UNSIGNED NULL,
  gan_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_goi_chuyen_gia (goi_dich_vu_id, chuyen_gia_id),
  KEY idx_goi_chuyen_gia_chuyen_gia (chuyen_gia_id, trang_thai),
  CONSTRAINT fk_goi_chuyen_gia_goi FOREIGN KEY (goi_dich_vu_id) REFERENCES goi_dich_vu(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_goi_chuyen_gia_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES chuyen_gia(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_goi_chuyen_gia_gan_boi FOREIGN KEY (gan_boi) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE goi_da_mua (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  goi_dich_vu_id BIGINT UNSIGNED NOT NULL,
  ma_goi_da_mua VARCHAR(80) NOT NULL,
  trang_thai ENUM('cho_thanh_toan', 'dang_hieu_luc', 'het_luot', 'het_han', 'tam_khoa', 'da_hoan_tien') NOT NULL DEFAULT 'cho_thanh_toan',
  gia_mua DECIMAL(12,2) NOT NULL DEFAULT 0,
  so_luot_tong INT UNSIGNED NOT NULL,
  so_luot_da_dung INT UNSIGNED NOT NULL DEFAULT 0,
  so_luot_con_lai INT UNSIGNED NOT NULL,
  bat_dau_luc DATETIME NULL,
  het_han_luc DATETIME NULL,
  khoa_luc DATETIME NULL,
  ly_do_khoa TEXT NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_goi_da_mua_ma (ma_goi_da_mua),
  KEY idx_goi_da_mua_tai_khoan_trang_thai (tai_khoan_id, trang_thai),
  KEY idx_goi_da_mua_goi_trang_thai (goi_dich_vu_id, trang_thai),
  CONSTRAINT fk_goi_da_mua_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_goi_da_mua_goi FOREIGN KEY (goi_dich_vu_id) REFERENCES goi_dich_vu(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE lich_su_su_dung_goi (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  goi_da_mua_id BIGINT UNSIGNED NOT NULL,
  lich_hen_id BIGINT UNSIGNED NULL,
  loai_su_kien ENUM('giu_luot', 'tru_luot', 'hoan_luot', 'het_han', 'tam_khoa') NOT NULL,
  so_luot_thay_doi INT NOT NULL DEFAULT 0,
  so_luot_con_lai_sau INT UNSIGNED NOT NULL DEFAULT 0,
  ghi_chu TEXT NULL,
  tao_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_lich_su_su_dung_goi (goi_da_mua_id, tao_luc),
  CONSTRAINT fk_lich_su_su_dung_goi_goi_da_mua FOREIGN KEY (goi_da_mua_id) REFERENCES goi_da_mua(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 3. PAYMENTS
-- ============================================================

CREATE TABLE thanh_toan (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  loai_thanh_toan ENUM('mua_goi', 'booking') NOT NULL,
  doi_tuong_id BIGINT UNSIGNED NOT NULL,
  ma_giao_dich VARCHAR(150) NOT NULL,
  cong_thanh_toan ENUM('vnpay', 'chuyen_khoan', 'thu_cong', 'mien_phi') NOT NULL DEFAULT 'vnpay',
  so_tien DECIMAL(12,2) NOT NULL,
  tien_te VARCHAR(10) NOT NULL DEFAULT 'VND',
  trang_thai ENUM('khoi_tao', 'cho_thanh_toan', 'thanh_cong', 'that_bai', 'het_han', 'hoan_tien') NOT NULL DEFAULT 'khoi_tao',
  payment_url TEXT NULL,
  txn_ref VARCHAR(150) NULL,
  gateway_transaction_no VARCHAR(150) NULL,
  raw_request JSON NULL,
  raw_response JSON NULL,
  thanh_toan_luc DATETIME NULL,
  het_han_luc DATETIME NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_thanh_toan_ma_giao_dich (ma_giao_dich),
  UNIQUE KEY uq_thanh_toan_txn_ref (txn_ref),
  KEY idx_thanh_toan_tai_khoan (tai_khoan_id, trang_thai, tao_luc),
  KEY idx_thanh_toan_doi_tuong (loai_thanh_toan, doi_tuong_id),
  CONSTRAINT fk_thanh_toan_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE payment_webhook_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thanh_toan_id BIGINT UNSIGNED NULL,
  txn_ref VARCHAR(150) NULL,
  loai_webhook ENUM('return', 'ipn') NOT NULL,
  hop_le TINYINT(1) NOT NULL DEFAULT 0,
  payload JSON NOT NULL,
  ket_qua_xu_ly JSON NULL,
  tao_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_payment_webhook_txn_ref (txn_ref, tao_luc),
  CONSTRAINT fk_payment_webhook_thanh_toan FOREIGN KEY (thanh_toan_id) REFERENCES thanh_toan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE refund (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thanh_toan_id BIGINT UNSIGNED NOT NULL,
  so_tien DECIMAL(12,2) NOT NULL,
  ly_do TEXT NOT NULL,
  trang_thai ENUM('yeu_cau', 'dang_xu_ly', 'thanh_cong', 'that_bai', 'tu_choi') NOT NULL DEFAULT 'yeu_cau',
  xu_ly_boi BIGINT UNSIGNED NULL,
  xu_ly_luc DATETIME NULL,
  raw_response JSON NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_refund_thanh_toan (thanh_toan_id, trang_thai),
  CONSTRAINT fk_refund_thanh_toan FOREIGN KEY (thanh_toan_id) REFERENCES thanh_toan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_refund_xu_ly_boi FOREIGN KEY (xu_ly_boi) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================
-- 4. EXPERT AVAILABILITY & BOOKING
-- ============================================================

CREATE TABLE lich_lam_viec_chuyen_gia (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chuyen_gia_id BIGINT UNSIGNED NOT NULL,
  thu_trong_tuan TINYINT UNSIGNED NOT NULL COMMENT '1=Monday, 7=Sunday',
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL,
  thoi_luong_slot_phut INT UNSIGNED NOT NULL DEFAULT 30,
  trang_thai ENUM('hoat_dong', 'tam_dung') NOT NULL DEFAULT 'hoat_dong',
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_lich_lam_viec_chuyen_gia (chuyen_gia_id, thu_trong_tuan, trang_thai),
  CONSTRAINT fk_lich_lam_viec_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES chuyen_gia(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE lich_ban_chuyen_gia (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chuyen_gia_id BIGINT UNSIGNED NOT NULL,
  bat_dau_luc DATETIME NOT NULL,
  ket_thuc_luc DATETIME NOT NULL,
  ly_do TEXT NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_lich_ban_chuyen_gia (chuyen_gia_id, bat_dau_luc, ket_thuc_luc),
  CONSTRAINT fk_lich_ban_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES chuyen_gia(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE lich_hen (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ma_lich_hen VARCHAR(80) NOT NULL,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  chuyen_gia_id BIGINT UNSIGNED NOT NULL,
  goi_dich_vu_id BIGINT UNSIGNED NOT NULL,
  goi_da_mua_id BIGINT UNSIGNED NOT NULL,
  thanh_toan_id BIGINT UNSIGNED NULL,
  muc_dich TEXT NULL,
  ghi_chu_customer TEXT NULL,
  ngay_hen DATE NOT NULL,
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL,
  bat_dau_luc DATETIME NOT NULL,
  ket_thuc_luc DATETIME NOT NULL,
  trang_thai ENUM('cho_xac_nhan', 'cho_thanh_toan', 'da_xac_nhan', 'da_checkin', 'dang_tu_van', 'hoan_thanh', 'da_huy', 'vo_hieu_hoa') NOT NULL DEFAULT 'cho_xac_nhan',
  giu_cho_den_luc DATETIME NULL,
  ly_do_huy TEXT NULL,
  huy_boi BIGINT UNSIGNED NULL,
  huy_luc DATETIME NULL,
  hoan_thanh_luc DATETIME NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lich_hen_ma (ma_lich_hen),
  KEY idx_lich_hen_customer_ngay (tai_khoan_id, ngay_hen, trang_thai),
  KEY idx_lich_hen_chuyen_gia_ngay (chuyen_gia_id, ngay_hen, trang_thai),
  KEY idx_lich_hen_goi_da_mua (goi_da_mua_id, trang_thai),
  CONSTRAINT fk_lich_hen_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_lich_hen_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES chuyen_gia(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_lich_hen_goi FOREIGN KEY (goi_dich_vu_id) REFERENCES goi_dich_vu(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_lich_hen_goi_da_mua FOREIGN KEY (goi_da_mua_id) REFERENCES goi_da_mua(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_lich_hen_thanh_toan FOREIGN KEY (thanh_toan_id) REFERENCES thanh_toan(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_lich_hen_huy_boi FOREIGN KEY (huy_boi) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE booking_timeline (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lich_hen_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED NULL,
  su_kien VARCHAR(80) NOT NULL,
  trang_thai_truoc VARCHAR(50) NULL,
  trang_thai_sau VARCHAR(50) NULL,
  ghi_chu TEXT NULL,
  metadata JSON NULL,
  tao_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_booking_timeline_lich_hen (lich_hen_id, tao_luc),
  CONSTRAINT fk_booking_timeline_lich_hen FOREIGN KEY (lich_hen_id) REFERENCES lich_hen(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_booking_timeline_actor FOREIGN KEY (actor_id) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE lich_su_su_dung_goi
  ADD CONSTRAINT fk_lich_su_su_dung_goi_lich_hen
  FOREIGN KEY (lich_hen_id) REFERENCES lich_hen(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE ghi_chu_tu_van (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lich_hen_id BIGINT UNSIGNED NOT NULL,
  chuyen_gia_id BIGINT UNSIGNED NOT NULL,
  tom_tat_cho_customer TEXT NULL,
  ghi_chu_noi_bo TEXT NULL,
  khuyen_nghi_sau_tu_van TEXT NULL,
  tags JSON NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ghi_chu_tu_van_lich_hen (lich_hen_id),
  CONSTRAINT fk_ghi_chu_tu_van_lich_hen FOREIGN KEY (lich_hen_id) REFERENCES lich_hen(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ghi_chu_tu_van_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES chuyen_gia(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
-- 5. CHAT / CALL IN BOOKING CONTEXT
-- ============================================================

CREATE TABLE tin_nhan (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lich_hen_id BIGINT UNSIGNED NOT NULL,
  nguoi_gui_id BIGINT UNSIGNED NOT NULL,
  loai ENUM('text', 'file') NOT NULL DEFAULT 'text',
  noi_dung TEXT NULL,
  tep_dinh_kem JSON NULL,
  da_doc_luc DATETIME NULL,
  da_doc_boi_id BIGINT UNSIGNED NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_tin_nhan_lich_hen_tao_luc (lich_hen_id, tao_luc),
  CONSTRAINT fk_tin_nhan_lich_hen FOREIGN KEY (lich_hen_id) REFERENCES lich_hen(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tin_nhan_nguoi_gui FOREIGN KEY (nguoi_gui_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_tin_nhan_da_doc_boi FOREIGN KEY (da_doc_boi_id) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE cuoc_goi_tu_van (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lich_hen_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('livekit', 'jitsi', 'external') NOT NULL DEFAULT 'livekit',
  room_name VARCHAR(150) NOT NULL,
  trang_thai ENUM('cho', 'dang_dien_ra', 'ket_thuc', 'bi_huy') NOT NULL DEFAULT 'cho',
  bat_dau_luc DATETIME NULL,
  ket_thuc_luc DATETIME NULL,
  thoi_luong_giay INT UNSIGNED NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cuoc_goi_lich_hen (lich_hen_id),
  UNIQUE KEY uq_cuoc_goi_room_name (room_name),
  CONSTRAINT fk_cuoc_goi_lich_hen FOREIGN KEY (lich_hen_id) REFERENCES lich_hen(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 6. REVIEWS
-- ============================================================

CREATE TABLE danh_gia (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lich_hen_id BIGINT UNSIGNED NOT NULL,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  chuyen_gia_id BIGINT UNSIGNED NOT NULL,
  diem INT UNSIGNED NOT NULL,
  noi_dung TEXT NULL,
  tags JSON NULL,
  trang_thai ENUM('hien_thi', 'bi_an', 'bi_bao_cao', 'da_xoa') NOT NULL DEFAULT 'hien_thi',
  an_boi BIGINT UNSIGNED NULL,
  an_luc DATETIME NULL,
  ly_do_an TEXT NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_danh_gia_lich_hen (lich_hen_id),
  KEY idx_danh_gia_chuyen_gia (chuyen_gia_id, trang_thai, tao_luc),
  CONSTRAINT fk_danh_gia_lich_hen FOREIGN KEY (lich_hen_id) REFERENCES lich_hen(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_danh_gia_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_danh_gia_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES chuyen_gia(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_danh_gia_an_boi FOREIGN KEY (an_boi) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE phan_hoi_danh_gia (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  danh_gia_id BIGINT UNSIGNED NOT NULL,
  chuyen_gia_id BIGINT UNSIGNED NOT NULL,
  noi_dung TEXT NOT NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_phan_hoi_danh_gia (danh_gia_id),
  CONSTRAINT fk_phan_hoi_danh_gia FOREIGN KEY (danh_gia_id) REFERENCES danh_gia(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_phan_hoi_danh_gia_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES chuyen_gia(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
-- 7. AI CHAT & HEALTH RECOMMENDATIONS
-- ============================================================

CREATE TABLE phien_chat_ai (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  tieu_de VARCHAR(191) NULL,
  loai_context ENUM('suc_khoe', 'dinh_duong', 'tap_luyen', 'tu_van_chung') NOT NULL DEFAULT 'suc_khoe',
  context_snapshot JSON NULL,
  trang_thai ENUM('dang_mo', 'da_luu_tru') NOT NULL DEFAULT 'dang_mo',
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_phien_chat_ai_tai_khoan (tai_khoan_id, trang_thai, cap_nhat_luc),
  CONSTRAINT fk_phien_chat_ai_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE tin_nhan_chat_ai (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phien_chat_ai_id BIGINT UNSIGNED NOT NULL,
  vai_tro ENUM('user', 'assistant', 'system') NOT NULL,
  noi_dung MEDIUMTEXT NOT NULL,
  model VARCHAR(100) NULL,
  token_input INT UNSIGNED NULL,
  token_output INT UNSIGNED NULL,
  trang_thai ENUM('thanh_cong', 'that_bai') NOT NULL DEFAULT 'thanh_cong',
  loi TEXT NULL,
  metadata JSON NULL,
  tao_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_tin_nhan_chat_ai_phien (phien_chat_ai_id, tao_luc),
  CONSTRAINT fk_tin_nhan_chat_ai_phien FOREIGN KEY (phien_chat_ai_id) REFERENCES phien_chat_ai(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE goi_y_suc_khoe (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  phien_chat_ai_id BIGINT UNSIGNED NULL,
  loai_goi_y ENUM('ke_hoach_suc_khoe', 'canh_bao_suc_khoe') NOT NULL DEFAULT 'ke_hoach_suc_khoe',
  input_snapshot JSON NOT NULL,
  noi_dung_goi_y JSON NOT NULL,
  muc_do_uu_tien ENUM('thap', 'trung_binh', 'cao') NOT NULL DEFAULT 'trung_binh',
  canh_bao JSON NULL,
  ly_do TEXT NULL,
  trang_thai ENUM('moi_tao', 'da_ap_dung', 'luu_tru') NOT NULL DEFAULT 'moi_tao',
  ap_dung_luc DATETIME NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_goi_y_suc_khoe_tai_khoan (tai_khoan_id, trang_thai, tao_luc),
  CONSTRAINT fk_goi_y_suc_khoe_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_goi_y_suc_khoe_phien_chat FOREIGN KEY (phien_chat_ai_id) REFERENCES phien_chat_ai(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE goi_y_dinh_duong_tap_luyen (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  phien_chat_ai_id BIGINT UNSIGNED NULL,
  input_snapshot JSON NOT NULL,
  muc_tieu_calories DECIMAL(10,2) NULL,
  muc_tieu_protein_g DECIMAL(10,2) NULL,
  muc_tieu_carb_g DECIMAL(10,2) NULL,
  muc_tieu_fat_g DECIMAL(10,2) NULL,
  goi_y_dinh_duong JSON NULL,
  goi_y_tap_luyen JSON NULL,
  canh_bao JSON NULL,
  ly_do TEXT NULL,
  trang_thai ENUM('moi_tao', 'da_ap_dung', 'luu_tru') NOT NULL DEFAULT 'moi_tao',
  ap_dung_luc DATETIME NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_goi_y_dinh_duong_tap_luyen_tai_khoan (tai_khoan_id, trang_thai, tao_luc),
  CONSTRAINT fk_goi_y_dinh_duong_tap_luyen_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_goi_y_dinh_duong_tap_luyen_phien_chat FOREIGN KEY (phien_chat_ai_id) REFERENCES phien_chat_ai(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================
-- 8. REVENUE & COMMISSION
-- ============================================================

CREATE TABLE cau_hinh_hoa_hong (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pham_vi ENUM('he_thong', 'goi_dich_vu', 'chuyen_gia', 'goi_chuyen_gia') NOT NULL,
  goi_dich_vu_id BIGINT UNSIGNED NULL,
  chuyen_gia_id BIGINT UNSIGNED NULL,
  ty_le_hoa_hong DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  hieu_luc_tu DATE NOT NULL,
  hieu_luc_den DATE NULL,
  trang_thai ENUM('hoat_dong', 'ngung_ap_dung') NOT NULL DEFAULT 'hoat_dong',
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_cau_hinh_hoa_hong_scope (pham_vi, goi_dich_vu_id, chuyen_gia_id, trang_thai),
  CONSTRAINT fk_cau_hinh_hoa_hong_goi FOREIGN KEY (goi_dich_vu_id) REFERENCES goi_dich_vu(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_cau_hinh_hoa_hong_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES chuyen_gia(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE ky_hoa_hong (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ma_ky VARCHAR(30) NOT NULL,
  thang TINYINT UNSIGNED NOT NULL,
  nam SMALLINT UNSIGNED NOT NULL,
  tu_ngay DATE NOT NULL,
  den_ngay DATE NOT NULL,
  trang_thai ENUM('nhap', 'da_chot', 'da_chi_tra') NOT NULL DEFAULT 'nhap',
  tong_doanh_thu_hop_le DECIMAL(14,2) NOT NULL DEFAULT 0,
  tong_hoa_hong DECIMAL(14,2) NOT NULL DEFAULT 0,
  chot_boi BIGINT UNSIGNED NULL,
  chot_luc DATETIME NULL,
  chi_tra_boi BIGINT UNSIGNED NULL,
  chi_tra_luc DATETIME NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ky_hoa_hong_ma_ky (ma_ky),
  UNIQUE KEY uq_ky_hoa_hong_thang_nam (thang, nam),
  CONSTRAINT fk_ky_hoa_hong_chot_boi FOREIGN KEY (chot_boi) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ky_hoa_hong_chi_tra_boi FOREIGN KEY (chi_tra_boi) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE chi_tiet_hoa_hong (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ky_hoa_hong_id BIGINT UNSIGNED NOT NULL,
  lich_hen_id BIGINT UNSIGNED NOT NULL,
  thanh_toan_id BIGINT UNSIGNED NOT NULL,
  chuyen_gia_id BIGINT UNSIGNED NOT NULL,
  goi_dich_vu_id BIGINT UNSIGNED NOT NULL,
  doanh_thu_hop_le DECIMAL(12,2) NOT NULL,
  ty_le_hoa_hong DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  so_tien_hoa_hong DECIMAL(12,2) NOT NULL,
  trang_thai ENUM('nhap', 'da_chot', 'da_huy') NOT NULL DEFAULT 'nhap',
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chi_tiet_hoa_hong_lich_hen (lich_hen_id),
  KEY idx_chi_tiet_hoa_hong_ky_chuyen_gia (ky_hoa_hong_id, chuyen_gia_id),
  CONSTRAINT fk_chi_tiet_hoa_hong_ky FOREIGN KEY (ky_hoa_hong_id) REFERENCES ky_hoa_hong(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_chi_tiet_hoa_hong_lich_hen FOREIGN KEY (lich_hen_id) REFERENCES lich_hen(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_chi_tiet_hoa_hong_thanh_toan FOREIGN KEY (thanh_toan_id) REFERENCES thanh_toan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_chi_tiet_hoa_hong_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES chuyen_gia(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_chi_tiet_hoa_hong_goi FOREIGN KEY (goi_dich_vu_id) REFERENCES goi_dich_vu(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE chi_tra_hoa_hong (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ky_hoa_hong_id BIGINT UNSIGNED NOT NULL,
  chuyen_gia_id BIGINT UNSIGNED NOT NULL,
  so_booking INT UNSIGNED NOT NULL DEFAULT 0,
  tong_doanh_thu_hop_le DECIMAL(14,2) NOT NULL DEFAULT 0,
  tong_hoa_hong DECIMAL(14,2) NOT NULL DEFAULT 0,
  trang_thai ENUM('cho_chi_tra', 'da_chi_tra', 'that_bai') NOT NULL DEFAULT 'cho_chi_tra',
  phuong_thuc_chi_tra VARCHAR(80) NULL,
  ma_chi_tra VARCHAR(120) NULL,
  ghi_chu TEXT NULL,
  chi_tra_luc DATETIME NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chi_tra_hoa_hong_ky_chuyen_gia (ky_hoa_hong_id, chuyen_gia_id),
  CONSTRAINT fk_chi_tra_hoa_hong_ky FOREIGN KEY (ky_hoa_hong_id) REFERENCES ky_hoa_hong(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_chi_tra_hoa_hong_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES chuyen_gia(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
-- 9. COMPLAINTS
-- ============================================================

CREATE TABLE khieu_nai (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ma_khieu_nai VARCHAR(80) NOT NULL,
  nguoi_gui_id BIGINT UNSIGNED NOT NULL,
  loai_khieu_nai ENUM('booking', 'thanh_toan', 'danh_gia', 'khac') NOT NULL,
  doi_tuong_id BIGINT UNSIGNED NULL,
  tieu_de VARCHAR(191) NOT NULL,
  noi_dung TEXT NOT NULL,
  muc_uu_tien ENUM('thap', 'trung_binh', 'cao') NOT NULL DEFAULT 'trung_binh',
  trang_thai ENUM('moi', 'dang_xu_ly', 'cho_phan_hoi', 'da_giai_quyet', 'da_dong') NOT NULL DEFAULT 'moi',
  gan_cho_id BIGINT UNSIGNED NULL,
  ket_qua_xu_ly TEXT NULL,
  dong_luc DATETIME NULL,
  tao_luc DATETIME NOT NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_khieu_nai_ma (ma_khieu_nai),
  KEY idx_khieu_nai_nguoi_gui (nguoi_gui_id, trang_thai, tao_luc),
  CONSTRAINT fk_khieu_nai_nguoi_gui FOREIGN KEY (nguoi_gui_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_khieu_nai_gan_cho FOREIGN KEY (gan_cho_id) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE khieu_nai_tin_nhan (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  khieu_nai_id BIGINT UNSIGNED NOT NULL,
  nguoi_gui_id BIGINT UNSIGNED NOT NULL,
  noi_dung TEXT NOT NULL,
  tep_dinh_kem JSON NULL,
  tao_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_khieu_nai_tin_nhan (khieu_nai_id, tao_luc),
  CONSTRAINT fk_khieu_nai_tin_nhan_khieu_nai FOREIGN KEY (khieu_nai_id) REFERENCES khieu_nai(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_khieu_nai_tin_nhan_nguoi_gui FOREIGN KEY (nguoi_gui_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
-- 10. NOTIFICATION, AUDIT, EXPORT
-- ============================================================

CREATE TABLE thong_bao (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tai_khoan_id BIGINT UNSIGNED NOT NULL,
  nguoi_gui_id BIGINT UNSIGNED NULL,
  loai VARCHAR(80) NOT NULL,
  tieu_de VARCHAR(191) NOT NULL,
  noi_dung TEXT NOT NULL,
  trang_thai ENUM('chua_doc', 'da_doc') NOT NULL DEFAULT 'chua_doc',
  duong_dan_hanh_dong VARCHAR(500) NULL,
  entity_type VARCHAR(80) NULL,
  entity_id BIGINT UNSIGNED NULL,
  tao_luc DATETIME NOT NULL,
  doc_luc DATETIME NULL,
  cap_nhat_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_thong_bao_tai_khoan_trang_thai (tai_khoan_id, trang_thai, tao_luc),
  CONSTRAINT fk_thong_bao_tai_khoan FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_thong_bao_nguoi_gui FOREIGN KEY (nguoi_gui_id) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id BIGINT UNSIGNED NULL,
  actor_role VARCHAR(50) NULL,
  action VARCHAR(120) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_id BIGINT UNSIGNED NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  ip_address VARCHAR(80) NULL,
  user_agent TEXT NULL,
  request_id VARCHAR(120) NULL,
  tao_luc DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_audit_resource (resource_type, resource_id, tao_luc),
  KEY idx_audit_actor (actor_id, tao_luc),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES tai_khoan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE export_job (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nguoi_tao_id BIGINT UNSIGNED NOT NULL,
  loai_export ENUM('doanh_thu', 'thanh_toan', 'hoa_hong', 'danh_gia', 'khieu_nai') NOT NULL,
  dinh_dang ENUM('csv', 'xlsx', 'pdf') NOT NULL DEFAULT 'csv',
  filter_json JSON NULL,
  trang_thai ENUM('cho_xu_ly', 'dang_xu_ly', 'hoan_thanh', 'that_bai') NOT NULL DEFAULT 'cho_xu_ly',
  file_url VARCHAR(500) NULL,
  loi TEXT NULL,
  tao_luc DATETIME NOT NULL,
  hoan_thanh_luc DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_export_job_nguoi_tao (nguoi_tao_id, trang_thai, tao_luc),
  CONSTRAINT fk_export_job_nguoi_tao FOREIGN KEY (nguoi_tao_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
-- 11. SEED DATA FOR STANDARD PACKAGES
-- ============================================================

INSERT INTO goi_dich_vu (
  ma_goi,
  ten_goi,
  slug,
  loai_goi,
  mo_ta,
  gia,
  thoi_han_ngay,
  so_luot_tu_van,
  thoi_luong_tu_van_phut,
  trang_thai,
  thu_tu_hien_thi,
  tao_luc,
  cap_nhat_luc
) VALUES
('GOI_SUC_KHOE', 'Tu van dich vu suc khoe', 'tu-van-dich-vu-suc-khoe', 'suc_khoe', 'Goi tu van tong quan ve tinh trang va dich vu suc khoe phu hop.', 300000, 30, 1, 30, 'dang_ban', 1, NOW(), NOW()),
('GOI_DINH_DUONG', 'Tu van che do dinh duong', 'tu-van-che-do-dinh-duong', 'dinh_duong', 'Goi tu van che do dinh duong va thuc don phu hop muc tieu.', 400000, 30, 1, 45, 'dang_ban', 2, NOW(), NOW()),
('GOI_TAP_LUYEN', 'Tu van tap luyen', 'tu-van-tap-luyen', 'tap_luyen', 'Goi tu van lich tap va dinh huong van dong phu hop.', 350000, 30, 1, 45, 'dang_ban', 3, NOW(), NOW());

INSERT INTO cau_hinh_hoa_hong (
  pham_vi,
  ty_le_hoa_hong,
  hieu_luc_tu,
  trang_thai,
  tao_luc,
  cap_nhat_luc
) VALUES
('he_thong', 30.00, CURDATE(), 'hoat_dong', NOW(), NOW());
