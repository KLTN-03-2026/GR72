import 'dotenv/config';
import { hash } from 'bcrypt';
import { NhomThucPhamEntity } from '../../Api/Admin/Food/entities/nhom-thuc-pham.entity';
import { ThucPhamEntity } from '../../Api/Admin/Food/entities/thuc-pham.entity';
import AppDataSource from '../data-source';
import { HoSoEntity } from '../../Api/Admin/User/entities/ho-so.entity';
import { TaiKhoanEntity } from '../../Api/Admin/User/entities/tai-khoan.entity';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
  return hash(password, saltRounds);
}

async function seedUsers() {
  const userRepository = AppDataSource.getRepository(TaiKhoanEntity);
  const profileRepository = AppDataSource.getRepository(HoSoEntity);
  const now = new Date();
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD ?? 'password123';
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

async function run() {
  await AppDataSource.initialize();

  try {
    await seedUsers();
    await seedFoodCatalog();
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
