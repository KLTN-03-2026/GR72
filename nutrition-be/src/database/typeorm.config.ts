import { join } from 'node:path';
import { TaiKhoanEntity } from '../Api/User/entities/tai-khoan.entity';
import { HoSoEntity } from '../Api/User/entities/ho-so.entity';
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
    entities: [TaiKhoanEntity, HoSoEntity],
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    synchronize: false,
    autoLoadEntities: true,
  };
}
