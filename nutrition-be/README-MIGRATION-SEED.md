# Migration va Seeder

## 1. Cai dat bien moi truong

Copy `.env.example` thanh `.env` va cap nhat thong tin MySQL.

## 2. Chay migration

```bash
npm run migration:run
```

## 3. Chay seed

```bash
npm run seed
```

Hoac chay ca hai buoc:

```bash
npm run db:setup
```

## 4. Tai khoan mac dinh duoc seed

- `user@nutriwise.vn`
- `nutritionist@nutriwise.vn`
- `admin@nutriwise.vn`

Mat khau mac dinh: bien moi truong `SEED_DEFAULT_PASSWORD`, neu khong set se la `1234567`.
Mat khau duoc ma hoa bang `bcrypt` voi so vong bam tu `BCRYPT_SALT_ROUNDS`.

## 5. Tao migration moi

```bash
npm run migration:create
```

Neu muon TypeORM tu generate migration tu thay doi entity:

```bash
npm run migration:generate -- --name=TenMigration
```
