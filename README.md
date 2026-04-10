# GR72

Hệ thống quản lý chế độ dinh dưỡng và đánh giá tình trạng sức khỏe người dùng, có tích hợp AI hỗ trợ tư vấn.

## Tổng quan

Dự án được xây dựng với mục tiêu hỗ trợ người dùng:
- theo dõi hồ sơ sức khỏe và mục tiêu cá nhân
- ghi nhật ký ăn uống, theo dõi calories và macro
- nhận đánh giá sức khỏe và khuyến nghị dinh dưỡng
- tương tác với AI để hỏi đáp về dinh dưỡng và sức khỏe

Hệ thống đồng thời hỗ trợ:
- `Nutritionist` quản lý recipe, meal template, bài viết và guideline
- `Admin` quản lý tài khoản, dữ liệu thực phẩm và vận hành hệ thống

## Cấu trúc repository

Repository hiện gồm 2 phần chính:

```text
.
├── nutrition-be/   # Backend API bằng NestJS + TypeORM + MySQL
└── nutrition-fe/   # Frontend bằng Next.js + React + TypeScript
```

## Công nghệ sử dụng

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- React Hook Form
- Zod

### Backend
- NestJS 11
- TypeORM
- MySQL
- JWT
- bcrypt
- TypeScript

## Chức năng chính

### User
- Đăng ký, đăng nhập, quên mật khẩu, đặt lại mật khẩu
- Quản lý hồ sơ cá nhân, mục tiêu sức khỏe, chỉ số sức khỏe
- Ghi nhật ký ăn uống và theo dõi dinh dưỡng theo ngày
- Xem dashboard sức khỏe và dinh dưỡng
- Tìm kiếm thực phẩm và xem chi tiết dinh dưỡng
- Chat AI, nhận đánh giá và khuyến nghị

### Nutritionist
- Quản lý recipe chuẩn
- Quản lý meal template
- Quản lý bài viết và guideline cho AI
- Tạo đề xuất sửa dữ liệu thực phẩm

### Admin
- Quản lý tài khoản, role, trạng thái
- Quản lý catalog thực phẩm nội bộ
- Duyệt dữ liệu thực phẩm từ nguồn ngoài
- Quản lý thông báo và dashboard quản trị

## Cách chạy dự án

### 1. Chạy backend

```bash
cd nutrition-be
npm install
npm run start:dev
```

### 2. Chạy frontend

```bash
cd nutrition-fe
npm install
npm run dev
```

## Database migration và seed

Chạy trong thư mục `nutrition-be`:

```bash
npm run migration:run
npm run seed
```

Hoặc:

```bash
npm run db:setup
```

## Ghi chú

- Frontend và backend được tách riêng để dễ phát triển và triển khai.
- AI được tích hợp qua backend, không chạy model local.
- Repository này tập trung vào mã nguồn của hệ thống, gồm 2 thư mục chính là `nutrition-be` và `nutrition-fe`.
