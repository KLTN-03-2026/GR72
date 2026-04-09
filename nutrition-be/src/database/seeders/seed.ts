import 'dotenv/config';
import { hash } from 'bcrypt';
import AppDataSource from '../data-source';
import { HoSoEntity } from '../../Api/User/entities/ho-so.entity';
import { TaiKhoanEntity } from '../../Api/User/entities/tai-khoan.entity';

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

async function run() {
  await AppDataSource.initialize();

  try {
    await seedUsers();
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
