import { join } from 'node:path';
import { NhomThucPhamEntity } from '../Api/Admin/Food/entities/nhom-thuc-pham.entity';
import { ThucPhamEntity } from '../Api/Admin/Food/entities/thuc-pham.entity';
import { TaiKhoanEntity } from '../Api/Admin/User/entities/tai-khoan.entity';
import { HoSoEntity } from '../Api/Admin/User/entities/ho-so.entity';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';

export function getTypeOrmConfig(): TypeOrmModuleOptions & DataSourceOptions {
  return {
    type: 'mysql',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? 'do_an',
    entities: [TaiKhoanEntity, HoSoEntity, NhomThucPhamEntity, ThucPhamEntity],
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    synchronize: false,
    autoLoadEntities: true,
  };
}
