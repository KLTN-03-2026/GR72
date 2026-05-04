# Thay doi DB theo nghiep vu moi

## Van de cua schema cu

Schema cu dang di theo luong `expert-first`:

- `goi_tu_van` la goi do tung chuyen gia tao.
- `lich_hen` tro truc tiep vao `goi_tu_van_id`.
- Customer book chuyen gia/goi tu van truoc, khong co bang the hien customer da mua goi he thong.
- `phan_bo_doanh_thu_booking` tinh hoa hong theo tung booking nhung default chi `5%`, khong co ky doi soat thang.
- Chua co mapping ro rang giua `goi_dich_vu` he thong va danh sach chuyen gia duoc book trong goi.

## Huong moi

Schema moi chuyen sang `package-first`:

1. Admin quan ly 3 goi he thong trong `goi_dich_vu`.
2. Admin gan chuyen gia vao goi bang `goi_dich_vu_chuyen_gia`.
3. Customer mua goi, sinh ban ghi `goi_da_mua`.
4. Customer tao booking bang `lich_hen`, booking tro vao `goi_da_mua_id`, `goi_dich_vu_id`, `chuyen_gia_id`.
5. Payment tap trung trong bang `thanh_toan`.
6. Hoa hong gom theo thang bang `ky_hoa_hong`, `chi_tiet_hoa_hong`, `chi_tra_hoa_hong`.

## Bang giu lai / doi ten / thay the

### Giu lai va dieu chinh

- `tai_khoan`: giu, doi role ve `customer`, `expert`, `admin` neu code moi chap nhan.
- `thong_bao`: giu, them `entity_type`, `entity_id`.
- `tin_nhan`: giu theo context booking.
- `danh_gia`: giu, them moderation status.

### Thay the

- `chuyen_gia_dinh_duong` -> `chuyen_gia`.
- `dang_ky_goi_dich_vu` -> `goi_da_mua`.
- `thanh_toan_goi_dich_vu` + `thanh_toan_tu_van` -> `thanh_toan`.
- `phan_bo_doanh_thu_booking` -> `ky_hoa_hong` + `chi_tiet_hoa_hong` + `chi_tra_hoa_hong`.

### Bo theo nghiep vu moi

- `goi_tu_van`: bo vi goi khong con do chuyen gia tu tao.
- `chuc_nang_goi_dich_vu`: khong can cho 3 goi tu van chuan, co the dung `quyen_loi JSON` trong `goi_dich_vu`.
- `lich_su_su_dung_chuc_nang`: thay bang `lich_su_su_dung_goi`.

## Bang moi can co

- `goi_dich_vu_chuyen_gia`: mapping goi he thong va expert.
- `goi_da_mua`: entitlement cua customer sau khi mua goi.
- `lich_su_su_dung_goi`: lich su tru/hoan luot.
- `lich_lam_viec_chuyen_gia`: lich lap theo tuan.
- `lich_ban_chuyen_gia`: ngay nghi/gio ban.
- `booking_timeline`: lich su trang thai booking.
- `ghi_chu_tu_van`: note sau tu van.
- `cau_hinh_hoa_hong`: ty le 30% mac dinh va override.
- `ky_hoa_hong`: ky doi soat thang.
- `chi_tiet_hoa_hong`: tung booking duoc tinh hoa hong.
- `chi_tra_hoa_hong`: tong hop chi tra cho expert theo ky.
- `khieu_nai`, `khieu_nai_tin_nhan`: xu ly tranh chap.
- `audit_log`: truy vet thao tac nhay cam.
- `export_job`: export bao cao.
- `ho_so_suc_khoe`: du lieu nen ve suc khoe cua customer.
- `chi_so_suc_khoe`: lich su chi so suc khoe theo thoi gian.
- `phien_chat_ai`, `tin_nhan_chat_ai`: chatbox AI theo context suc khoe.
- `goi_y_suc_khoe`: goi y ke hoach/canh bao suc khoe.
- `goi_y_dinh_duong_tap_luyen`: goi y dinh duong va tap luyen.

## Rule DB quan trong

- Booking phai co `goi_da_mua_id`, khong book truc tiep bang goi cua expert.
- Expert book duoc phai ton tai mapping active trong `goi_dich_vu_chuyen_gia`.
- So luot goi da mua nam trong `goi_da_mua`, lich su tru/hoan luot nam trong `lich_su_su_dung_goi`.
- Payment phai idempotent bang `txn_ref`.
- Hoa hong mac dinh `30%` nam trong `cau_hinh_hoa_hong`.
- Ky da chot phai doc snapshot trong `chi_tiet_hoa_hong`, khong tinh live lai tu booking.
- AI chat va goi y suc khoe phai luu `input_snapshot`/`context_snapshot` de truy vet response sau nay.
- Expert chi xem duoc ho so suc khoe customer khi co booking lien quan.
