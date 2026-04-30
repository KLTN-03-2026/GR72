import 'dotenv/config';
import dataSource from '../data-source';
import { insertRows } from './helpers';
import { seeders } from './tables';

async function resetTables() {
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const seeder of [...seeders].reverse()) {
    await dataSource.query(`TRUNCATE TABLE \`${seeder.table}\``);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function bootstrap() {
  await dataSource.initialize();

  try {
    await resetTables();

    for (const seeder of seeders) {
      await insertRows(dataSource, seeder);
      console.log(`Seeded ${seeder.rows.length} rows into ${seeder.table}`);
    }

    console.log('Seed completed successfully.');
  } finally {
    await dataSource.destroy();
  }
}

void bootstrap().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
