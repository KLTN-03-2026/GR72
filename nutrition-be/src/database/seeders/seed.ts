import 'dotenv/config';
import { hash } from 'bcrypt';
import { NhomThucPhamEntity } from '../../Api/Admin/Food/entities/nhom-thuc-pham.entity';
import { ThucPhamEntity } from '../../Api/Admin/Food/entities/thuc-pham.entity';
import { YeuCauDuyetThucPhamEntity } from '../../Api/Admin/FoodReview/entities/yeu-cau-duyet-thuc-pham.entity';
import { ThongBaoEntity } from '../../Api/Admin/FoodReview/entities/thong-bao.entity';
import { GoiDichVuEntity } from '../../Api/Admin/Package/entities/goi-dich-vu.entity';
import { ChucNangGoiDichVuEntity } from '../../Api/Admin/PackageFeature/entities/chuc-nang-goi-dich-vu.entity';
import { DangKyGoiDichVuEntity } from '../../Api/Admin/Subscription/entities/dang-ky-goi-dich-vu.entity';
import AppDataSource from '../data-source';
import { HoSoEntity } from '../../Api/Admin/User/entities/ho-so.entity';
import { TaiKhoanEntity } from '../../Api/Admin/User/entities/tai-khoan.entity';
import { BaiVietEntity } from '../../Api/Nutritionist/Article/entities/bai-viet.entity';
import { CongThucEntity } from '../../Api/Nutritionist/Recipe/entities/cong-thuc.entity';
import { ThanhPhanCongThucEntity } from '../../Api/Nutritionist/Recipe/entities/cong-thuc.entity';
import { ThucDonMauEntity, ChiTietThucDonMauEntity } from '../../Api/Nutritionist/MealTemplate/entities/thuc-don-mau.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Api/Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { GoiTuVanEntity } from '../../Api/Admin/ChuyenGiaDinhDuong/entities/goi-tu-van.entity';
import { LichHenEntity } from '../../Api/Admin/Booking/entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from '../../Api/Admin/Booking/entities/thanh-toan-tu-van.entity';
import { DanhGiaEntity } from '../../Api/Admin/Booking/entities/danh-gia.entity';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
  return hash(password, saltRounds);
}

function getSeedDefaultPassword(): string {
  const fromEnv = process.env.SEED_DEFAULT_PASSWORD?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : 'password123';
}

async function seedUsers() {
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const profileRepository = AppDataSource.getRepository(HoSoEntity);
  const now = new Date();
  const defaultPassword = getSeedDefaultPassword();
  const passwordHash = await hashPassword(defaultPassword);

  await userRepository.upsert(
    [
      {
        email: 'user@nutriwise.vn',
        ho_ten: 'Nguoi Dung Demo',
        vai_tro: 'nguoi_dung',
        trang_thai: 'hoat_dong',
        mat_khau_ma_hoa: passwordHash,
        ma_dat_lai_mat_khau: null,
        het_han_ma_dat_lai: null,
        dang_nhap_cuoi_luc: null,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
      {
        email: 'nutritionist@nutriwise.vn',
        ho_ten: 'Chuyen Gia Dinh Duong Demo',
        vai_tro: 'chuyen_gia_dinh_duong',
        trang_thai: 'hoat_dong',
        mat_khau_ma_hoa: passwordHash,
        ma_dat_lai_mat_khau: null,
        het_han_ma_dat_lai: null,
        dang_nhap_cuoi_luc: null,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
      {
        email: 'admin@nutriwise.vn',
        ho_ten: 'Quan Tri Demo',
        vai_tro: 'quan_tri',
        trang_thai: 'hoat_dong',
        mat_khau_ma_hoa: passwordHash,
        ma_dat_lai_mat_khau: null,
        het_han_ma_dat_lai: null,
        dang_nhap_cuoi_luc: null,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
    ],
    ['email'],
  );

  const users = await userRepository.find({
    where: [
      { email: 'user@nutriwise.vn' },
      { email: 'nutritionist@nutriwise.vn' },
      { email: 'admin@nutriwise.vn' },
    ],
  });

  await profileRepository.upsert(
    users.map((user) => ({
      tai_khoan_id: user.id,
      gioi_tinh: null,
      ngay_sinh: null,
      chieu_cao_cm: null,
      can_nang_hien_tai_kg: null,
      muc_do_van_dong: null,
      che_do_an_uu_tien: null,
      di_ung: null,
      thuc_pham_khong_thich: null,
      anh_dai_dien_url: null,
      tao_luc: now,
      cap_nhat_luc: now,
    })),
    ['tai_khoan_id'],
  );
}

async function seedFoodCatalog() {
  const groupRepository = AppDataSource.getRepository(NhomThucPhamEntity);
  const foodRepository = AppDataSource.getRepository(ThucPhamEntity);
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const now = new Date();

  await groupRepository.upsert(
    [
      {
        ten: 'Tinh bột',
        slug: 'tinh-bot',
        mo_ta: 'Nguồn năng lượng chính như cơm, bánh mì, khoai.',
        tao_luc: now,
        cap_nhat_luc: now,
      },
      {
        ten: 'Đạm',
        slug: 'dam',
        mo_ta: 'Thịt, cá, trứng, sữa và các nguồn protein khác.',
        tao_luc: now,
        cap_nhat_luc: now,
      },
      {
        ten: 'Rau củ',
        slug: 'rau-cu',
        mo_ta: 'Nhóm rau xanh, củ quả giàu vi chất và chất xơ.',
        tao_luc: now,
        cap_nhat_luc: now,
      },
      {
        ten: 'Trái cây',
        slug: 'trai-cay',
        mo_ta: 'Nhóm hoa quả dùng trong bữa phụ và bữa chính.',
        tao_luc: now,
        cap_nhat_luc: now,
      },
      {
        ten: 'Đồ uống',
        slug: 'do-uong',
        mo_ta: 'Sữa, nước ép và các loại đồ uống có dinh dưỡng.',
        tao_luc: now,
        cap_nhat_luc: now,
      },
    ],
    ['slug'],
  );

  const [groups, adminUser] = await Promise.all([
    groupRepository.find(),
    userRepository.findOne({
      where: {
        email: 'admin@nutriwise.vn',
      },
    }),
  ]);

  const groupBySlug = new Map(groups.map((group) => [group.slug, group]));
  const adminId = adminUser?.id ?? null;

  await foodRepository.upsert(
    [
      {
        nhom_thuc_pham_id: groupBySlug.get('tinh-bot')!.id,
        ten: 'Cơm trắng',
        slug: 'com-trang',
        mo_ta: 'Cơm trắng nấu chín, dùng phổ biến trong bữa ăn hằng ngày.',
        the_gan: ['pho-bien', 'bua-chinh'],
        loai_nguon: 'noi_bo',
        ten_nguon: 'NutriWise Internal',
        ma_nguon: 'NW-RICE-001',
        khau_phan_tham_chieu: '100',
        don_vi_khau_phan: 'g',
        calories_100g: '130',
        protein_100g: '2.7',
        carb_100g: '28.2',
        fat_100g: '0.3',
        chat_xo_100g: '0.4',
        duong_100g: '0.1',
        natri_100g: '1',
        du_lieu_goc: { provider: 'manual_seed' },
        da_xac_minh: true,
        tao_boi: adminId,
        cap_nhat_boi: adminId,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
      {
        nhom_thuc_pham_id: groupBySlug.get('dam')!.id,
        ten: 'Ức gà không da',
        slug: 'uc-ga-khong-da',
        mo_ta: 'Phần ức gà bỏ da, giàu protein và ít chất béo.',
        the_gan: ['high-protein', 'lean'],
        loai_nguon: 'noi_bo',
        ten_nguon: 'NutriWise Internal',
        ma_nguon: 'NW-CHK-001',
        khau_phan_tham_chieu: '100',
        don_vi_khau_phan: 'g',
        calories_100g: '165',
        protein_100g: '31',
        carb_100g: '0',
        fat_100g: '3.6',
        chat_xo_100g: '0',
        duong_100g: '0',
        natri_100g: '74',
        du_lieu_goc: { provider: 'manual_seed' },
        da_xac_minh: true,
        tao_boi: adminId,
        cap_nhat_boi: adminId,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
      {
        nhom_thuc_pham_id: groupBySlug.get('rau-cu')!.id,
        ten: 'Bông cải xanh',
        slug: 'bong-cai-xanh',
        mo_ta: 'Rau xanh giàu vitamin C và chất xơ.',
        the_gan: ['rau-xanh', 'fiber'],
        loai_nguon: 'noi_bo',
        ten_nguon: 'NutriWise Internal',
        ma_nguon: 'NW-VEG-001',
        khau_phan_tham_chieu: '100',
        don_vi_khau_phan: 'g',
        calories_100g: '34',
        protein_100g: '2.8',
        carb_100g: '6.6',
        fat_100g: '0.4',
        chat_xo_100g: '2.6',
        duong_100g: '1.7',
        natri_100g: '33',
        du_lieu_goc: { provider: 'manual_seed' },
        da_xac_minh: true,
        tao_boi: adminId,
        cap_nhat_boi: adminId,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
      {
        nhom_thuc_pham_id: groupBySlug.get('trai-cay')!.id,
        ten: 'Chuối',
        slug: 'chuoi',
        mo_ta: 'Chuối chín, phù hợp bữa phụ trước và sau vận động.',
        the_gan: ['fruit', 'snack'],
        loai_nguon: 'noi_bo',
        ten_nguon: 'NutriWise Internal',
        ma_nguon: 'NW-FRT-001',
        khau_phan_tham_chieu: '100',
        don_vi_khau_phan: 'g',
        calories_100g: '89',
        protein_100g: '1.1',
        carb_100g: '22.8',
        fat_100g: '0.3',
        chat_xo_100g: '2.6',
        duong_100g: '12.2',
        natri_100g: '1',
        du_lieu_goc: { provider: 'manual_seed' },
        da_xac_minh: true,
        tao_boi: adminId,
        cap_nhat_boi: adminId,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
      {
        nhom_thuc_pham_id: groupBySlug.get('do-uong')!.id,
        ten: 'Sữa tươi không đường',
        slug: 'sua-tuoi-khong-duong',
        mo_ta: 'Sữa tươi không đường dùng cho bữa sáng hoặc bữa phụ.',
        the_gan: ['dairy', 'drink'],
        loai_nguon: 'noi_bo',
        ten_nguon: 'NutriWise Internal',
        ma_nguon: 'NW-DRK-001',
        khau_phan_tham_chieu: '100',
        don_vi_khau_phan: 'ml',
        calories_100g: '61',
        protein_100g: '3.2',
        carb_100g: '4.8',
        fat_100g: '3.3',
        chat_xo_100g: '0',
        duong_100g: '5',
        natri_100g: '43',
        du_lieu_goc: { provider: 'manual_seed' },
        da_xac_minh: true,
        tao_boi: adminId,
        cap_nhat_boi: adminId,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
    ],
    ['slug'],
  );
}

async function seedFoodReviewRequests() {
  const reviewRepository = AppDataSource.getRepository(YeuCauDuyetThucPhamEntity);
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const foodRepository = AppDataSource.getRepository(ThucPhamEntity);
  const now = new Date();

  const nutritionist = await userRepository.findOne({
    where: { email: 'nutritionist@nutriwise.vn' },
  });
  const admin = await userRepository.findOne({
    where: { email: 'admin@nutriwise.vn' },
  });
  const food = await foodRepository.findOne({
    where: { slug: 'com-trang' },
  });

  if (!nutritionist) return;

  const existing = await reviewRepository.count();
  if (existing > 0) return;

  await reviewRepository.save([
    {
      thuc_pham_id: food?.id ?? null,
      loai_yeu_cau: 'cap_nhat',
      ten_nguon: 'FatSecret API',
      ma_nguon: 'FS-RICE-002',
      de_xuat_boi: nutritionist.id,
      trang_thai: 'cho_duyet' as const,
      du_lieu_hien_tai: food ? { ten: food.ten, calories_100g: food.calories_100g } : null,
      du_lieu_de_xuat: {
        ten: 'Cơm trắng (cập nhật)',
        calories_100g: 131,
        protein_100g: 2.69,
        carb_100g: 28.6,
        fat_100g: 0.28,
      },
      ly_do: 'Cập nhật dữ liệu dinh dưỡng chính xác hơn từ FatSecret.',
      duyet_boi: null,
      duyet_luc: null,
      ghi_chu_duyet: null,
      tao_luc: now,
      cap_nhat_luc: now,
    },
    {
      thuc_pham_id: null,
      loai_yeu_cau: 'them_moi',
      ten_nguon: 'USDA FoodData',
      ma_nguon: 'USDA-170567',
      de_xuat_boi: nutritionist.id,
      trang_thai: 'cho_duyet' as const,
      du_lieu_hien_tai: null,
      du_lieu_de_xuat: {
        ten: 'Yến mạch nguyên cám',
        nhom_thuc_pham_id: 1,
        calories_100g: 389,
        protein_100g: 16.9,
        carb_100g: 66.3,
        fat_100g: 6.9,
        chat_xo_100g: 10.6,
        duong_100g: 0,
        natri_100g: 2,
      },
      ly_do: 'Bổ sung thực phẩm phổ biến cho chế độ ăn lành mạnh.',
      duyet_boi: null,
      duyet_luc: null,
      ghi_chu_duyet: null,
      tao_luc: now,
      cap_nhat_luc: now,
    },
    {
      thuc_pham_id: null,
      loai_yeu_cau: 'them_moi',
      ten_nguon: 'Open Food Facts',
      ma_nguon: 'OFF-3017620422003',
      de_xuat_boi: nutritionist.id,
      trang_thai: 'da_duyet' as const,
      du_lieu_hien_tai: null,
      du_lieu_de_xuat: {
        ten: 'Sữa chua Hy Lạp',
        nhom_thuc_pham_id: 2,
        calories_100g: 97,
        protein_100g: 9,
        carb_100g: 3.6,
        fat_100g: 5,
      },
      ly_do: 'Thực phẩm giàu protein, phổ biến trong chế độ ăn kiêng.',
      duyet_boi: admin?.id ?? null,
      duyet_luc: now,
      ghi_chu_duyet: 'Dữ liệu chính xác, đã xác minh.',
      tao_luc: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      cap_nhat_luc: now,
    },
  ]);
}

async function seedNotifications() {
  const notificationRepository = AppDataSource.getRepository(ThongBaoEntity);
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const now = new Date();

  const existing = await notificationRepository.count();
  if (existing > 0) return;

  const admin = await userRepository.findOne({
    where: { email: 'admin@nutriwise.vn' },
  });
  const nutritionist = await userRepository.findOne({
    where: { email: 'nutritionist@nutriwise.vn' },
  });

  const notifications: Array<{
    tai_khoan_id: number;
    loai: string;
    tieu_de: string;
    noi_dung: string;
    trang_thai: 'chua_doc' | 'da_doc';
    duong_dan_hanh_dong: string | null;
  }> = [];

  if (admin) {
    notifications.push(
      {
        tai_khoan_id: admin.id,
        loai: 'de_xuat_moi',
        tieu_de: 'Đề xuất dữ liệu mới',
        noi_dung: 'Chuyên gia dinh dưỡng đã gửi 2 đề xuất dữ liệu thực phẩm mới chờ duyệt.',
        trang_thai: 'chua_doc',
        duong_dan_hanh_dong: '/admin/food-review-requests',
      },
      {
        tai_khoan_id: admin.id,
        loai: 'he_thong',
        tieu_de: 'Chào mừng Admin',
        noi_dung: 'Hệ thống NutriWise đã sẵn sàng hoạt động. Bắt đầu quản lý dữ liệu và gói dịch vụ.',
        trang_thai: 'da_doc',
        duong_dan_hanh_dong: '/admin/dashboard',
      },
    );
  }

  if (nutritionist) {
    notifications.push({
      tai_khoan_id: nutritionist.id,
      loai: 'duyet_de_xuat',
      tieu_de: 'Đề xuất đã được duyệt',
      noi_dung: 'Đề xuất "Sữa chua Hy Lạp" đã được admin duyệt và thêm vào catalog.',
      trang_thai: 'chua_doc',
      duong_dan_hanh_dong: '/nutritionist/food-review-requests',
    });
  }

  if (notifications.length > 0) {
    await notificationRepository.save(
      notifications.map((n) => ({
        ...n,
        tao_luc: now,
        doc_luc: n.trang_thai === 'da_doc' ? now : null,
        cap_nhat_luc: now,
      })),
    );
  }
}

async function seedPackages() {
  const packageRepository = AppDataSource.getRepository(GoiDichVuEntity);
  const now = new Date();

  await packageRepository.upsert(
    [
      {
        ten_goi: 'Gói Miễn Phí',
        slug: 'goi-mien-phi',
        mo_ta: 'Trải nghiệm các tính năng cơ bản: theo dõi bữa ăn, xem catalog thực phẩm và nhận đánh giá sức khỏe đơn giản.',
        gia_niem_yet: '0',
        gia_khuyen_mai: null,
        thoi_han_ngay: null,
        loai_chu_ky: 'tron_doi' as const,
        trang_thai: 'dang_kinh_doanh' as const,
        la_goi_mien_phi: true,
        goi_noi_bat: false,
        thu_tu_hien_thi: 1,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
      {
        ten_goi: 'Gói Premium',
        slug: 'goi-premium',
        mo_ta: 'Mở khóa toàn bộ tính năng AI: tư vấn dinh dưỡng cá nhân, lập kế hoạch ăn thông minh, đánh giá sức khỏe nâng cao và trò chuyện với AI advisor.',
        gia_niem_yet: '199000',
        gia_khuyen_mai: '149000',
        thoi_han_ngay: 30,
        loai_chu_ky: 'thang' as const,
        trang_thai: 'dang_kinh_doanh' as const,
        la_goi_mien_phi: false,
        goi_noi_bat: true,
        thu_tu_hien_thi: 2,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
      {
        ten_goi: 'Gói Premium Năm',
        slug: 'goi-premium-nam',
        mo_ta: 'Tất cả quyền lợi của Premium, thanh toán 1 lần/năm với mức giá tiết kiệm hơn 30%.',
        gia_niem_yet: '1990000',
        gia_khuyen_mai: '1390000',
        thoi_han_ngay: 365,
        loai_chu_ky: 'nam' as const,
        trang_thai: 'dang_kinh_doanh' as const,
        la_goi_mien_phi: false,
        goi_noi_bat: false,
        thu_tu_hien_thi: 3,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
      {
        ten_goi: 'Gói Doanh Nghiệp',
        slug: 'goi-doanh-nghiep',
        mo_ta: 'Dành cho gym, phòng khám và tổ chức: quản lý nhiều user, báo cáo nâng cao, ưu tiên hỗ trợ.',
        gia_niem_yet: '5000000',
        gia_khuyen_mai: null,
        thoi_han_ngay: 30,
        loai_chu_ky: 'thang' as const,
        trang_thai: 'ban_nhap' as const,
        la_goi_mien_phi: false,
        goi_noi_bat: false,
        thu_tu_hien_thi: 4,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      },
    ],
    ['slug'],
  );
}

async function seedPackageFeatures() {
  const featureRepository = AppDataSource.getRepository(ChucNangGoiDichVuEntity);
  const packageRepository = AppDataSource.getRepository(GoiDichVuEntity);
  const now = new Date();

  const existing = await featureRepository.count();
  if (existing > 0) return;

  const freePackage = await packageRepository.findOne({ where: { slug: 'goi-mien-phi' } });
  const premiumPackage = await packageRepository.findOne({ where: { slug: 'goi-premium' } });

  const features = [
    { code: 'ai_chat', name: 'Chat với AI' },
    { code: 'ai_nutrition_recommendation', name: 'Khuyến nghị dinh dưỡng' },
    { code: 'ai_meal_recommendation', name: 'Khuyến nghị thực đơn' },
    { code: 'ai_health_management', name: 'Quản lý sức khỏe AI' },
    { code: 'ai_health_assessment', name: 'Đánh giá sức khỏe AI' },
    { code: 'meal_plan_create', name: 'Tạo kế hoạch ăn' },
    { code: 'nutrition_history_monthly', name: 'Xem lịch sử dinh dưỡng tháng' },
  ];

  const records: Partial<ChucNangGoiDichVuEntity>[] = [];

  if (freePackage) {
    for (const f of features) {
      const isFreeAllowed = ['ai_chat', 'ai_health_assessment'].includes(f.code);
      records.push({
        goi_dich_vu_id: freePackage.id,
        ma_chuc_nang: f.code,
        ten_chuc_nang: f.name,
        mo_ta: null,
        duoc_phep_su_dung: isFreeAllowed,
        gioi_han_so_lan: isFreeAllowed ? (f.code === 'ai_chat' ? 5 : 2) : null,
        gioi_han_theo: isFreeAllowed ? ('ngay' as const) : ('khong_gioi_han' as const),
        tao_luc: now,
        cap_nhat_luc: now,
      });
    }
  }

  if (premiumPackage) {
    for (const f of features) {
      records.push({
        goi_dich_vu_id: premiumPackage.id,
        ma_chuc_nang: f.code,
        ten_chuc_nang: f.name,
        mo_ta: null,
        duoc_phep_su_dung: true,
        gioi_han_so_lan: null,
        gioi_han_theo: 'khong_gioi_han' as const,
        tao_luc: now,
        cap_nhat_luc: now,
      });
    }
  }

  if (records.length > 0) {
    await featureRepository.save(records);
  }
}

async function seedSubscriptions() {
  const subscriptionRepository = AppDataSource.getRepository(DangKyGoiDichVuEntity);
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const packageRepository = AppDataSource.getRepository(GoiDichVuEntity);
  const now = new Date();

  const existing = await subscriptionRepository.count();
  if (existing > 0) return;

  const user = await userRepository.findOne({ where: { email: 'user@nutriwise.vn' } });
  const nutritionist = await userRepository.findOne({ where: { email: 'nutritionist@nutriwise.vn' } });
  const freePackage = await packageRepository.findOne({ where: { slug: 'goi-mien-phi' } });
  const premiumPackage = await packageRepository.findOne({ where: { slug: 'goi-premium' } });

  const records: Partial<DangKyGoiDichVuEntity>[] = [];

  if (user && freePackage) {
    records.push({
      tai_khoan_id: user.id,
      goi_dich_vu_id: freePackage.id,
      ma_dang_ky: 'SUB-FREE-USER-001',
      trang_thai: 'dang_hoat_dong',
      ngay_bat_dau: now,
      ngay_het_han: null,
      tu_dong_gia_han: false,
      nguon_dang_ky: 'nguoi_dung_tu_nang_cap',
      ghi_chu: 'Gói mặc định khi đăng ký tài khoản.',
      tao_luc: now,
      cap_nhat_luc: now,
    });
  }

  if (nutritionist && premiumPackage) {
    const start = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    records.push({
      tai_khoan_id: nutritionist.id,
      goi_dich_vu_id: premiumPackage.id,
      ma_dang_ky: 'SUB-PREM-NUTR-001',
      trang_thai: 'dang_hoat_dong',
      ngay_bat_dau: start,
      ngay_het_han: end,
      tu_dong_gia_han: true,
      nguon_dang_ky: 'quan_tri_cap',
      ghi_chu: 'Admin cấp Premium cho chuyên gia dinh dưỡng.',
      tao_luc: start,
      cap_nhat_luc: now,
    });
  }

  if (records.length > 0) {
    await subscriptionRepository.save(records);
  }
}

// ========== NUTRITIONIST DATA SEEDERS ==========

async function seedArticles() {
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const nutri = await userRepository.findOne({ where: { email: 'nutritionist@nutriwise.vn' } });
  if (!nutri) { console.log('Nutritionist user not found, skipping articles seed'); return; }

  const articleRepo = AppDataSource.getRepository(BaiVietEntity);
  const existing = await articleRepo.count({ where: { tac_gia_id: nutri.id } });
  if (existing > 0) { console.log(`Articles already seeded (${existing} found)`); return; }

  const now = new Date();
  const articles = [
    { tieu_de: 'Dinh dưỡng cho người tập gym', slug: 'dinh-duong-cho-nguoi-tap-gym', danh_muc: 'dinh_duong', tom_tat: 'Hướng dẫn chế độ ăn phù hợp cho người tập gym.', noi_dung: 'Protein là dưỡng chất quan trọng nhất cho việc phát triển cơ bắp. Bạn nên tiêu thụ 1.6-2.2g protein/kg cân nặng mỗi ngày. Ngoài ra, carbohydrate cung cấp năng lượng cho buổi tập, và chất béo cần thiết cho hormone...', trang_thai: 'xuat_ban' as const, huong_dan_ai: { context: 'gym_nutrition', rules: ['Ưu tiên protein từ thịt nạc, trứng, whey', 'Carb phức hợp trước tập 2h', 'Bổ sung BCAA nếu cần'] } },
    { tieu_de: 'Chế độ ăn cho người tiểu đường type 2', slug: 'che-do-an-tieu-duong-type-2', danh_muc: 'suc_khoe', tom_tat: 'Hướng dẫn kiểm soát đường huyết qua chế độ ăn.', noi_dung: 'Người tiểu đường type 2 cần kiểm soát lượng carbohydrate, ưu tiên thực phẩm có chỉ số đường huyết thấp (GI < 55). Rau xanh, ngũ cốc nguyên hạt, và protein nạc là nền tảng. Hạn chế đường tinh luyện, nước ngọt...', trang_thai: 'xuat_ban' as const, huong_dan_ai: { context: 'diabetes_diet', rules: ['GI thấp < 55', 'Chia nhỏ bữa ăn 5-6 lần/ngày', 'Hạn chế tinh bột trắng'] } },
    { tieu_de: 'Thực phẩm giàu omega-3 cho não bộ', slug: 'thuc-pham-giau-omega-3', danh_muc: 'dinh_duong', tom_tat: 'Omega-3 và vai trò với sức khỏe não bộ.', noi_dung: 'Omega-3 (DHA, EPA) đóng vai trò quan trọng trong phát triển và bảo vệ não bộ. Các nguồn thực phẩm giàu omega-3 gồm cá hồi, cá thu, hạt chia, hạt lanh, quả óc chó...', trang_thai: 'ban_nhap' as const, huong_dan_ai: null },
    { tieu_de: 'Detox cơ thể an toàn', slug: 'detox-co-the-an-toan', danh_muc: 'suc_khoe', tom_tat: 'Phương pháp detox khoa học và hiệu quả.', noi_dung: 'Detox không cần nhịn ăn cực đoan. Uống đủ nước (2-3L/ngày), ăn nhiều rau xanh, hạn chế thực phẩm chế biến sẵn, ngủ đủ 7-8h là những cách detox tự nhiên và an toàn nhất...', trang_thai: 'xuat_ban' as const, huong_dan_ai: { context: 'detox', rules: ['Không khuyến khích nhịn ăn', 'Ưu tiên rau xanh lá đậm', 'Uống đủ nước'] } },
    { tieu_de: 'Vitamin D và sức khỏe xương', slug: 'vitamin-d-suc-khoe-xuong', danh_muc: 'dinh_duong', tom_tat: 'Vitamin D giúp hấp thụ canxi và bảo vệ xương.', noi_dung: 'Vitamin D giúp cơ thể hấp thụ canxi hiệu quả. Thiếu vitamin D dẫn đến loãng xương ở người lớn tuổi. Nguồn vitamin D: ánh nắng mặt trời, cá béo, trứng, nấm...', trang_thai: 'ban_nhap' as const, huong_dan_ai: null },
  ];

  for (const a of articles) {
    await articleRepo.save(articleRepo.create({
      tac_gia_id: nutri.id, tieu_de: a.tieu_de, slug: a.slug,
      danh_muc: a.danh_muc, tom_tat: a.tom_tat, noi_dung: a.noi_dung,
      the_gan: [a.danh_muc], anh_dai_dien_url: null,
      huong_dan_ai: a.huong_dan_ai, trang_thai: a.trang_thai,
      xuat_ban_luc: a.trang_thai === 'xuat_ban' ? now : null,
      tao_luc: now, cap_nhat_luc: now,
    }));
  }
  console.log(`Seeded ${articles.length} articles`);
}

async function seedRecipes() {
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const nutri = await userRepository.findOne({ where: { email: 'nutritionist@nutriwise.vn' } });
  if (!nutri) return;

  const recipeRepo = AppDataSource.getRepository(CongThucEntity);
  const ingredientRepo = AppDataSource.getRepository(ThanhPhanCongThucEntity);
  const existing = await recipeRepo.count({ where: { tao_boi: nutri.id } });
  if (existing > 0) { console.log(`Recipes already seeded (${existing} found)`); return; }

  const foodRepo = AppDataSource.getRepository(ThucPhamEntity);
  const foods = await foodRepo.find({ take: 10, order: { id: 'ASC' } });
  const now = new Date();

  const recipes = [
    { ten: 'Salad ức gà quinoa', slug: 'salad-uc-ga-quinoa', mo_ta: 'Salad giàu protein với ức gà áp chảo và quinoa.', huong_dan: '1. Luộc quinoa 15 phút, để nguội.\n2. Áp chảo ức gà gia vị 5 phút mỗi mặt.\n3. Trộn rau xanh, cà chua, dưa leo.\n4. Rưới dressing dầu olive + chanh.', so_khau_phan: 2, tong_calories: 450, tong_protein_g: 38, tong_carb_g: 35, tong_fat_g: 18, trang_thai: 'xuat_ban' as const },
    { ten: 'Smoothie protein chuối bơ', slug: 'smoothie-protein-chuoi-bo', mo_ta: 'Smoothie bổ sung protein sau tập.', huong_dan: '1. Cho 1 quả chuối, 1/2 quả bơ, 200ml sữa hạnh nhân vào máy xay.\n2. Thêm 1 scoop whey protein.\n3. Xay nhuyễn 30 giây, thêm đá nếu thích.', so_khau_phan: 1, tong_calories: 380, tong_protein_g: 28, tong_carb_g: 40, tong_fat_g: 14, trang_thai: 'xuat_ban' as const },
    { ten: 'Cá hồi nướng rau củ', slug: 'ca-hoi-nuong-rau-cu', mo_ta: 'Bữa tối healthy với cá hồi omega-3.', huong_dan: '1. Ướp cá hồi với muối, tiêu, chanh 15 phút.\n2. Cắt bông cải, cà rốt, khoai lang.\n3. Nướng ở 200°C trong 20 phút.\n4. Ăn kèm gạo lứt.', so_khau_phan: 2, tong_calories: 520, tong_protein_g: 42, tong_carb_g: 30, tong_fat_g: 26, trang_thai: 'xuat_ban' as const },
    { ten: 'Bowl yến mạch trái cây', slug: 'bowl-yen-mach-trai-cay', mo_ta: 'Bữa sáng năng lượng với yến mạch overnight.', huong_dan: '1. Ngâm yến mạch với sữa qua đêm.\n2. Thêm mật ong, hạt chia.\n3. Top trái cây tươi: dâu, việt quất, chuối.', so_khau_phan: 1, tong_calories: 320, tong_protein_g: 12, tong_carb_g: 52, tong_fat_g: 8, trang_thai: 'ban_nhap' as const },
  ];

  for (const r of recipes) {
    const saved = await recipeRepo.save(recipeRepo.create({
      tao_boi: nutri.id, ten: r.ten, slug: r.slug, mo_ta: r.mo_ta,
      huong_dan: r.huong_dan, so_khau_phan: r.so_khau_phan,
      tong_calories: r.tong_calories, tong_protein_g: r.tong_protein_g,
      tong_carb_g: r.tong_carb_g, tong_fat_g: r.tong_fat_g,
      trang_thai: r.trang_thai, tao_luc: now, cap_nhat_luc: now,
    }));

    // Add 2-3 ingredients from existing foods
    const ingredientFoods = foods.slice(0, Math.min(3, foods.length));
    for (let i = 0; i < ingredientFoods.length; i++) {
      await ingredientRepo.save(ingredientRepo.create({
        cong_thuc_id: saved.id, thuc_pham_id: ingredientFoods[i].id,
        so_luong: (i + 1) * 100, don_vi: 'g', tao_luc: now, cap_nhat_luc: now,
      } as any));
    }
  }
  console.log(`Seeded ${recipes.length} recipes`);
}

async function seedMealTemplates() {
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const nutri = await userRepository.findOne({ where: { email: 'nutritionist@nutriwise.vn' } });
  if (!nutri) return;

  const templateRepo = AppDataSource.getRepository(ThucDonMauEntity);
  const detailRepo = AppDataSource.getRepository(ChiTietThucDonMauEntity);
  const existing = await templateRepo.count({ where: { tao_boi: nutri.id } });
  if (existing > 0) { console.log(`Meal templates already seeded (${existing} found)`); return; }

  const recipeRepo = AppDataSource.getRepository(CongThucEntity);
  const recipes = await recipeRepo.find({ where: { tao_boi: nutri.id }, take: 4 });
  const foodRepo = AppDataSource.getRepository(ThucPhamEntity);
  const foods = await foodRepo.find({ take: 5, order: { id: 'ASC' } });
  const now = new Date();

  const templates = [
    { tieu_de: 'Thực đơn giảm cân 7 ngày', mo_ta: 'Thực đơn 1500 kcal/ngày cho mục tiêu giảm cân bền vững.', loai: 'giam_can', cal: 1500, trang_thai: 'xuat_ban' as const },
    { tieu_de: 'Thực đơn tăng cơ', mo_ta: 'Thực đơn 2500 kcal/ngày cho người tập gym muốn tăng cơ.', loai: 'tang_can', cal: 2500, trang_thai: 'xuat_ban' as const },
    { tieu_de: 'Thực đơn healthy cân bằng', mo_ta: 'Thực đơn 2000 kcal/ngày cho sức khỏe tổng thể.', loai: 'giu_can', cal: 2000, trang_thai: 'ban_nhap' as const },
  ];

  const buaAn: ('bua_sang' | 'bua_trua' | 'bua_toi' | 'bua_phu')[] = ['bua_sang', 'bua_trua', 'bua_toi', 'bua_phu'];

  for (const t of templates) {
    const saved = await templateRepo.save(templateRepo.create({
      tao_boi: nutri.id, tieu_de: t.tieu_de, mo_ta: t.mo_ta,
      loai_muc_tieu_phu_hop: t.loai, calories_muc_tieu: t.cal,
      trang_thai: t.trang_thai, tao_luc: now, cap_nhat_luc: now,
    } as any)) as unknown as ThucDonMauEntity;

    // Add meal details for 2 days
    for (let day = 1; day <= 2; day++) {
      for (let b = 0; b < buaAn.length; b++) {
        const recipe = recipes[b % recipes.length];
        const food = foods[b % foods.length];
        await detailRepo.save(detailRepo.create({
          thuc_don_mau_id: saved.id, ngay_so: day, loai_bua_an: buaAn[b],
          cong_thuc_id: recipe?.id ?? null, thuc_pham_id: food?.id ?? null,
          so_luong: 1, don_vi: 'phan', ghi_chu: null, thu_tu: b + 1,
          tao_luc: now, cap_nhat_luc: now,
        } as any));
      }
    }
  }
  console.log(`Seeded ${templates.length} meal templates`);
}

// ========== NUTRITIONIST & BOOKING SEEDERS (for Admin A14–A16) ==========

async function seedNutritionistProfiles() {
  const userRepo = AppDataSource.getRepository(TaiKhoanEntity);
  const cgRepo = AppDataSource.getRepository(ChuyenGiaDinhDuongEntity);
  const profileRepository = AppDataSource.getRepository(HoSoEntity);
  const now = new Date();

  const nutri = await userRepo.findOne({ where: { email: 'nutritionist@nutriwise.vn' } });
  if (!nutri) { console.log('Nutritionist user not found, skipping nutritionist profiles'); return; }

  // Seed 1 Nutritionist hoat_dong (A15 test), 1 Nutritionist cho_duyet (A14 test)
  const activeProfile = await cgRepo.findOne({ where: { tai_khoan_id: nutri.id } });
  await cgRepo.save(cgRepo.create({
    id: activeProfile?.id,
    tai_khoan_id: nutri.id,
    chuyen_mon: 'Dinh dưỡng lâm sàng, Giảm cân, Dinh dưỡng thể thao',
    mo_ta: 'Chuyên gia dinh dưỡng với 5 năm kinh nghiệm tư vấn cho người Việt. Tốt nghiệp Đại học Y Hà Nội, chứng chỉ Dinh dưỡng lâm sàng quốc tế.',
    kinh_nghiem: '5 năm kinh nghiệm tư vấn dinh dưỡng cho người trưởng thành và trẻ em',
    hoc_vi: 'Thạc sĩ Dinh dưỡng',
    chung_chi: 'Chứng chỉ Dinh dưỡng lâm sàng quốc tế, Chứng chỉ tư vấn giảm cân',
    gio_lam_viec: 'T2-T6: 8:00-17:00, T7: 8:00-12:00',
    trang_thai: 'hoat_dong' as const,
    trang_thai_thanh_toan: 'thanh_cong' as const,
    ngay_thanh_toan: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    lan_thanh_toan: 1,
    diem_danh_gia_trung_binh: '4.7',
    so_luot_danh_gia: 23,
    ngay_duyet: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    tao_luc: activeProfile?.tao_luc ?? now,
    cap_nhat_luc: now,
  }));
  console.log('Seeded/updated 1 active nutritionist profile');

  // Seed thêm 1 user đang chờ duyệt (A14 test)
  // Tạo user test mới thay vì thay đổi user@nutriwise.vn
  let pendingUser = await userRepo.findOne({ where: { email: 'pending_nutri@nutriwise.vn' } });
  if (!pendingUser) {
    const passwordHash = await hashPassword(getSeedDefaultPassword());
    pendingUser = userRepo.create({
      email: 'pending_nutri@nutriwise.vn',
      ho_ten: 'Ung Vien Cho Duyet',
      vai_tro: 'chuyen_gia_dinh_duong',
      trang_thai: 'khong_hoat_dong',
      mat_khau_ma_hoa: passwordHash,
      ma_dat_lai_mat_khau: null,
      het_han_ma_dat_lai: null,
      dang_nhap_cuoi_luc: null,
      tao_luc: now,
      cap_nhat_luc: now,
      xoa_luc: null,
    });
    pendingUser = await userRepo.save(pendingUser);
    // Tạo ho_so cho user mới
    await profileRepository.upsert(
      {
        tai_khoan_id: pendingUser.id,
        gioi_tinh: null,
        ngay_sinh: null,
        chieu_cao_cm: null,
        can_nang_hien_tai_kg: null,
        muc_do_van_dong: null,
        che_do_an_uu_tien: null,
        di_ung: null,
        thuc_pham_khong_thich: null,
        anh_dai_dien_url: null,
        tao_luc: now,
        cap_nhat_luc: now,
      },
      ['tai_khoan_id'],
    );
  }

  await userRepo.save(userRepo.create({
    ...pendingUser,
    vai_tro: 'chuyen_gia_dinh_duong',
    trang_thai: 'khong_hoat_dong',
    cap_nhat_luc: now,
  }));

  await profileRepository.upsert(
    {
      tai_khoan_id: pendingUser.id,
      gioi_tinh: null,
      ngay_sinh: null,
      chieu_cao_cm: null,
      can_nang_hien_tai_kg: null,
      muc_do_van_dong: null,
      che_do_an_uu_tien: null,
      di_ung: null,
      thuc_pham_khong_thich: null,
      anh_dai_dien_url: null,
      tao_luc: now,
      cap_nhat_luc: now,
    },
    ['tai_khoan_id'],
  );

  const pendingProfile = await cgRepo.findOne({ where: { tai_khoan_id: pendingUser.id } });
  await cgRepo.save(cgRepo.create({
    id: pendingProfile?.id,
    tai_khoan_id: pendingUser.id,
    chuyen_mon: 'Dinh dưỡng cho bệnh nhân tiểu đường',
    mo_ta: 'Chuyên gia dinh dưỡng cho bệnh nhân tiểu đường type 2 và tim mạch.',
    kinh_nghiem: '3 năm kinh nghiệm tại bệnh viện',
    hoc_vi: 'Bác sĩ chuyên khoa 1',
    chung_chi: 'Chứng chỉ dinh dưỡng bệnh lý',
    trang_thai: 'cho_duyet' as const,
    trang_thai_thanh_toan: 'thanh_cong' as const,
    ngay_thanh_toan: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lan_thanh_toan: 1,
    tao_luc: pendingProfile?.tao_luc ?? now,
    cap_nhat_luc: now,
  }));
  console.log('Seeded/updated 1 pending nutritionist (pending_nutri@nutriwise.vn) for A14 test');
}

async function seedGoiTuVan() {
  const cgRepo = AppDataSource.getRepository(ChuyenGiaDinhDuongEntity);
  const gtvRepo = AppDataSource.getRepository(GoiTuVanEntity);
  const now = new Date();

  const existing = await gtvRepo.count();
  if (existing > 0) { console.log(`Goi tu van already seeded (${existing} found)`); return; }

  const activeNutri = await cgRepo.findOne({ where: { trang_thai: 'hoat_dong' as any } });
  if (!activeNutri) { console.log('No active nutritionist, skipping goi tu van'); return; }

  await gtvRepo.save([
    {
      chuyen_gia_dinh_duong_id: activeNutri.id,
      ten: 'Tư vấn dinh dưỡng 30 phút',
      mo_ta: 'Buổi tư vấn 1-1 trong 30 phút, phù hợp cho người mới bắt đầu hoặc có câu hỏi cụ thể về dinh dưỡng.',
      gia: '150000',
      thoi_luong_phut: 30,
      so_lan_dung_mien_phi: 0,
      trang_thai: 'dang_ban' as const,
      tao_luc: now, cap_nhat_luc: now,
    },
    {
      chuyen_gia_dinh_duong_id: activeNutri.id,
      ten: 'Tư vấn dinh dưỡng 60 phút',
      mo_ta: 'Buổi tư vấn chuyên sâu 60 phút, bao gồm phân tích chế độ ăn hiện tại và lập kế hoạch dinh dưỡng cá nhân hóa.',
      gia: '250000',
      thoi_luong_phut: 60,
      so_lan_dung_mien_phi: 1,
      trang_thai: 'dang_ban' as const,
      tao_luc: now, cap_nhat_luc: now,
    },
    {
      chuyen_gia_dinh_duong_id: activeNutri.id,
      ten: 'Gói tư vấn 5 buổi',
      mo_ta: 'Gói 5 buổi tư vấn trong 1 tháng, theo dõi và điều chỉnh chế độ ăn liên tục.',
      gia: '1000000',
      thoi_luong_phut: 60,
      so_lan_dung_mien_phi: 2,
      trang_thai: 'dang_ban' as const,
      tao_luc: now, cap_nhat_luc: now,
    },
  ]);
  console.log('Seeded 3 goi tu van');
}

async function seedLichHenAndThanhToan() {
  const cgRepo = AppDataSource.getRepository(ChuyenGiaDinhDuongEntity);
  const gtvRepo = AppDataSource.getRepository(GoiTuVanEntity);
  const lhRepo = AppDataSource.getRepository(LichHenEntity);
  const ttRepo = AppDataSource.getRepository(ThanhToanTuVanEntity);
  const userRepo = AppDataSource.getRepository(TaiKhoanEntity);
  const now = new Date();

  const existing = await lhRepo.count();
  if (existing > 0) { console.log(`Lich hen already seeded (${existing} found)`); return; }

  const activeNutri = await cgRepo.findOne({ where: { trang_thai: 'hoat_dong' as any } });
  const user = await userRepo.findOne({ where: { email: 'user@nutriwise.vn' } });
  const gtvList = await gtvRepo.find({ where: { trang_thai: 'dang_ban' as any } });

  if (!activeNutri || !user || gtvList.length === 0) {
    console.log('Missing data for lich hen seed, skipping');
    return;
  }

  const generateMa = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Seed 4 lich hen với đủ trạng thái để test A16
  const lichHenData = [
    {
      gtvIdx: 0,
      trang_thai: 'hoan_thanh' as const,
      ngay: -10,
      soTien: '150000',
      thanhToanTrangThai: 'thanh_cong' as const,
      thanhToanLuc: -10,
    },
    {
      gtvIdx: 1,
      trang_thai: 'hoan_thanh' as const,
      ngay: -7,
      soTien: '250000',
      thanhToanTrangThai: 'thanh_cong' as const,
      thanhToanLuc: -7,
    },
    {
      gtvIdx: 0,
      trang_thai: 'da_xac_nhan' as const,
      ngay: 2,
      soTien: '150000',
      thanhToanTrangThai: 'thanh_cong' as const,
      thanhToanLuc: 2,
    },
    {
      gtvIdx: 1,
      trang_thai: 'cho_thanh_toan' as const,
      ngay: 5,
      soTien: '250000',
      thanhToanTrangThai: 'cho_thanh_toan' as const,
      thanhToanLuc: null,
    },
  ];

  for (const lh of lichHenData) {
    const gtv = gtvList[lh.gtvIdx];
    const ngayHen = new Date(Date.now() + lh.ngay * 24 * 60 * 60 * 1000);
    const thTienLuc = lh.thanhToanLuc !== null ? new Date(Date.now() + lh.thanhToanLuc * 24 * 60 * 60 * 1000) : null;

    const savedLh = await lhRepo.save(lhRepo.create({
      chuyen_gia_dinh_duong_id: activeNutri.id,
      tai_khoan_id: user.id,
      goi_tu_van_id: gtv.id,
      ma_lich_hen: generateMa('LH'),
      muc_dich: 'Tư vấn dinh dưỡng cá nhân hóa cho mục tiêu giảm cân',
      ngay_hen: ngayHen.toISOString().split('T')[0],
      gio_bat_dau: lh.ngay < 0 ? '14:00:00' : '10:00:00',
      gio_ket_thuc: lh.ngay < 0 ? '14:30:00' : '11:00:00',
      dia_diem: 'Online qua Zoom',
      trang_thai: lh.trang_thai,
      tao_luc: now, cap_nhat_luc: now,
    }));

    await ttRepo.save(ttRepo.create({
      lich_hen_id: savedLh.id,
      tai_khoan_id: user.id,
      ma_giao_dich: generateMa('TT'),
      phuong_thuc: 'vnpay',
      so_tien: lh.soTien,
      trang_thai: lh.thanhToanTrangThai,
      thanh_toan_luc: thTienLuc ?? now,
      tao_luc: now, cap_nhat_luc: now,
    }));
  }
  console.log(`Seeded ${lichHenData.length} lich hen with thanh toan`);
}

// ========== DANH GIA SEEDER ==========

async function seedDanhGia() {
  const cgRepo = AppDataSource.getRepository(ChuyenGiaDinhDuongEntity);
  const lhRepo = AppDataSource.getRepository(LichHenEntity);
  const dgRepo = AppDataSource.getRepository(DanhGiaEntity);
  const now = new Date();

  const existing = await dgRepo.count();
  if (existing > 0) { console.log(`Danh gia already seeded (${existing} found)`); return; }

  const activeNutri = await cgRepo.findOne({ where: { trang_thai: 'hoat_dong' as any } });
  if (!activeNutri) { console.log('No active nutritionist, skipping danh gia'); return; }

  const completedBookings = await lhRepo.find({
    where: {
      chuyen_gia_dinh_duong_id: activeNutri.id,
      trang_thai: 'hoan_thanh' as any,
    },
    take: 5,
  });

  if (completedBookings.length === 0) {
    console.log('No completed bookings for danh gia seed, skipping');
    return;
  }

  const danhGiaData = [
    {
      diem: 5,
      noi_dung: 'Chuyên gia tư vấn rất nhiệt tình, đưa ra lời khuyên cụ thể và phù hợp với tình trạng sức khỏe của tôi. Đã giảm được 2kg sau 2 tuần.',
      tai_khoan_id: completedBookings[0].tai_khoan_id,
      lich_hen_id: completedBookings[0].id,
      ngay_tao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      diem: 4,
      noi_dung: 'Buổi tư vấn khá tốt, chuyên gia có kiến thức chuyên sâu. Tuy nhiên thời gian hơi ngắn.',
      tai_khoan_id: completedBookings.length > 1 ? completedBookings[1].tai_khoan_id : completedBookings[0].tai_khoan_id,
      lich_hen_id: completedBookings.length > 1 ? completedBookings[1].id : completedBookings[0].id,
      ngay_tao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      diem: 5,
      noi_dung: 'Rất hài lòng! Chế độ ăn được cá nhân hóa, dễ thực hiện và hiệu quả.',
      tai_khoan_id: completedBookings.length > 2 ? completedBookings[2].tai_khoan_id : completedBookings[0].tai_khoan_id,
      lich_hen_id: completedBookings.length > 2 ? completedBookings[2].id : completedBookings[0].id,
      ngay_tao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const dg of danhGiaData) {
    await dgRepo.save(dgRepo.create({
      lich_hen_id: dg.lich_hen_id,
      tai_khoan_id: dg.tai_khoan_id,
      chuyen_gia_dinh_duong_id: activeNutri.id,
      diem: dg.diem,
      noi_dung: dg.noi_dung,
      tra_loi: null,
      tra_loi_luc: null,
      tao_luc: dg.ngay_tao,
      cap_nhat_luc: dg.ngay_tao,
    }));
  }
  console.log(`Seeded ${danhGiaData.length} danh gia`);
}

async function run() {
  await AppDataSource.initialize();

  try {
    await seedUsers();
    await seedFoodCatalog();
    await seedFoodReviewRequests();
    await seedNotifications();
    await seedPackages();
    await seedPackageFeatures();
    await seedSubscriptions();
    await seedArticles();
    await seedRecipes();
    await seedMealTemplates();
    await seedNutritionistProfiles();
    await seedGoiTuVan();
    await seedLichHenAndThanhToan();
    await seedDanhGia();
    console.log('Seed du lieu thanh cong');
  } finally {
    await AppDataSource.destroy();
  }
}

void run().catch((error: unknown) => {
  console.error('Seed du lieu that bai');
  console.error(error);
  process.exit(1);
});
