import { DataSource } from 'typeorm';
import type { SeedRow, TableSeeder, SeedValue } from './types';

function normalizeValue(value: SeedValue) {
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
}

export async function insertRows(dataSource: DataSource, seeder: TableSeeder) {
  if (seeder.rows.length === 0) return;

  const columns = Object.keys(seeder.rows[0]);
  const placeholders = columns.map(() => '?').join(', ');
  const columnSql = columns.map((column) => `\`${column}\``).join(', ');
  const sql = `INSERT INTO \`${seeder.table}\` (${columnSql}) VALUES (${placeholders})`;

  for (const row of seeder.rows) {
    const values = columns.map((column) => normalizeValue(row[column]));
    await dataSource.query(sql, values);
  }
}

export function createRows(count: number, factory: (index: number) => SeedRow) {
  return Array.from({ length: count }, (_, index) => factory(index + 1));
}
