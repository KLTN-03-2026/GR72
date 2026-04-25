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
import { MucTieuEntity } from '../../Api/Admin/User/entities/muc-tieu.entity';
import { TaiKhoanEntity } from '../../Api/Admin/User/entities/tai-khoan.entity';
import { BaiVietEntity } from '../../Api/Nutritionist/Article/entities/bai-viet.entity';
import { CongThucEntity } from '../../Api/Nutritionist/Recipe/entities/cong-thuc.entity';
import { ThanhPhanCongThucEntity } from '../../Api/Nutritionist/Recipe/entities/cong-thuc.entity';
import {
  ThucDonMauEntity,
  ChiTietThucDonMauEntity,
} from '../../Api/Nutritionist/MealTemplate/entities/thuc-don-mau.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Api/Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { GoiTuVanEntity } from '../../Api/Admin/ChuyenGiaDinhDuong/entities/goi-tu-van.entity';
import { LichHenEntity } from '../../Api/Admin/Booking/entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from '../../Api/Admin/Booking/entities/thanh-toan-tu-van.entity';
import { DanhGiaEntity } from '../../Api/Admin/Booking/entities/danh-gia.entity';
import { PhanBoDoanhThuBookingEntity } from '../../Api/Admin/Booking/entities/phan-bo-doanh-thu-booking.entity';
import { In, IsNull } from 'typeorm';
import { ChiSoSucKhoeEntity } from '../../Api/User/HealthAssessment/entities/chi-so-suc-khoe.entity';
import { DanhGiaSucKhoeEntity } from '../../Api/User/HealthAssessment/entities/danh-gia-suc-khoe.entity';
import {
  KeHoachAnEntity,
  ChiTietKeHoachAnEntity,
} from '../../Api/User/MealPlan/entities/ke-hoach-an.entity';
import {
  NhatKyBuaAnEntity,
  ChiTietNhatKyBuaAnEntity,
  TongHopDinhDuongNgayEntity,
} from '../../Api/User/MealLog/entities/nhat-ky-bua-an.entity';
import {
  PhienTuVanAiEntity,
  KhuyenNghiAiEntity,
} from '../../Api/User/Recommendation/entities/khuyen-nghi-ai.entity';

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

async function seedUserHealthData() {
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const profileRepository = AppDataSource.getRepository(HoSoEntity);
  const goalRepository = AppDataSource.getRepository(MucTieuEntity);
  const metricRepository = AppDataSource.getRepository(ChiSoSucKhoeEntity);
  const assessmentRepository =
    AppDataSource.getRepository(DanhGiaSucKhoeEntity);

  const user = await userRepository.findOne({
    where: { email: 'user@nutriwise.vn' },
  });

  if (!user) {
    console.log('User demo not found, skipping user health seed');
    return;
  }

  const now = new Date();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  await profileRepository.upsert(
    {
      tai_khoan_id: user.id,
      gioi_tinh: 'nam',
      ngay_sinh: '2002-10-12',
      chieu_cao_cm: '175.00',
      can_nang_hien_tai_kg: '78.00',
      muc_do_van_dong: 'van_dong_vua',
      che_do_an_uu_tien: ['high_protein', 'it_duong'],
      di_ung: ['hai_san_vo_cung'],
      thuc_pham_khong_thich: ['noi_tang'],
      anh_dai_dien_url: null,
      tao_luc: now,
      cap_nhat_luc: now,
    },
    ['tai_khoan_id'],
  );

  const existingGoal = await goalRepository.findOne({
    where: {
      tai_khoan_id: user.id,
      trang_thai: 'dang_ap_dung',
    },
    order: {
      cap_nhat_luc: 'DESC',
      id: 'DESC',
    },
  });

  await goalRepository.update(
    { tai_khoan_id: user.id, trang_thai: 'dang_ap_dung' },
    { trang_thai: 'luu_tru', cap_nhat_luc: now },
  );

  await goalRepository.save(
    goalRepository.create({
      id: existingGoal?.id,
      tai_khoan_id: user.id,
      loai_muc_tieu: 'giam_can',
      trang_thai: 'dang_ap_dung',
      can_nang_bat_dau_kg: '82.00',
      can_nang_muc_tieu_kg: '72.00',
      muc_tieu_calories_ngay: '2100.00',
      muc_tieu_protein_g: '156.00',
      muc_tieu_carb_g: '210.00',
      muc_tieu_fat_g: '58.00',
      ngay_bat_dau: twoDaysAgo.toISOString().slice(0, 10),
      ngay_muc_tieu: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      tao_luc: existingGoal?.tao_luc ?? twoDaysAgo,
      cap_nhat_luc: now,
    }),
  );

  const currentGoal = await goalRepository.findOne({
    where: {
      tai_khoan_id: user.id,
      trang_thai: 'dang_ap_dung',
    },
    order: {
      cap_nhat_luc: 'DESC',
      id: 'DESC',
    },
  });

  if (!currentGoal) {
    console.log(
      'Current goal missing after seed, skipping metrics and assessment',
    );
    return;
  }

  const existingMetric = await metricRepository.findOne({
    where: {
      tai_khoan_id: user.id,
    },
    order: {
      do_luc: 'DESC',
      id: 'DESC',
    },
  });

  await metricRepository.save(
    metricRepository.create({
      id: existingMetric?.id,
      tai_khoan_id: user.id,
      do_luc: oneDayAgo,
      can_nang_kg: '78.00',
      chieu_cao_cm: '175.00',
      vong_eo_cm: '84.00',
      vong_mong_cm: '96.00',
      huyet_ap_tam_thu: 118,
      huyet_ap_tam_truong: 76,
      duong_huyet: '5.20',
      ghi_chu: 'Chi so suc khoe demo cho user',
      tao_luc: existingMetric?.tao_luc ?? oneDayAgo,
      cap_nhat_luc: oneDayAgo,
    }),
  );

  const latestMetric = await metricRepository.findOne({
    where: { tai_khoan_id: user.id },
    order: { do_luc: 'DESC', id: 'DESC' },
  });

  if (!latestMetric) {
    console.log('Health metric missing after seed, skipping assessment');
    return;
  }

  const existingAssessment = await assessmentRepository.findOne({
    where: { tai_khoan_id: user.id },
    order: { tao_luc: 'DESC', id: 'DESC' },
  });

  await assessmentRepository.save(
    assessmentRepository.create({
      id: existingAssessment?.id,
      tai_khoan_id: user.id,
      chi_so_suc_khoe_id: latestMetric.id,
      muc_tieu_id: currentGoal.id,
      bmi: '25.47',
      phan_loai_bmi: 'thua_can',
      bmr: '1738.75',
      tdee: '2695.06',
      calories_khuyen_nghi: '2195.06',
      protein_khuyen_nghi_g: '156.00',
      carb_khuyen_nghi_g: '210.00',
      fat_khuyen_nghi_g: '58.00',
      tom_tat:
        'BMI hien tai: 25.5 (thua_can). Muc tieu dang ap dung: giam_can. Calories khuyen nghi moi ngay: 2195 kcal',
      tao_luc: existingAssessment?.tao_luc ?? now,
      cap_nhat_luc: now,
    }),
  );

  console.log('Seeded user health profile, goal, metric, and assessment');
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

async function seedBulkFoodCatalog() {
  const enabledRaw = (process.env.SEED_BULK ?? '').toLowerCase();
  const enabled = ['1', 'true', 'yes', 'on'].includes(enabledRaw);
  if (!enabled) return;

  const targetFoods = (() => {
    const parsed = Number(process.env.SEED_BULK_FOODS ?? 1200);
    if (!Number.isFinite(parsed) || parsed < 0) return 1200;
    return Math.floor(parsed);
  })();
  if (targetFoods <= 0) return;

  const groupRepository = AppDataSource.getRepository(NhomThucPhamEntity);
  const foodRepository = AppDataSource.getRepository(ThucPhamEntity);
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const now = new Date();

  const [groups, adminUser, existingCount] = await Promise.all([
    groupRepository.find(),
    userRepository.findOne({ where: { email: 'admin@nutriwise.vn' } }),
    foodRepository.count(),
  ]);

  if (groups.length === 0) {
    console.log('Bulk food seed skipped: no food groups');
    return;
  }

  if (existingCount >= targetFoods) {
    console.log(
      `Bulk food seed skipped: existing foods (${existingCount}) >= target (${targetFoods})`,
    );
    return;
  }

  const groupBySlug = new Map(groups.map((group) => [group.slug, group]));
  const templates: Array<{
    groupSlug: string;
    prefix: string;
    tags: string[];
    unit: 'g' | 'ml';
    base: {
      calories: [number, number];
      protein: [number, number];
      carb: [number, number];
      fat: [number, number];
      fiber: [number, number];
      sugar: [number, number];
      sodium: [number, number];
    };
  }> = [
    {
      groupSlug: 'tinh-bot',
      prefix: 'Tinh bột',
      tags: ['carb', 'nang-luong', 'bulk'],
      unit: 'g',
      base: {
        calories: [100, 360],
        protein: [1, 10],
        carb: [20, 75],
        fat: [0.1, 6],
        fiber: [0.2, 8],
        sugar: [0, 12],
        sodium: [0, 180],
      },
    },
    {
      groupSlug: 'dam',
      prefix: 'Đạm',
      tags: ['protein', 'lean', 'bulk'],
      unit: 'g',
      base: {
        calories: [80, 300],
        protein: [10, 35],
        carb: [0, 12],
        fat: [0.5, 18],
        fiber: [0, 2],
        sugar: [0, 5],
        sodium: [20, 300],
      },
    },
    {
      groupSlug: 'rau-cu',
      prefix: 'Rau củ',
      tags: ['rau-xanh', 'fiber', 'bulk'],
      unit: 'g',
      base: {
        calories: [15, 120],
        protein: [0.5, 8],
        carb: [2, 22],
        fat: [0.1, 4],
        fiber: [1, 10],
        sugar: [0.5, 12],
        sodium: [5, 200],
      },
    },
    {
      groupSlug: 'trai-cay',
      prefix: 'Trái cây',
      tags: ['fruit', 'snack', 'bulk'],
      unit: 'g',
      base: {
        calories: [30, 140],
        protein: [0.3, 4],
        carb: [6, 32],
        fat: [0.1, 3],
        fiber: [1, 9],
        sugar: [3, 26],
        sodium: [0, 80],
      },
    },
    {
      groupSlug: 'do-uong',
      prefix: 'Đồ uống',
      tags: ['drink', 'hydration', 'bulk'],
      unit: 'ml',
      base: {
        calories: [8, 90],
        protein: [0, 8],
        carb: [0, 16],
        fat: [0, 6],
        fiber: [0, 2],
        sugar: [0, 14],
        sodium: [0, 120],
      },
    },
  ];

  const toCreate = targetFoods - existingCount;
  const rows: Array<Record<string, unknown>> = [];
  const adminId = adminUser?.id ?? null;
  const seedTag = process.env.SEED_BULK_TAG?.trim() || 'bulk';

  for (let i = 0; i < toCreate; i += 1) {
    const template = templates[i % templates.length];
    const group = groupBySlug.get(template.groupSlug) ?? groups[0];
    const n = existingCount + i + 1;
    const serial = String(n).padStart(6, '0');

    const calories = randomBetween(
      template.base.calories[0],
      template.base.calories[1],
    );
    const protein = randomBetween(
      template.base.protein[0],
      template.base.protein[1],
    );
    const carb = randomBetween(template.base.carb[0], template.base.carb[1]);
    const fat = randomBetween(template.base.fat[0], template.base.fat[1]);
    const fiber = randomBetween(template.base.fiber[0], template.base.fiber[1]);
    const sugar = randomBetween(template.base.sugar[0], template.base.sugar[1]);
    const sodium = randomBetween(
      template.base.sodium[0],
      template.base.sodium[1],
    );

    rows.push({
      nhom_thuc_pham_id: group.id,
      ten: `${template.prefix} mẫu ${serial}`,
      slug: `bulk-${seedTag}-${template.groupSlug}-${serial}`,
      mo_ta: `Thực phẩm seed tự động #${serial} cho kiểm thử dữ liệu lớn`,
      the_gan: template.tags,
      loai_nguon: 'noi_bo',
      ten_nguon: 'NutriWise Bulk Seeder',
      ma_nguon: `BULK-${template.groupSlug.toUpperCase()}-${serial}`,
      khau_phan_tham_chieu: '100',
      don_vi_khau_phan: template.unit,
      calories_100g: calories.toFixed(2),
      protein_100g: protein.toFixed(2),
      carb_100g: carb.toFixed(2),
      fat_100g: fat.toFixed(2),
      chat_xo_100g: fiber.toFixed(2),
      duong_100g: sugar.toFixed(2),
      natri_100g: sodium.toFixed(2),
      du_lieu_goc: { provider: 'bulk_seed', serial },
      da_xac_minh: true,
      tao_boi: adminId,
      cap_nhat_boi: adminId,
      tao_luc: now,
      cap_nhat_luc: now,
      xoa_luc: null,
    });
  }

  if (rows.length > 0) {
    await foodRepository.upsert(rows, ['slug']);
  }

  const finalCount = await foodRepository.count();
  console.log(
    `Bulk food seed completed: +${rows.length} foods (total=${finalCount})`,
  );
}

async function seedUserNutritionTrackingAndRecommendations() {
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const foodRepository = AppDataSource.getRepository(ThucPhamEntity);
  const mealLogRepository = AppDataSource.getRepository(NhatKyBuaAnEntity);
  const mealLogDetailRepository = AppDataSource.getRepository(
    ChiTietNhatKyBuaAnEntity,
  );
  const nutritionSummaryRepository = AppDataSource.getRepository(
    TongHopDinhDuongNgayEntity,
  );
  const mealPlanRepository = AppDataSource.getRepository(KeHoachAnEntity);
  const mealPlanDetailRepository = AppDataSource.getRepository(
    ChiTietKeHoachAnEntity,
  );
  const aiSessionRepository = AppDataSource.getRepository(PhienTuVanAiEntity);
  const recommendationRepository =
    AppDataSource.getRepository(KhuyenNghiAiEntity);

  const user = await userRepository.findOne({
    where: { email: 'user@nutriwise.vn' },
  });

  if (!user) {
    console.log(
      'User demo not found, skipping nutrition tracking and recommendation seed',
    );
    return;
  }

  const foods = await foodRepository.find({
    where: [
      { slug: 'com-trang' },
      { slug: 'uc-ga-khong-da' },
      { slug: 'bong-cai-xanh' },
      { slug: 'chuoi' },
      { slug: 'sua-tuoi-khong-duong' },
    ],
  });

  const foodBySlug = new Map(foods.map((food) => [food.slug, food]));
  const requiredSlugs = [
    'com-trang',
    'uc-ga-khong-da',
    'bong-cai-xanh',
    'chuoi',
    'sua-tuoi-khong-duong',
  ];

  if (requiredSlugs.some((slug) => !foodBySlug.has(slug))) {
    console.log(
      'Food catalog demo is incomplete, skipping nutrition tracking and recommendation seed',
    );
    return;
  }

  const existingMealLogs = await mealLogRepository.find({
    where: { tai_khoan_id: user.id },
    select: ['id'],
  });
  const existingMealPlans = await mealPlanRepository.find({
    where: { tai_khoan_id: user.id },
    select: ['id'],
  });

  if (existingMealLogs.length) {
    await mealLogDetailRepository
      .createQueryBuilder()
      .delete()
      .where('nhat_ky_bua_an_id IN (:...ids)', {
        ids: existingMealLogs.map((item) => item.id),
      })
      .execute();
  }

  if (existingMealPlans.length) {
    await mealPlanDetailRepository
      .createQueryBuilder()
      .delete()
      .where('ke_hoach_an_id IN (:...ids)', {
        ids: existingMealPlans.map((item) => item.id),
      })
      .execute();
  }

  await recommendationRepository.delete({ tai_khoan_id: user.id });
  await nutritionSummaryRepository.delete({ tai_khoan_id: user.id });
  await mealLogRepository.delete({ tai_khoan_id: user.id });
  await mealPlanRepository.delete({ tai_khoan_id: user.id });
  await aiSessionRepository.delete({ tai_khoan_id: user.id });

  const now = new Date();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const breakfastLog = await mealLogRepository.save(
    mealLogRepository.create({
      tai_khoan_id: user.id,
      ngay_ghi: today,
      loai_bua_an: 'bua_sang',
      ghi_chu: 'Bữa sáng demo cho C09',
      tao_luc: now,
      cap_nhat_luc: now,
    }),
  );

  const lunchLog = await mealLogRepository.save(
    mealLogRepository.create({
      tai_khoan_id: user.id,
      ngay_ghi: today,
      loai_bua_an: 'bua_trua',
      ghi_chu: 'Bữa trưa demo cho C09',
      tao_luc: now,
      cap_nhat_luc: now,
    }),
  );

  await mealLogDetailRepository.save([
    mealLogDetailRepository.create({
      nhat_ky_bua_an_id: breakfastLog.id,
      loai_nguon: 'thuc_pham',
      nguon_id: foodBySlug.get('sua-tuoi-khong-duong')!.id,
      cong_thuc_id: null,
      thuc_pham_id: foodBySlug.get('sua-tuoi-khong-duong')!.id,
      so_luong: '200.00',
      don_vi: 'ml',
      calories: '122.00',
      protein_g: '6.40',
      carb_g: '9.60',
      fat_g: '6.60',
      chat_xo_g: '0.00',
      natri_mg: '86.00',
      du_lieu_chup_lai: {
        ten: 'Sữa tươi không đường',
        khau_phan: 200,
        don_vi: 'ml',
      },
      tao_luc: now,
      cap_nhat_luc: now,
    }),
    mealLogDetailRepository.create({
      nhat_ky_bua_an_id: breakfastLog.id,
      loai_nguon: 'thuc_pham',
      nguon_id: foodBySlug.get('chuoi')!.id,
      cong_thuc_id: null,
      thuc_pham_id: foodBySlug.get('chuoi')!.id,
      so_luong: '120.00',
      don_vi: 'g',
      calories: '106.80',
      protein_g: '1.32',
      carb_g: '27.36',
      fat_g: '0.36',
      chat_xo_g: '3.12',
      natri_mg: '1.20',
      du_lieu_chup_lai: { ten: 'Chuối', khau_phan: 120, don_vi: 'g' },
      tao_luc: now,
      cap_nhat_luc: now,
    }),
    mealLogDetailRepository.create({
      nhat_ky_bua_an_id: lunchLog.id,
      loai_nguon: 'thuc_pham',
      nguon_id: foodBySlug.get('com-trang')!.id,
      cong_thuc_id: null,
      thuc_pham_id: foodBySlug.get('com-trang')!.id,
      so_luong: '200.00',
      don_vi: 'g',
      calories: '260.00',
      protein_g: '5.40',
      carb_g: '56.40',
      fat_g: '0.60',
      chat_xo_g: '0.80',
      natri_mg: '2.00',
      du_lieu_chup_lai: { ten: 'Cơm trắng', khau_phan: 200, don_vi: 'g' },
      tao_luc: now,
      cap_nhat_luc: now,
    }),
    mealLogDetailRepository.create({
      nhat_ky_bua_an_id: lunchLog.id,
      loai_nguon: 'thuc_pham',
      nguon_id: foodBySlug.get('uc-ga-khong-da')!.id,
      cong_thuc_id: null,
      thuc_pham_id: foodBySlug.get('uc-ga-khong-da')!.id,
      so_luong: '150.00',
      don_vi: 'g',
      calories: '247.50',
      protein_g: '46.50',
      carb_g: '0.00',
      fat_g: '5.40',
      chat_xo_g: '0.00',
      natri_mg: '111.00',
      du_lieu_chup_lai: { ten: 'Ức gà không da', khau_phan: 150, don_vi: 'g' },
      tao_luc: now,
      cap_nhat_luc: now,
    }),
    mealLogDetailRepository.create({
      nhat_ky_bua_an_id: lunchLog.id,
      loai_nguon: 'thuc_pham',
      nguon_id: foodBySlug.get('bong-cai-xanh')!.id,
      cong_thuc_id: null,
      thuc_pham_id: foodBySlug.get('bong-cai-xanh')!.id,
      so_luong: '100.00',
      don_vi: 'g',
      calories: '34.00',
      protein_g: '2.80',
      carb_g: '6.60',
      fat_g: '0.40',
      chat_xo_g: '2.60',
      natri_mg: '33.00',
      du_lieu_chup_lai: { ten: 'Bông cải xanh', khau_phan: 100, don_vi: 'g' },
      tao_luc: now,
      cap_nhat_luc: now,
    }),
  ]);

  await nutritionSummaryRepository.save(
    nutritionSummaryRepository.create({
      tai_khoan_id: user.id,
      ngay: today,
      tong_calories: '770.30',
      tong_protein_g: '62.42',
      tong_carb_g: '99.96',
      tong_fat_g: '13.36',
      so_bua_da_ghi: 2,
      tao_luc: now,
      cap_nhat_luc: now,
    }),
  );

  const aiSession = await aiSessionRepository.save(
    aiSessionRepository.create({
      tai_khoan_id: user.id,
      tieu_de: 'Phiên AI demo cho user',
      trang_thai: 'dang_mo',
      tin_nhan: JSON.stringify([
        { role: 'user', content: 'Hôm nay tôi nên ăn gì để giảm cân?' },
        {
          role: 'assistant',
          content: 'Ưu tiên đạm nạc, rau xanh và kiểm soát calories.',
        },
      ]),
      ngu_canh_chup_lai: { muc_tieu: 'giam_can', calories_con_lai: 1329.7 },
      mo_hinh_cuoi: 'gpt-5.2',
      tong_token_cuoi: 512,
      loi_cuoi: null,
      tao_luc: now,
      cap_nhat_luc: now,
    }),
  );

  const mealPlan = await mealPlanRepository.save(
    mealPlanRepository.create({
      tai_khoan_id: user.id,
      loai_nguon: 'khuyen_nghi_ai',
      nguon_id: null,
      tieu_de: 'Kế hoạch ăn demo cho ngày mai',
      mo_ta: 'Kế hoạch ăn được tạo từ khuyến nghị AI để user thử C10.',
      ngay_ap_dung: tomorrow,
      trang_thai: 'dang_ap_dung',
      tong_calories: '1850.00',
      tong_protein_g: '145.00',
      tong_carb_g: '180.00',
      tong_fat_g: '55.00',
      tao_luc: now,
      cap_nhat_luc: now,
    }),
  );

  await mealPlanDetailRepository.save([
    mealPlanDetailRepository.create({
      ke_hoach_an_id: mealPlan.id,
      loai_bua_an: 'bua_sang',
      cong_thuc_id: null,
      thuc_pham_id: foodBySlug.get('sua-tuoi-khong-duong')!.id,
      so_luong: '250.00',
      don_vi: 'ml',
      calories: '152.50',
      protein_g: '8.00',
      carb_g: '12.00',
      fat_g: '8.25',
      ghi_chu: 'Uống cùng trái cây ít ngọt',
      thu_tu: 1,
      tao_luc: now,
      cap_nhat_luc: now,
    }),
    mealPlanDetailRepository.create({
      ke_hoach_an_id: mealPlan.id,
      loai_bua_an: 'bua_trua',
      cong_thuc_id: null,
      thuc_pham_id: foodBySlug.get('uc-ga-khong-da')!.id,
      so_luong: '180.00',
      don_vi: 'g',
      calories: '297.00',
      protein_g: '55.80',
      carb_g: '0.00',
      fat_g: '6.48',
      ghi_chu: 'Ưu tiên chế biến áp chảo ít dầu',
      thu_tu: 2,
      tao_luc: now,
      cap_nhat_luc: now,
    }),
    mealPlanDetailRepository.create({
      ke_hoach_an_id: mealPlan.id,
      loai_bua_an: 'bua_toi',
      cong_thuc_id: null,
      thuc_pham_id: foodBySlug.get('bong-cai-xanh')!.id,
      so_luong: '200.00',
      don_vi: 'g',
      calories: '68.00',
      protein_g: '5.60',
      carb_g: '13.20',
      fat_g: '0.80',
      ghi_chu: 'Ăn cùng ức gà hoặc cơm lượng vừa',
      thu_tu: 3,
      tao_luc: now,
      cap_nhat_luc: now,
    }),
  ]);

  await recommendationRepository.save([
    recommendationRepository.create({
      tai_khoan_id: user.id,
      phien_tu_van_ai_id: aiSession.id,
      trang_thai: 'da_chap_nhan',
      loai_khuyen_nghi: 'nutrition',
      ngay_muc_tieu: today,
      muc_tieu_calories: '2100.00',
      muc_tieu_protein_g: '156.00',
      muc_tieu_carb_g: '210.00',
      muc_tieu_fat_g: '58.00',
      canh_bao: ['Đã loại trừ thực phẩm dị ứng khỏi danh sách gợi ý.'],
      ly_giai:
        'Khuyến nghị dinh dưỡng demo được xây từ hồ sơ, mục tiêu và thực phẩm đã ghi.',
      du_lieu_khuyen_nghi: {
        calorie_gap: 1329.7,
        foods_uu_tien: [
          { id: foodBySlug.get('uc-ga-khong-da')!.id, ten: 'Ức gà không da' },
          { id: foodBySlug.get('bong-cai-xanh')!.id, ten: 'Bông cải xanh' },
        ],
        foods_han_che: [
          {
            id: foodBySlug.get('chuoi')!.id,
            ten: 'Chuối',
            ly_do: 'Ăn ở lượng vừa phải',
          },
        ],
      },
      ke_hoach_an_da_ap_dung_id: null,
      tao_luc: now,
      cap_nhat_luc: now,
    }),
    recommendationRepository.create({
      tai_khoan_id: user.id,
      phien_tu_van_ai_id: aiSession.id,
      trang_thai: 'da_ap_dung',
      loai_khuyen_nghi: 'meal_plan_daily',
      ngay_muc_tieu: tomorrow,
      muc_tieu_calories: '1850.00',
      muc_tieu_protein_g: '145.00',
      muc_tieu_carb_g: '180.00',
      muc_tieu_fat_g: '55.00',
      canh_bao: [],
      ly_giai:
        'Khuyến nghị thực đơn ngày đã được áp dụng thành kế hoạch ăn demo.',
      du_lieu_khuyen_nghi: {
        tieu_de: 'Thực đơn ngày giảm cân demo',
        mo_ta: 'Gợi ý thực đơn 1 ngày từ hệ thống',
        chi_tiet: [
          {
            loai_bua_an: 'bua_sang',
            thuc_pham_id: foodBySlug.get('sua-tuoi-khong-duong')!.id,
            so_luong: 250,
            don_vi: 'ml',
            calories: 152.5,
            protein_g: 8,
            carb_g: 12,
            fat_g: 8.25,
          },
          {
            loai_bua_an: 'bua_trua',
            thuc_pham_id: foodBySlug.get('uc-ga-khong-da')!.id,
            so_luong: 180,
            don_vi: 'g',
            calories: 297,
            protein_g: 55.8,
            carb_g: 0,
            fat_g: 6.48,
          },
          {
            loai_bua_an: 'bua_toi',
            thuc_pham_id: foodBySlug.get('bong-cai-xanh')!.id,
            so_luong: 200,
            don_vi: 'g',
            calories: 68,
            protein_g: 5.6,
            carb_g: 13.2,
            fat_g: 0.8,
          },
        ],
      },
      ke_hoach_an_da_ap_dung_id: mealPlan.id,
      tao_luc: now,
      cap_nhat_luc: now,
    }),
  ]);

  console.log(
    'Seeded user meal logs, nutrition summary, meal plan, AI session, and recommendations',
  );
}

async function seedFoodReviewRequests() {
  const reviewRepository = AppDataSource.getRepository(
    YeuCauDuyetThucPhamEntity,
  );
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
      du_lieu_hien_tai: food
        ? { ten: food.ten, calories_100g: food.calories_100g }
        : null,
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
        noi_dung:
          'Chuyên gia dinh dưỡng đã gửi 2 đề xuất dữ liệu thực phẩm mới chờ duyệt.',
        trang_thai: 'chua_doc',
        duong_dan_hanh_dong: '/admin/food-review-requests',
      },
      {
        tai_khoan_id: admin.id,
        loai: 'he_thong',
        tieu_de: 'Chào mừng Admin',
        noi_dung:
          'Hệ thống NutriWise đã sẵn sàng hoạt động. Bắt đầu quản lý dữ liệu và gói dịch vụ.',
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
      noi_dung:
        'Đề xuất "Sữa chua Hy Lạp" đã được admin duyệt và thêm vào catalog.',
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
        mo_ta:
          'Trải nghiệm các tính năng cơ bản: theo dõi bữa ăn, xem catalog thực phẩm và nhận đánh giá sức khỏe đơn giản.',
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
        mo_ta:
          'Mở khóa toàn bộ tính năng AI: tư vấn dinh dưỡng cá nhân, lập kế hoạch ăn thông minh, đánh giá sức khỏe nâng cao và trò chuyện với AI advisor.',
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
        mo_ta:
          'Tất cả quyền lợi của Premium, thanh toán 1 lần/năm với mức giá tiết kiệm hơn 30%.',
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
        mo_ta:
          'Dành cho gym, phòng khám và tổ chức: quản lý nhiều user, báo cáo nâng cao, ưu tiên hỗ trợ.',
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
  const featureRepository = AppDataSource.getRepository(
    ChucNangGoiDichVuEntity,
  );
  const packageRepository = AppDataSource.getRepository(GoiDichVuEntity);
  const now = new Date();

  const existing = await featureRepository.count();
  if (existing > 0) return;

  const freePackage = await packageRepository.findOne({
    where: { slug: 'goi-mien-phi' },
  });
  const premiumPackage = await packageRepository.findOne({
    where: { slug: 'goi-premium' },
  });

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
      const isFreeAllowed = ['ai_chat', 'ai_health_assessment'].includes(
        f.code,
      );
      records.push({
        goi_dich_vu_id: freePackage.id,
        ma_chuc_nang: f.code,
        ten_chuc_nang: f.name,
        mo_ta: null,
        duoc_phep_su_dung: isFreeAllowed,
        gioi_han_so_lan: isFreeAllowed ? (f.code === 'ai_chat' ? 5 : 2) : null,
        gioi_han_theo: isFreeAllowed
          ? ('ngay' as const)
          : ('khong_gioi_han' as const),
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
  const subscriptionRepository = AppDataSource.getRepository(
    DangKyGoiDichVuEntity,
  );
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const packageRepository = AppDataSource.getRepository(GoiDichVuEntity);
  const now = new Date();

  const existing = await subscriptionRepository.count();
  if (existing > 0) return;

  const user = await userRepository.findOne({
    where: { email: 'user@nutriwise.vn' },
  });
  const nutritionist = await userRepository.findOne({
    where: { email: 'nutritionist@nutriwise.vn' },
  });
  const freePackage = await packageRepository.findOne({
    where: { slug: 'goi-mien-phi' },
  });
  const premiumPackage = await packageRepository.findOne({
    where: { slug: 'goi-premium' },
  });

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
  const nutri = await userRepository.findOne({
    where: { email: 'nutritionist@nutriwise.vn' },
  });
  if (!nutri) {
    console.log('Nutritionist user not found, skipping articles seed');
    return;
  }

  const articleRepo = AppDataSource.getRepository(BaiVietEntity);
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const articles = [
    {
      tieu_de: 'Dinh dưỡng cho người tập gym',
      slug: 'dinh-duong-cho-nguoi-tap-gym',
      danh_muc: 'dinh_duong',
      tom_tat: 'Hướng dẫn chế độ ăn phù hợp cho người tập gym.',
      noi_dung:
        '## Vì sao cần tối ưu dinh dưỡng khi tập gym?\n\nProtein là dưỡng chất quan trọng cho việc phát triển và duy trì cơ bắp. Hầu hết người tập gym có thể bắt đầu với mức 1.6-2.2g protein/kg cân nặng/ngày.\n\n![goi-y-bua-gym](https://picsum.photos/seed/nutri-gym-inline/1200/720)\n\n### Nguyên tắc xây bữa ăn\n\n- Ưu tiên protein nạc trong mỗi bữa chính.\n- Kết hợp carb phức hợp trước tập 2-3 giờ.\n- Bổ sung rau xanh và chất béo tốt để cân bằng hormone.\n\n### Gợi ý nhanh trong ngày\n\nBữa sáng có thể dùng yến mạch + trứng + trái cây. Bữa sau tập ưu tiên protein dễ hấp thu kèm tinh bột vừa đủ để phục hồi glycogen.',
      the_gan: ['gym', 'protein', 'meal-prep'],
      anh_dai_dien_url: 'https://picsum.photos/seed/nutri-gym/1200/675',
      trang_thai: 'xuat_ban' as const,
      xuat_ban_luc: new Date(now.getTime() - 10 * oneDay),
      huong_dan_ai: {
        context: 'gym_nutrition',
        rules: [
          'Ưu tiên protein từ thịt nạc, trứng, whey',
          'Carb phức hợp trước tập 2h',
          'Bổ sung BCAA nếu cần',
        ],
      },
    },
    {
      tieu_de: 'Chế độ ăn cho người tiểu đường type 2',
      slug: 'che-do-an-tieu-duong-type-2',
      danh_muc: 'suc_khoe',
      tom_tat: 'Hướng dẫn kiểm soát đường huyết qua chế độ ăn.',
      noi_dung:
        '## Nguyên tắc kiểm soát đường huyết bền vững\n\nNgười tiểu đường type 2 nên ưu tiên thực phẩm có chỉ số đường huyết thấp, tăng lượng chất xơ và chia khẩu phần hợp lý để tránh dao động đường huyết lớn.\n\n![thuc-pham-gi-thap](https://picsum.photos/seed/nutri-diabetes-inline/1200/720)\n\n### Checklist khi chọn món\n\n- Chọn ngũ cốc nguyên hạt thay vì tinh bột tinh luyện.\n- Mỗi bữa có rau xanh + protein nạc.\n- Hạn chế đồ uống có đường và món tráng miệng ngọt.\n\nTheo dõi phản ứng cơ thể sau ăn để điều chỉnh khẩu phần phù hợp từng cá nhân.',
      the_gan: ['tieu-duong', 'duong-huyet', 'gi-thap'],
      anh_dai_dien_url: 'https://picsum.photos/seed/nutri-diabetes/1200/675',
      trang_thai: 'xuat_ban' as const,
      xuat_ban_luc: new Date(now.getTime() - 8 * oneDay),
      huong_dan_ai: {
        context: 'diabetes_diet',
        rules: [
          'GI thấp < 55',
          'Chia nhỏ bữa ăn 5-6 lần/ngày',
          'Hạn chế tinh bột trắng',
        ],
      },
    },
    {
      tieu_de: 'Thực phẩm giàu omega-3 cho não bộ',
      slug: 'thuc-pham-giau-omega-3',
      danh_muc: 'dinh_duong',
      tom_tat: 'Omega-3 và vai trò với sức khỏe não bộ.',
      noi_dung:
        '## Omega-3 ảnh hưởng thế nào đến não bộ?\n\nDHA và EPA hỗ trợ cấu trúc màng tế bào thần kinh, góp phần cải thiện tập trung và ghi nhớ khi dùng đều đặn theo thời gian.\n\n### Nhóm thực phẩm nên ưu tiên\n\n- Cá béo: cá hồi, cá thu, cá mòi.\n- Hạt: chia, lanh, óc chó.\n- Có thể cân nhắc bổ sung nếu khẩu phần ăn thiếu kéo dài.',
      the_gan: ['omega-3', 'nao-bo', 'suc-khoe'],
      anh_dai_dien_url: 'https://picsum.photos/seed/nutri-omega3/1200/675',
      trang_thai: 'ban_nhap' as const,
      xuat_ban_luc: null,
      huong_dan_ai: null,
    },
    {
      tieu_de: 'Detox cơ thể an toàn',
      slug: 'detox-co-the-an-toan',
      danh_muc: 'suc_khoe',
      tom_tat: 'Phương pháp detox khoa học và hiệu quả.',
      noi_dung:
        '## Detox đúng nghĩa là hỗ trợ cơ thể hoạt động tốt hơn\n\nDetox không đồng nghĩa nhịn ăn cực đoan. Mục tiêu là giảm tải thực phẩm siêu chế biến, tăng nước, chất xơ và ngủ đủ.\n\n![detox-safe](https://picsum.photos/seed/nutri-detox-inline/1200/720)\n\n### 4 việc nên làm mỗi ngày\n\n- Uống đủ 2-3L nước.\n- Mỗi bữa có rau và trái cây ít đường.\n- Hạn chế rượu bia, đồ uống ngọt.\n- Ngủ 7-8 giờ để cơ thể tự phục hồi.',
      the_gan: ['detox', 'song-lanh-manh', 'thoi-quen'],
      anh_dai_dien_url: 'https://picsum.photos/seed/nutri-detox/1200/675',
      trang_thai: 'xuat_ban' as const,
      xuat_ban_luc: new Date(now.getTime() - 5 * oneDay),
      huong_dan_ai: {
        context: 'detox',
        rules: [
          'Không khuyến khích nhịn ăn',
          'Ưu tiên rau xanh lá đậm',
          'Uống đủ nước',
        ],
      },
    },
    {
      tieu_de: 'Vitamin D và sức khỏe xương',
      slug: 'vitamin-d-suc-khoe-xuong',
      danh_muc: 'dinh_duong',
      tom_tat: 'Vitamin D giúp hấp thụ canxi và bảo vệ xương.',
      noi_dung:
        '## Vai trò của vitamin D trong chuyển hóa xương\n\nVitamin D giúp hấp thụ canxi hiệu quả hơn. Thiếu kéo dài có thể làm tăng nguy cơ loãng xương và yếu cơ.\n\n### Nguồn bổ sung tự nhiên\n\n- Ánh nắng phù hợp theo khung giờ an toàn.\n- Cá béo, lòng đỏ trứng, nấm.\n- Kết hợp với chế độ ăn giàu canxi và vận động chịu lực.',
      the_gan: ['vitamin-d', 'xuong-khop', 'vi-chat'],
      anh_dai_dien_url: 'https://picsum.photos/seed/nutri-vitd/1200/675',
      trang_thai: 'ban_nhap' as const,
      xuat_ban_luc: null,
      huong_dan_ai: null,
    },
    {
      tieu_de: 'Meal prep 3 ngày cho người bận rộn',
      slug: 'meal-prep-3-ngay-nguoi-ban-ron',
      danh_muc: 'thuc_don',
      tom_tat:
        'Mẫu chuẩn bị bữa ăn 3 ngày giúp tiết kiệm thời gian mà vẫn đủ macro.',
      noi_dung:
        '## Chuẩn bị trước giúp ăn đúng kế hoạch dễ hơn\n\nMeal prep 2-3 ngày/lần giúp bạn giảm quyết định trong ngày và hạn chế ăn lệch mục tiêu.\n\n![meal-prep-box](https://picsum.photos/seed/nutri-mealprep-inline/1200/720)\n\n### Gợi ý chia suất\n\n- Protein: 120-150g mỗi hộp.\n- Carb: 100-150g mỗi hộp tùy mục tiêu.\n- Rau xanh: tối thiểu 1 nắm tay lớn mỗi bữa.\n\nBạn có thể thay đổi gia vị theo ngày để tránh nhàm chán nhưng vẫn giữ cấu trúc macro tương tự.',
      the_gan: ['meal-prep', 'thuc-don', 'quan-ly-thoi-gian'],
      anh_dai_dien_url: 'https://picsum.photos/seed/nutri-mealprep/1200/675',
      trang_thai: 'xuat_ban' as const,
      xuat_ban_luc: new Date(now.getTime() - 2 * oneDay),
      huong_dan_ai: {
        context: 'meal_prep',
        rules: [
          'Ưu tiên công thức nấu nhanh dưới 30 phút',
          'Giữ tỷ lệ protein cao cho bữa trưa',
          'Biến thể gia vị để tăng tuân thủ',
        ],
      },
    },
  ];

  const upsertRows = articles.map((a) => ({
    tac_gia_id: nutri.id,
    tieu_de: a.tieu_de,
    slug: a.slug,
    danh_muc: a.danh_muc,
    tom_tat: a.tom_tat,
    noi_dung: a.noi_dung,
    the_gan: a.the_gan,
    anh_dai_dien_url: a.anh_dai_dien_url,
    huong_dan_ai: a.huong_dan_ai,
    trang_thai: a.trang_thai,
    xuat_ban_luc: a.xuat_ban_luc,
    tao_luc: now,
    cap_nhat_luc: now,
    xoa_luc: null,
  }));

  await articleRepo.upsert(upsertRows, ['slug']);
  console.log(`Seeded/updated ${articles.length} articles`);
}

async function seedRecipes() {
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const nutri = await userRepository.findOne({
    where: { email: 'nutritionist@nutriwise.vn' },
  });
  if (!nutri) return;

  const recipeRepo = AppDataSource.getRepository(CongThucEntity);
  const ingredientRepo = AppDataSource.getRepository(ThanhPhanCongThucEntity);
  const existing = await recipeRepo.count({ where: { tao_boi: nutri.id } });
  if (existing > 0) {
    console.log(`Recipes already seeded (${existing} found)`);
    return;
  }

  const foodRepo = AppDataSource.getRepository(ThucPhamEntity);
  const foods = await foodRepo.find({ take: 10, order: { id: 'ASC' } });
  const now = new Date();

  const recipes = [
    {
      ten: 'Salad ức gà quinoa',
      slug: 'salad-uc-ga-quinoa',
      mo_ta: 'Salad giàu protein với ức gà áp chảo và quinoa.',
      huong_dan:
        '1. Luộc quinoa 15 phút, để nguội.\n2. Áp chảo ức gà gia vị 5 phút mỗi mặt.\n3. Trộn rau xanh, cà chua, dưa leo.\n4. Rưới dressing dầu olive + chanh.',
      so_khau_phan: 2,
      tong_calories: 450,
      tong_protein_g: 38,
      tong_carb_g: 35,
      tong_fat_g: 18,
      trang_thai: 'xuat_ban' as const,
    },
    {
      ten: 'Smoothie protein chuối bơ',
      slug: 'smoothie-protein-chuoi-bo',
      mo_ta: 'Smoothie bổ sung protein sau tập.',
      huong_dan:
        '1. Cho 1 quả chuối, 1/2 quả bơ, 200ml sữa hạnh nhân vào máy xay.\n2. Thêm 1 scoop whey protein.\n3. Xay nhuyễn 30 giây, thêm đá nếu thích.',
      so_khau_phan: 1,
      tong_calories: 380,
      tong_protein_g: 28,
      tong_carb_g: 40,
      tong_fat_g: 14,
      trang_thai: 'xuat_ban' as const,
    },
    {
      ten: 'Cá hồi nướng rau củ',
      slug: 'ca-hoi-nuong-rau-cu',
      mo_ta: 'Bữa tối healthy với cá hồi omega-3.',
      huong_dan:
        '1. Ướp cá hồi với muối, tiêu, chanh 15 phút.\n2. Cắt bông cải, cà rốt, khoai lang.\n3. Nướng ở 200°C trong 20 phút.\n4. Ăn kèm gạo lứt.',
      so_khau_phan: 2,
      tong_calories: 520,
      tong_protein_g: 42,
      tong_carb_g: 30,
      tong_fat_g: 26,
      trang_thai: 'xuat_ban' as const,
    },
    {
      ten: 'Bowl yến mạch trái cây',
      slug: 'bowl-yen-mach-trai-cay',
      mo_ta: 'Bữa sáng năng lượng với yến mạch overnight.',
      huong_dan:
        '1. Ngâm yến mạch với sữa qua đêm.\n2. Thêm mật ong, hạt chia.\n3. Top trái cây tươi: dâu, việt quất, chuối.',
      so_khau_phan: 1,
      tong_calories: 320,
      tong_protein_g: 12,
      tong_carb_g: 52,
      tong_fat_g: 8,
      trang_thai: 'ban_nhap' as const,
    },
  ];

  for (const r of recipes) {
    const saved = await recipeRepo.save(
      recipeRepo.create({
        tao_boi: nutri.id,
        ten: r.ten,
        slug: r.slug,
        mo_ta: r.mo_ta,
        huong_dan: r.huong_dan,
        so_khau_phan: r.so_khau_phan,
        tong_calories: r.tong_calories,
        tong_protein_g: r.tong_protein_g,
        tong_carb_g: r.tong_carb_g,
        tong_fat_g: r.tong_fat_g,
        trang_thai: r.trang_thai,
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );

    // Add 2-3 ingredients from existing foods
    const ingredientFoods = foods.slice(0, Math.min(3, foods.length));
    for (let i = 0; i < ingredientFoods.length; i++) {
      await ingredientRepo.save(
        ingredientRepo.create({
          cong_thuc_id: saved.id,
          thuc_pham_id: ingredientFoods[i].id,
          so_luong: (i + 1) * 100,
          don_vi: 'g',
          tao_luc: now,
          cap_nhat_luc: now,
        } as any),
      );
    }
  }
  console.log(`Seeded ${recipes.length} recipes`);
}

async function seedMealTemplates() {
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const nutri = await userRepository.findOne({
    where: { email: 'nutritionist@nutriwise.vn' },
  });
  if (!nutri) return;

  const templateRepo = AppDataSource.getRepository(ThucDonMauEntity);
  const detailRepo = AppDataSource.getRepository(ChiTietThucDonMauEntity);
  const existing = await templateRepo.count({ where: { tao_boi: nutri.id } });
  if (existing > 0) {
    console.log(`Meal templates already seeded (${existing} found)`);
    return;
  }

  const recipeRepo = AppDataSource.getRepository(CongThucEntity);
  const recipes = await recipeRepo.find({
    where: { tao_boi: nutri.id },
    take: 4,
  });
  const foodRepo = AppDataSource.getRepository(ThucPhamEntity);
  const foods = await foodRepo.find({ take: 5, order: { id: 'ASC' } });
  const now = new Date();

  const templates = [
    {
      tieu_de: 'Thực đơn giảm cân 7 ngày',
      mo_ta: 'Thực đơn 1500 kcal/ngày cho mục tiêu giảm cân bền vững.',
      loai: 'giam_can',
      cal: 1500,
      trang_thai: 'xuat_ban' as const,
    },
    {
      tieu_de: 'Thực đơn tăng cơ',
      mo_ta: 'Thực đơn 2500 kcal/ngày cho người tập gym muốn tăng cơ.',
      loai: 'tang_can',
      cal: 2500,
      trang_thai: 'xuat_ban' as const,
    },
    {
      tieu_de: 'Thực đơn healthy cân bằng',
      mo_ta: 'Thực đơn 2000 kcal/ngày cho sức khỏe tổng thể.',
      loai: 'giu_can',
      cal: 2000,
      trang_thai: 'ban_nhap' as const,
    },
  ];

  const buaAn: ('bua_sang' | 'bua_trua' | 'bua_toi' | 'bua_phu')[] = [
    'bua_sang',
    'bua_trua',
    'bua_toi',
    'bua_phu',
  ];

  for (const t of templates) {
    const saved = (await templateRepo.save(
      templateRepo.create({
        tao_boi: nutri.id,
        tieu_de: t.tieu_de,
        mo_ta: t.mo_ta,
        loai_muc_tieu_phu_hop: t.loai,
        calories_muc_tieu: t.cal,
        trang_thai: t.trang_thai,
        tao_luc: now,
        cap_nhat_luc: now,
      } as any),
    )) as unknown as ThucDonMauEntity;

    // Add meal details for 2 days
    for (let day = 1; day <= 2; day++) {
      for (let b = 0; b < buaAn.length; b++) {
        const recipe = recipes[b % recipes.length];
        const food = foods[b % foods.length];
        await detailRepo.save(
          detailRepo.create({
            thuc_don_mau_id: saved.id,
            ngay_so: day,
            loai_bua_an: buaAn[b],
            cong_thuc_id: recipe?.id ?? null,
            thuc_pham_id: food?.id ?? null,
            so_luong: 1,
            don_vi: 'phan',
            ghi_chu: null,
            thu_tu: b + 1,
            tao_luc: now,
            cap_nhat_luc: now,
          } as any),
        );
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

  const nutri = await userRepo.findOne({
    where: { email: 'nutritionist@nutriwise.vn' },
  });
  if (!nutri) {
    console.log('Nutritionist user not found, skipping nutritionist profiles');
    return;
  }

  // Seed 1 Nutritionist hoat_dong (A15 test), 1 Nutritionist cho_duyet (A14 test)
  const activeProfile = await cgRepo.findOne({
    where: { tai_khoan_id: nutri.id },
  });
  await cgRepo.save(
    cgRepo.create({
      id: activeProfile?.id,
      tai_khoan_id: nutri.id,
      chuyen_mon: 'Dinh dưỡng lâm sàng, Giảm cân, Dinh dưỡng thể thao',
      mo_ta:
        'Chuyên gia dinh dưỡng với 5 năm kinh nghiệm tư vấn cho người Việt. Tốt nghiệp Đại học Y Hà Nội, chứng chỉ Dinh dưỡng lâm sàng quốc tế.',
      kinh_nghiem:
        '5 năm kinh nghiệm tư vấn dinh dưỡng cho người trưởng thành và trẻ em',
      hoc_vi: 'Thạc sĩ Dinh dưỡng',
      chung_chi:
        'Chứng chỉ Dinh dưỡng lâm sàng quốc tế, Chứng chỉ tư vấn giảm cân',
      gio_lam_viec: JSON.stringify({
        mon: [{ start: '08:00', end: '17:00' }],
        tue: [{ start: '08:00', end: '17:00' }],
        wed: [{ start: '08:00', end: '17:00' }],
        thu: [{ start: '08:00', end: '17:00' }],
        fri: [{ start: '08:00', end: '17:00' }],
        sat: [{ start: '08:00', end: '12:00' }],
      }),
      trang_thai: 'hoat_dong' as const,
      trang_thai_thanh_toan: 'thanh_cong' as const,
      ngay_thanh_toan: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      lan_thanh_toan: 1,
      diem_danh_gia_trung_binh: '4.7',
      so_luot_danh_gia: 23,
      ngay_duyet: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      tao_luc: activeProfile?.tao_luc ?? now,
      cap_nhat_luc: now,
    }),
  );
  console.log('Seeded/updated 1 active nutritionist profile');

  // Seed thêm 1 user đang chờ duyệt (A14 test)
  // Tạo user test mới thay vì thay đổi user@nutriwise.vn
  let pendingUser = await userRepo.findOne({
    where: { email: 'pending_nutri@nutriwise.vn' },
  });
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

  await userRepo.save(
    userRepo.create({
      ...pendingUser,
      vai_tro: 'chuyen_gia_dinh_duong',
      trang_thai: 'khong_hoat_dong',
      cap_nhat_luc: now,
    }),
  );

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

  const pendingProfile = await cgRepo.findOne({
    where: { tai_khoan_id: pendingUser.id },
  });
  await cgRepo.save(
    cgRepo.create({
      id: pendingProfile?.id,
      tai_khoan_id: pendingUser.id,
      chuyen_mon: 'Dinh dưỡng cho bệnh nhân tiểu đường',
      mo_ta:
        'Chuyên gia dinh dưỡng cho bệnh nhân tiểu đường type 2 và tim mạch.',
      kinh_nghiem: '3 năm kinh nghiệm tại bệnh viện',
      hoc_vi: 'Bác sĩ chuyên khoa 1',
      chung_chi: 'Chứng chỉ dinh dưỡng bệnh lý',
      trang_thai: 'cho_duyet' as const,
      trang_thai_thanh_toan: 'thanh_cong' as const,
      ngay_thanh_toan: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lan_thanh_toan: 1,
      tao_luc: pendingProfile?.tao_luc ?? now,
      cap_nhat_luc: now,
    }),
  );
  console.log(
    'Seeded/updated 1 pending nutritionist (pending_nutri@nutriwise.vn) for A14 test',
  );
}

async function seedGoiTuVan() {
  const cgRepo = AppDataSource.getRepository(ChuyenGiaDinhDuongEntity);
  const gtvRepo = AppDataSource.getRepository(GoiTuVanEntity);
  const now = new Date();

  const existing = await gtvRepo.count();
  if (existing > 0) {
    console.log(`Goi tu van already seeded (${existing} found)`);
    return;
  }

  const activeNutri = await cgRepo.findOne({
    where: { trang_thai: 'hoat_dong' as any },
  });
  if (!activeNutri) {
    console.log('No active nutritionist, skipping goi tu van');
    return;
  }

  await gtvRepo.save([
    {
      chuyen_gia_dinh_duong_id: activeNutri.id,
      ten: 'Tư vấn dinh dưỡng 30 phút',
      mo_ta:
        'Buổi tư vấn 1-1 trong 30 phút, phù hợp cho người mới bắt đầu hoặc có câu hỏi cụ thể về dinh dưỡng.',
      gia: '150000',
      thoi_luong_phut: 30,
      so_lan_dung_mien_phi: 0,
      trang_thai: 'dang_ban' as const,
      tao_luc: now,
      cap_nhat_luc: now,
    },
    {
      chuyen_gia_dinh_duong_id: activeNutri.id,
      ten: 'Tư vấn dinh dưỡng 60 phút',
      mo_ta:
        'Buổi tư vấn chuyên sâu 60 phút, bao gồm phân tích chế độ ăn hiện tại và lập kế hoạch dinh dưỡng cá nhân hóa.',
      gia: '250000',
      thoi_luong_phut: 60,
      so_lan_dung_mien_phi: 1,
      trang_thai: 'dang_ban' as const,
      tao_luc: now,
      cap_nhat_luc: now,
    },
    {
      chuyen_gia_dinh_duong_id: activeNutri.id,
      ten: 'Gói tư vấn 5 buổi',
      mo_ta:
        'Gói 5 buổi tư vấn trong 1 tháng, theo dõi và điều chỉnh chế độ ăn liên tục.',
      gia: '1000000',
      thoi_luong_phut: 60,
      so_lan_dung_mien_phi: 2,
      trang_thai: 'dang_ban' as const,
      tao_luc: now,
      cap_nhat_luc: now,
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
  if (existing > 0) {
    console.log(`Lich hen already seeded (${existing} found)`);
    return;
  }

  const activeNutri = await cgRepo.findOne({
    where: { trang_thai: 'hoat_dong' as any },
  });
  const user = await userRepo.findOne({
    where: { email: 'user@nutriwise.vn' },
  });
  const gtvList = await gtvRepo.find({
    where: { trang_thai: 'dang_ban' as any },
  });

  if (!activeNutri || !user || gtvList.length === 0) {
    console.log('Missing data for lich hen seed, skipping');
    return;
  }

  const generateMa = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
    const thTienLuc =
      lh.thanhToanLuc !== null
        ? new Date(Date.now() + lh.thanhToanLuc * 24 * 60 * 60 * 1000)
        : null;

    const savedLh = await lhRepo.save(
      lhRepo.create({
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
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );

    await ttRepo.save(
      ttRepo.create({
        lich_hen_id: savedLh.id,
        tai_khoan_id: user.id,
        ma_giao_dich: generateMa('TT'),
        phuong_thuc: 'vnpay',
        so_tien: lh.soTien,
        trang_thai: lh.thanhToanTrangThai,
        thanh_toan_luc: thTienLuc ?? now,
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );
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
  if (existing > 0) {
    console.log(`Danh gia already seeded (${existing} found)`);
    return;
  }

  const activeNutri = await cgRepo.findOne({
    where: { trang_thai: 'hoat_dong' as any },
  });
  if (!activeNutri) {
    console.log('No active nutritionist, skipping danh gia');
    return;
  }

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

  const existingReviews = await dgRepo.find({
    select: ['lich_hen_id'],
    where: {
      lich_hen_id: In(completedBookings.map((booking) => booking.id)),
    },
  });
  const reviewedBookingIds = new Set(
    existingReviews.map((review) => String(review.lich_hen_id)),
  );
  const availableBookings = completedBookings.filter(
    (booking) => !reviewedBookingIds.has(String(booking.id)),
  );

  if (availableBookings.length === 0) {
    console.log('Completed bookings already have danh gia, skipping');
    return;
  }

  const reviewTemplates = [
    {
      diem: 5,
      noi_dung:
        'Chuyên gia tư vấn rất nhiệt tình, đưa ra lời khuyên cụ thể và phù hợp với tình trạng sức khỏe của tôi. Đã giảm được 2kg sau 2 tuần.',
      offsetDays: 5,
    },
    {
      diem: 4,
      noi_dung:
        'Buổi tư vấn khá tốt, chuyên gia có kiến thức chuyên sâu. Tuy nhiên thời gian hơi ngắn.',
      offsetDays: 3,
    },
    {
      diem: 5,
      noi_dung:
        'Rất hài lòng! Chế độ ăn được cá nhân hóa, dễ thực hiện và hiệu quả.',
      offsetDays: 1,
    },
  ];

  const danhGiaData = availableBookings
    .slice(0, reviewTemplates.length)
    .map((booking, index) => {
      const template = reviewTemplates[index];
      return {
        diem: template.diem,
        noi_dung: template.noi_dung,
        tai_khoan_id: booking.tai_khoan_id,
        lich_hen_id: booking.id,
        ngay_tao: new Date(Date.now() - template.offsetDays * 24 * 60 * 60 * 1000),
      };
    });

  await dgRepo.upsert(
    danhGiaData.map((dg) => ({
      lich_hen_id: dg.lich_hen_id,
      tai_khoan_id: dg.tai_khoan_id,
      chuyen_gia_dinh_duong_id: activeNutri.id,
      diem: dg.diem,
      noi_dung: dg.noi_dung,
      tra_loi: null,
      tra_loi_luc: null,
      tao_luc: dg.ngay_tao,
      cap_nhat_luc: dg.ngay_tao,
    })),
    ['lich_hen_id'],
  );
  console.log(`Seeded ${danhGiaData.length} danh gia`);
}

async function seedSystemRevenueFixtures() {
  const userRepo = AppDataSource.getRepository(TaiKhoanEntity);
  const profileRepo = AppDataSource.getRepository(HoSoEntity);
  const cgRepo = AppDataSource.getRepository(ChuyenGiaDinhDuongEntity);
  const lhRepo = AppDataSource.getRepository(LichHenEntity);
  const ttRepo = AppDataSource.getRepository(ThanhToanTuVanEntity);
  const allocationRepo = AppDataSource.getRepository(PhanBoDoanhThuBookingEntity);

  const now = new Date();
  const registrationFee = Number(
    process.env.NUTRITIONIST_REGISTRATION_FEE ?? 500000,
  );

  const registrationProfiles = [
    {
      email: 'revenue.nutri.1@nutriwise.vn',
      hoTen: 'Revenue Nutritionist 1',
      paymentOffsetDays: 120,
      approvalOffsetDays: 118,
    },
    {
      email: 'revenue.nutri.2@nutriwise.vn',
      hoTen: 'Revenue Nutritionist 2',
      paymentOffsetDays: 85,
      approvalOffsetDays: 83,
    },
    {
      email: 'revenue.nutri.3@nutriwise.vn',
      hoTen: 'Revenue Nutritionist 3',
      paymentOffsetDays: 32,
      approvalOffsetDays: 31,
    },
  ];

  for (const item of registrationProfiles) {
    let user = await userRepo.findOne({ where: { email: item.email } });
    if (!user) {
      const passwordHash = await hashPassword(getSeedDefaultPassword());
      user = await userRepo.save(
        userRepo.create({
          email: item.email,
          ho_ten: item.hoTen,
          vai_tro: 'chuyen_gia_dinh_duong',
          trang_thai: 'hoat_dong',
          mat_khau_ma_hoa: passwordHash,
          ma_dat_lai_mat_khau: null,
          het_han_ma_dat_lai: null,
          dang_nhap_cuoi_luc: null,
          tao_luc: now,
          cap_nhat_luc: now,
          xoa_luc: null,
        }),
      );
    }

    await profileRepo.upsert(
      {
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
      },
      ['tai_khoan_id'],
    );

    const existingCg = await cgRepo.findOne({
      where: { tai_khoan_id: user.id },
    });
    const paidAt = new Date(
      Date.now() - item.paymentOffsetDays * 24 * 60 * 60 * 1000,
    );
    const approvedAt = new Date(
      Date.now() - item.approvalOffsetDays * 24 * 60 * 60 * 1000,
    );

    await cgRepo.save(
      cgRepo.create({
        id: existingCg?.id,
        tai_khoan_id: user.id,
        chuyen_mon: 'Dinh dưỡng tổng quát',
        mo_ta: 'Hồ sơ demo cho báo cáo doanh thu hệ thống.',
        kinh_nghiem: '2 năm tư vấn dinh dưỡng',
        hoc_vi: 'Cử nhân Dinh dưỡng',
        chung_chi: 'Chứng chỉ tư vấn dinh dưỡng',
        gio_lam_viec: null,
        anh_dai_dien_url: null,
        trang_thai: 'hoat_dong',
        trang_thai_thanh_toan: 'thanh_cong',
        ngay_thanh_toan: paidAt,
        lan_thanh_toan: 1,
        ngay_duyet: approvedAt,
        tao_luc: existingCg?.tao_luc ?? paidAt,
        cap_nhat_luc: now,
      }),
    );
  }

  const completedBookings = await lhRepo.find({
    where: { trang_thai: 'hoan_thanh' as any },
    order: { id: 'ASC' },
  });

  if (completedBookings.length === 0) {
    console.log('No completed bookings, skipped system revenue allocation seed');
    return;
  }

  const bookingIds = completedBookings.map((item) => item.id);
  const payments = await ttRepo.find({
    where: {
      lich_hen_id: In(bookingIds),
      trang_thai: 'thanh_cong' as any,
    },
    order: { tao_luc: 'DESC' },
  });

  const paymentByBookingId = new Map<number, ThanhToanTuVanEntity>();
  for (const payment of payments) {
    if (!paymentByBookingId.has(payment.lich_hen_id)) {
      paymentByBookingId.set(payment.lich_hen_id, payment);
    }
  }

  let seededAllocationCount = 0;
  for (const booking of completedBookings) {
    const payment = paymentByBookingId.get(booking.id);
    if (!payment) continue;

    const grossAmount = Number(payment.so_tien ?? 0);
    const commissionAmount = Math.round(grossAmount * 0.05 * 100) / 100;
    const nutritionistAmount =
      Math.round((grossAmount - commissionAmount) * 100) / 100;
    const allocatedAt = payment.thanh_toan_luc ?? booking.cap_nhat_luc ?? now;

    await allocationRepo.upsert(
      {
        lich_hen_id: booking.id,
        thanh_toan_tu_van_id: payment.id,
        chuyen_gia_dinh_duong_id: booking.chuyen_gia_dinh_duong_id,
        so_tien_goc: grossAmount.toFixed(2),
        ty_le_hoa_hong: '5.00',
        so_tien_hoa_hong: commissionAmount.toFixed(2),
        so_tien_chuyen_gia_nhan: nutritionistAmount.toFixed(2),
        trang_thai: 'da_ghi_nhan',
        tao_luc: allocatedAt,
        cap_nhat_luc: allocatedAt,
      },
      ['lich_hen_id'],
    );
    seededAllocationCount += 1;
  }

  console.log(
    `Seeded system revenue fixtures: registration_fee=${registrationFee}, booking_allocations=${seededAllocationCount}`,
  );
}

function getBulkIntEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function pickRandomItem<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function pickUniqueItems<T>(items: T[], count: number): T[] {
  const copied = [...items];
  const result: T[] = [];
  while (copied.length > 0 && result.length < count) {
    const idx = randomInt(0, copied.length - 1);
    result.push(copied[idx]);
    copied.splice(idx, 1);
  }
  return result;
}

async function seedBulkData() {
  const enabledRaw = (process.env.SEED_BULK ?? '').toLowerCase();
  const enabled = ['1', 'true', 'yes', 'on'].includes(enabledRaw);
  if (!enabled) return;

  const userCount = getBulkIntEnv('SEED_BULK_USERS', 120);
  const daysPerUser = getBulkIntEnv('SEED_BULK_DAYS', 14);
  const mealsPerDay = Math.max(
    1,
    Math.min(4, getBulkIntEnv('SEED_BULK_MEALS_PER_DAY', 3)),
  );
  const plansPerUser = Math.max(
    1,
    getBulkIntEnv('SEED_BULK_PLANS_PER_USER', 3),
  );

  if (userCount <= 0) {
    console.log(
      'SEED_BULK enabled but SEED_BULK_USERS <= 0, skipping bulk seed',
    );
    return;
  }

  const userRepo = AppDataSource.getRepository(TaiKhoanEntity);
  const profileRepo = AppDataSource.getRepository(HoSoEntity);
  const goalRepo = AppDataSource.getRepository(MucTieuEntity);
  const metricRepo = AppDataSource.getRepository(ChiSoSucKhoeEntity);
  const assessmentRepo = AppDataSource.getRepository(DanhGiaSucKhoeEntity);
  const foodRepo = AppDataSource.getRepository(ThucPhamEntity);
  const mealLogRepo = AppDataSource.getRepository(NhatKyBuaAnEntity);
  const mealLogDetailRepo = AppDataSource.getRepository(
    ChiTietNhatKyBuaAnEntity,
  );
  const summaryRepo = AppDataSource.getRepository(TongHopDinhDuongNgayEntity);
  const mealPlanRepo = AppDataSource.getRepository(KeHoachAnEntity);
  const mealPlanDetailRepo = AppDataSource.getRepository(
    ChiTietKeHoachAnEntity,
  );
  const aiSessionRepo = AppDataSource.getRepository(PhienTuVanAiEntity);
  const recommendationRepo = AppDataSource.getRepository(KhuyenNghiAiEntity);
  const subscriptionRepo = AppDataSource.getRepository(DangKyGoiDichVuEntity);
  const packageRepo = AppDataSource.getRepository(GoiDichVuEntity);
  const nutritionistRepo = AppDataSource.getRepository(
    ChuyenGiaDinhDuongEntity,
  );
  const consultationPkgRepo = AppDataSource.getRepository(GoiTuVanEntity);
  const bookingRepo = AppDataSource.getRepository(LichHenEntity);
  const consultationPaymentRepo =
    AppDataSource.getRepository(ThanhToanTuVanEntity);
  const reviewRepo = AppDataSource.getRepository(DanhGiaEntity);
  const notificationRepo = AppDataSource.getRepository(ThongBaoEntity);

  const now = new Date();
  const seedTag = process.env.SEED_BULK_TAG?.trim() || `${Date.now()}`;
  const defaultPassword = getSeedDefaultPassword();
  const passwordHash = await hashPassword(defaultPassword);
  const goalTypes: Array<'giam_can' | 'tang_can' | 'giu_can'> = [
    'giam_can',
    'tang_can',
    'giu_can',
  ];
  const subscriptionSources: Array<
    'nguoi_dung_tu_nang_cap' | 'quan_tri_cap' | 'khuyen_mai'
  > = ['nguoi_dung_tu_nang_cap', 'quan_tri_cap', 'khuyen_mai'];

  const [foods, activePackage, nutritionists, consultationPackages] =
    await Promise.all([
      foodRepo.find({
        where: { xoa_luc: IsNull(), da_xac_minh: true },
        take: 300,
        order: { id: 'ASC' },
      }),
      packageRepo.findOne({
        where: { trang_thai: 'dang_kinh_doanh' },
        order: { id: 'ASC' },
      }),
      nutritionistRepo.find({
        where: { trang_thai: 'hoat_dong' },
        take: 20,
        order: { id: 'ASC' },
      }),
      consultationPkgRepo.find({
        where: { trang_thai: 'dang_ban' },
        take: 50,
        order: { id: 'ASC' },
      }),
    ]);

  if (foods.length < 3) {
    console.log('Bulk seed skipped: need at least 3 verified foods');
    return;
  }

  const usersToCreate = Array.from({ length: userCount }, (_, idx) => {
    const serial = `${seedTag}-${String(idx + 1).padStart(5, '0')}`;
    return userRepo.create({
      email: `loadtest.user.${serial}@nutriwise.vn`,
      ho_ten: `Load Test User ${idx + 1}`,
      vai_tro: 'nguoi_dung',
      trang_thai: 'hoat_dong',
      mat_khau_ma_hoa: passwordHash,
      ma_dat_lai_mat_khau: null,
      het_han_ma_dat_lai: null,
      dang_nhap_cuoi_luc: null,
      tao_luc: now,
      cap_nhat_luc: now,
      xoa_luc: null,
    });
  });

  const createdUsers = await userRepo.save(usersToCreate, { chunk: 100 });
  console.log(`Bulk seed: created ${createdUsers.length} users`);

  await profileRepo.save(
    createdUsers.map((user) => ({
        tai_khoan_id: user.id,
        gioi_tinh: pickRandomItem(['nam', 'nu', 'khac']),
        ngay_sinh: new Date(
          Date.UTC(randomInt(1985, 2006), randomInt(0, 11), randomInt(1, 28)),
        )
          .toISOString()
          .slice(0, 10),
        chieu_cao_cm: randomBetween(150, 185).toFixed(2),
        can_nang_hien_tai_kg: randomBetween(48, 95).toFixed(2),
        muc_do_van_dong: pickRandomItem([
          'it_van_dong',
          'van_dong_nhe',
          'van_dong_vua',
          'nang_dong',
          'rat_nang_dong',
        ]),
        che_do_an_uu_tien: pickUniqueItems(
          ['high_protein', 'it_duong', 'eat_clean', 'can_bang', 'low_carb'],
          randomInt(1, 2),
        ),
        di_ung: Math.random() < 0.2 ? ['hai_san_vo_cung'] : [],
        thuc_pham_khong_thich: Math.random() < 0.3 ? ['noi_tang'] : [],
        anh_dai_dien_url: null,
        tao_luc: now,
        cap_nhat_luc: now,
      })),
    { chunk: 100 },
  );

  const mealTypes: Array<'bua_sang' | 'bua_trua' | 'bua_toi' | 'bua_phu'> = [
    'bua_sang',
    'bua_trua',
    'bua_toi',
    'bua_phu',
  ];

  for (let i = 0; i < createdUsers.length; i += 1) {
    const user = createdUsers[i];
    const userNow = new Date(now.getTime() + i * 1000);
    const startArchived = new Date(
      Date.now() - (120 + (i % 30)) * 24 * 60 * 60 * 1000,
    );
    const endArchived = new Date(
      startArchived.getTime() + 40 * 24 * 60 * 60 * 1000,
    );
    const startActive = new Date(endArchived.getTime() + 24 * 60 * 60 * 1000);
    const endActive = new Date(
      startActive.getTime() + 90 * 24 * 60 * 60 * 1000,
    );

    const archivedGoal = await goalRepo.save({
        tai_khoan_id: user.id,
        loai_muc_tieu: pickRandomItem(goalTypes),
        trang_thai: 'luu_tru',
        can_nang_bat_dau_kg: randomBetween(55, 90).toFixed(2),
        can_nang_muc_tieu_kg: randomBetween(52, 88).toFixed(2),
        muc_tieu_calories_ngay: randomBetween(1700, 2500).toFixed(2),
        muc_tieu_protein_g: randomBetween(90, 180).toFixed(2),
        muc_tieu_carb_g: randomBetween(120, 280).toFixed(2),
        muc_tieu_fat_g: randomBetween(40, 90).toFixed(2),
        ngay_bat_dau: startArchived.toISOString().slice(0, 10),
        ngay_muc_tieu: endArchived.toISOString().slice(0, 10),
        tao_luc: userNow,
        cap_nhat_luc: userNow,
      });

    const activeGoal = await goalRepo.save({
        tai_khoan_id: user.id,
        loai_muc_tieu: pickRandomItem(goalTypes),
        trang_thai: 'dang_ap_dung',
        can_nang_bat_dau_kg: randomBetween(55, 90).toFixed(2),
        can_nang_muc_tieu_kg: randomBetween(52, 88).toFixed(2),
        muc_tieu_calories_ngay: randomBetween(1700, 2500).toFixed(2),
        muc_tieu_protein_g: randomBetween(90, 180).toFixed(2),
        muc_tieu_carb_g: randomBetween(120, 280).toFixed(2),
        muc_tieu_fat_g: randomBetween(40, 90).toFixed(2),
        ngay_bat_dau: startActive.toISOString().slice(0, 10),
        ngay_muc_tieu: endActive.toISOString().slice(0, 10),
        tao_luc: userNow,
        cap_nhat_luc: userNow,
      });

    const metrics = await metricRepo.save(
      Array.from({ length: 4 }, (_, idx) => {
        const measuredAt = new Date(
          Date.now() - (idx + 1) * 15 * 24 * 60 * 60 * 1000 - i * 1000,
        );
        return metricRepo.create({
          tai_khoan_id: user.id,
          do_luc: measuredAt,
          can_nang_kg: randomBetween(50, 95).toFixed(2),
          chieu_cao_cm: randomBetween(150, 185).toFixed(2),
          vong_eo_cm: randomBetween(70, 100).toFixed(2),
          vong_mong_cm: randomBetween(85, 110).toFixed(2),
          huyet_ap_tam_thu: randomInt(105, 132),
          huyet_ap_tam_truong: randomInt(65, 90),
          duong_huyet: randomBetween(4.5, 6.2).toFixed(2),
          ghi_chu: `Bulk metric ${idx + 1}`,
          tao_luc: measuredAt,
          cap_nhat_luc: measuredAt,
        });
      }),
      { chunk: 50 },
    );

    const latestMetric = metrics[0] ?? null;
    await assessmentRepo.save(
      assessmentRepo.create({
        tai_khoan_id: user.id,
        chi_so_suc_khoe_id: latestMetric?.id ?? null,
        muc_tieu_id: activeGoal.id,
        bmi: randomBetween(18.5, 29.5).toFixed(2),
        phan_loai_bmi: pickRandomItem([
          'binh_thuong',
          'thua_can',
          'beo_phi_do_1',
        ]),
        bmr: randomBetween(1300, 2200).toFixed(2),
        tdee: randomBetween(1800, 3200).toFixed(2),
        calories_khuyen_nghi: randomBetween(1700, 2600).toFixed(2),
        protein_khuyen_nghi_g: randomBetween(90, 180).toFixed(2),
        carb_khuyen_nghi_g: randomBetween(120, 280).toFixed(2),
        fat_khuyen_nghi_g: randomBetween(40, 90).toFixed(2),
        tom_tat: `Danh gia suc khoe bulk user #${user.id}`,
        tao_luc: userNow,
        cap_nhat_luc: userNow,
      }),
    );

    if (activePackage) {
      const subscriptionStart = new Date(
        Date.now() - randomInt(0, 15) * 24 * 60 * 60 * 1000,
      );
      const subscriptionEnd = new Date(
        subscriptionStart.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
      await subscriptionRepo.save(
        {
          tai_khoan_id: user.id,
          goi_dich_vu_id: activePackage.id,
          ma_dang_ky: `BULK-SUB-${seedTag}-${user.id}`,
          trang_thai: 'dang_hoat_dong',
          ngay_bat_dau: subscriptionStart,
          ngay_het_han: subscriptionEnd,
          tu_dong_gia_han: Boolean(i % 2),
          nguon_dang_ky: pickRandomItem(subscriptionSources),
          ghi_chu: 'Bulk seeded subscription',
          tao_luc: userNow,
          cap_nhat_luc: userNow,
        },
      );
    }

    for (let p = 0; p < plansPerUser; p += 1) {
      const applyDate = new Date(Date.now() + (p + 1) * 24 * 60 * 60 * 1000);
      const plan = await mealPlanRepo.save(
        mealPlanRepo.create({
          tai_khoan_id: user.id,
          loai_nguon: pickRandomItem(['khuyen_nghi_ai', 'thuc_don_mau']),
          nguon_id: null,
          tieu_de: `Bulk meal plan ${p + 1} - user ${user.id}`,
          mo_ta: 'Generated bulk meal plan',
          ngay_ap_dung: applyDate.toISOString().slice(0, 10),
          trang_thai: p === 0 ? 'dang_ap_dung' : 'ban_nhap',
          tong_calories: randomBetween(1700, 2300).toFixed(2),
          tong_protein_g: randomBetween(90, 170).toFixed(2),
          tong_carb_g: randomBetween(140, 260).toFixed(2),
          tong_fat_g: randomBetween(40, 80).toFixed(2),
          tao_luc: userNow,
          cap_nhat_luc: userNow,
        }),
      );

      const planDetails: ChiTietKeHoachAnEntity[] = [];
      let order = 1;
      for (const mealType of mealTypes.slice(0, mealsPerDay)) {
        const selectedFoods = pickUniqueItems(foods, randomInt(1, 2));
        for (const food of selectedFoods) {
          const qty = randomBetween(80, 260);
          const ratio = qty / 100;
          planDetails.push(
            mealPlanDetailRepo.create({
              ke_hoach_an_id: plan.id,
              loai_bua_an: mealType,
              cong_thuc_id: null,
              thuc_pham_id: food.id,
              so_luong: qty.toFixed(2),
              don_vi: food.don_vi_khau_phan ?? 'g',
              calories: (Number(food.calories_100g ?? 0) * ratio).toFixed(2),
              protein_g: (Number(food.protein_100g ?? 0) * ratio).toFixed(2),
              carb_g: (Number(food.carb_100g ?? 0) * ratio).toFixed(2),
              fat_g: (Number(food.fat_100g ?? 0) * ratio).toFixed(2),
              ghi_chu: null,
              thu_tu: order++,
              tao_luc: userNow,
              cap_nhat_luc: userNow,
            }),
          );
        }
      }
      if (planDetails.length > 0) {
        await mealPlanDetailRepo.save(planDetails, { chunk: 100 });
      }
    }

    for (let d = 0; d < daysPerUser; d += 1) {
      const dayDate = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      const day = dayDate.toISOString().slice(0, 10);
      let dayCalories = 0;
      let dayProtein = 0;
      let dayCarb = 0;
      let dayFat = 0;
      let mealsLogged = 0;

      for (const mealType of mealTypes.slice(0, mealsPerDay)) {
        const log = await mealLogRepo.save(
          mealLogRepo.create({
            tai_khoan_id: user.id,
            ngay_ghi: day,
            loai_bua_an: mealType,
            ghi_chu: `Bulk meal ${mealType}`,
            tao_luc: userNow,
            cap_nhat_luc: userNow,
          }),
        );

        const selectedFoods = pickUniqueItems(foods, randomInt(1, 3));
        const details = selectedFoods.map((food) => {
          const qty = randomBetween(70, 280);
          const ratio = qty / 100;
          const calories = Number(food.calories_100g ?? 0) * ratio;
          const protein = Number(food.protein_100g ?? 0) * ratio;
          const carb = Number(food.carb_100g ?? 0) * ratio;
          const fat = Number(food.fat_100g ?? 0) * ratio;
          const fiber = Number(food.chat_xo_100g ?? 0) * ratio;
          const sodium = Number(food.natri_100g ?? 0) * ratio;

          dayCalories += calories;
          dayProtein += protein;
          dayCarb += carb;
          dayFat += fat;

          return mealLogDetailRepo.create({
            nhat_ky_bua_an_id: log.id,
            loai_nguon: 'thuc_pham',
            nguon_id: food.id,
            cong_thuc_id: null,
            thuc_pham_id: food.id,
            so_luong: qty.toFixed(2),
            don_vi: food.don_vi_khau_phan ?? 'g',
            calories: calories.toFixed(2),
            protein_g: protein.toFixed(2),
            carb_g: carb.toFixed(2),
            fat_g: fat.toFixed(2),
            chat_xo_g: fiber.toFixed(2),
            natri_mg: sodium.toFixed(2),
            du_lieu_chup_lai: {
              ten: food.ten,
              khau_phan: qty,
              don_vi: food.don_vi_khau_phan ?? 'g',
              loai_nguon: 'thuc_pham',
            },
            tao_luc: userNow,
            cap_nhat_luc: userNow,
          });
        });

        await mealLogDetailRepo.save(details, { chunk: 100 });
        mealsLogged += 1;
      }

      await summaryRepo.save(
        summaryRepo.create({
          tai_khoan_id: user.id,
          ngay: day,
          tong_calories: dayCalories.toFixed(2),
          tong_protein_g: dayProtein.toFixed(2),
          tong_carb_g: dayCarb.toFixed(2),
          tong_fat_g: dayFat.toFixed(2),
          so_bua_da_ghi: mealsLogged,
          tao_luc: userNow,
          cap_nhat_luc: userNow,
        }),
      );
    }

    const aiSession = await aiSessionRepo.save(
      aiSessionRepo.create({
        tai_khoan_id: user.id,
        tieu_de: `Bulk AI session for user ${user.id}`,
        trang_thai: 'da_dong',
        tin_nhan: JSON.stringify([
          { role: 'user', content: 'Mình cần kế hoạch ăn hôm nay.' },
          {
            role: 'assistant',
            content: 'Đây là gợi ý bữa ăn phù hợp mục tiêu.',
          },
        ]),
        ngu_canh_chup_lai: {
          seed: 'bulk',
          userId: user.id,
        },
        mo_hinh_cuoi: 'gpt-5.2',
        tong_token_cuoi: randomInt(300, 1500),
        loi_cuoi: null,
        tao_luc: userNow,
        cap_nhat_luc: userNow,
      }),
    );

    await recommendationRepo.save(
      [
        recommendationRepo.create({
          tai_khoan_id: user.id,
          phien_tu_van_ai_id: aiSession.id,
          trang_thai: 'da_chap_nhan',
          loai_khuyen_nghi: 'nutrition',
          ngay_muc_tieu: now.toISOString().slice(0, 10),
          muc_tieu_calories: randomBetween(1700, 2400).toFixed(2),
          muc_tieu_protein_g: randomBetween(90, 170).toFixed(2),
          muc_tieu_carb_g: randomBetween(140, 260).toFixed(2),
          muc_tieu_fat_g: randomBetween(40, 80).toFixed(2),
          canh_bao: ['Du lieu bulk seed - chi de test'],
          ly_giai: 'Khuyen nghi nutrition duoc tao tu bulk seed',
          du_lieu_khuyen_nghi: {
            source: 'bulk',
            foods_uu_tien: pickUniqueItems(foods, 2).map((f) => ({
              id: f.id,
              ten: f.ten,
            })),
          },
          ke_hoach_an_da_ap_dung_id: null,
          tao_luc: userNow,
          cap_nhat_luc: userNow,
        }),
        recommendationRepo.create({
          tai_khoan_id: user.id,
          phien_tu_van_ai_id: aiSession.id,
          trang_thai: 'cho_xu_ly',
          loai_khuyen_nghi: 'meal_plan_daily',
          ngay_muc_tieu: new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          muc_tieu_calories: randomBetween(1700, 2400).toFixed(2),
          muc_tieu_protein_g: randomBetween(90, 170).toFixed(2),
          muc_tieu_carb_g: randomBetween(140, 260).toFixed(2),
          muc_tieu_fat_g: randomBetween(40, 80).toFixed(2),
          canh_bao: [],
          ly_giai: 'Khuyen nghi meal plan duoc tao tu bulk seed',
          du_lieu_khuyen_nghi: {
            source: 'bulk',
            chi_tiet: pickUniqueItems(foods, 3).map((f, idx) => ({
              thu_tu: idx + 1,
              loai_bua_an: mealTypes[idx % mealTypes.length],
              thuc_pham_id: f.id,
              ten_mon: f.ten,
            })),
          },
          ke_hoach_an_da_ap_dung_id: null,
          tao_luc: userNow,
          cap_nhat_luc: userNow,
        }),
      ],
      { chunk: 50 },
    );

    await notificationRepo.save(
      [
        notificationRepo.create({
          tai_khoan_id: user.id,
          nguoi_gui_id: null,
          loai: 'he_thong',
          tieu_de: 'Du lieu bulk seed',
          noi_dung: 'Thong bao demo cho user bulk',
          trang_thai: 'chua_doc',
          duong_dan_hanh_dong: '/nutrition/dashboard',
          tao_luc: userNow,
          doc_luc: null,
          cap_nhat_luc: userNow,
        }),
        notificationRepo.create({
          tai_khoan_id: user.id,
          nguoi_gui_id: null,
          loai: 'khuyen_nghi_ai',
          tieu_de: 'Co khuyen nghi moi',
          noi_dung: 'He thong da tao khuyen nghi moi cho ban',
          trang_thai: 'chua_doc',
          duong_dan_hanh_dong: '/nutrition/ai-advisor',
          tao_luc: userNow,
          doc_luc: null,
          cap_nhat_luc: userNow,
        }),
      ],
      { chunk: 50 },
    );

    if (nutritionists.length > 0 && consultationPackages.length > 0) {
      const nutritionist = pickRandomItem(nutritionists);
      const pkg = pickRandomItem(consultationPackages);
      const bookingDate = new Date(
        Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000,
      );
      const booking = await bookingRepo.save(
        bookingRepo.create({
          chuyen_gia_dinh_duong_id: nutritionist.id,
          tai_khoan_id: user.id,
          goi_tu_van_id: pkg.id,
          ma_lich_hen: `BULK-LH-${seedTag}-${user.id}`,
          muc_dich: 'Tu van dinh duong bulk',
          ngay_hen: bookingDate.toISOString().slice(0, 10),
          gio_bat_dau: '09:00:00',
          gio_ket_thuc: '09:45:00',
          dia_diem: 'Online',
          trang_thai: 'hoan_thanh',
          ly_do_huy: null,
          huy_boi: null,
          huy_luc: null,
          ghi_chu_nutritionist: 'Bulk booking note',
          tao_luc: userNow,
          cap_nhat_luc: userNow,
        }),
      );

      await consultationPaymentRepo.save(
        consultationPaymentRepo.create({
          lich_hen_id: booking.id,
          tai_khoan_id: user.id,
          ma_giao_dich: `BULK-TT-${seedTag}-${user.id}`,
          phuong_thuc: 'vnpay',
          so_tien: randomBetween(120000, 450000).toFixed(2),
          trang_thai: 'thanh_cong',
          thanh_toan_luc: bookingDate,
          du_lieu_thanh_toan: { source: 'bulk-seed' },
          xac_nhan_boi: null,
          xac_nhan_luc: null,
          tao_luc: userNow,
          cap_nhat_luc: userNow,
        }),
      );

      await reviewRepo.save(
        reviewRepo.create({
          lich_hen_id: booking.id,
          tai_khoan_id: user.id,
          chuyen_gia_dinh_duong_id: nutritionist.id,
          diem: randomInt(3, 5),
          noi_dung: 'Danh gia bulk cho buoi tu van.',
          tra_loi: null,
          tra_loi_luc: null,
          tao_luc: userNow,
          cap_nhat_luc: userNow,
        }),
      );
    }

    if ((i + 1) % 10 === 0 || i + 1 === createdUsers.length) {
      console.log(
        `Bulk seed progress: ${i + 1}/${createdUsers.length} users processed`,
      );
    }

    // keep archivedGoal used for explicit seeding reference to avoid accidental regression
    void archivedGoal;
  }

  console.log(
    `Bulk seed completed: users=${userCount}, daysPerUser=${daysPerUser}, mealsPerDay=${mealsPerDay}, plansPerUser=${plansPerUser}`,
  );
}

async function run() {
  await AppDataSource.initialize();

  try {
    await seedUsers();
    await seedUserHealthData();
    await seedFoodCatalog();
    await seedBulkFoodCatalog();
    await seedUserNutritionTrackingAndRecommendations();
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
    await seedSystemRevenueFixtures();
    await seedBulkData();
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
