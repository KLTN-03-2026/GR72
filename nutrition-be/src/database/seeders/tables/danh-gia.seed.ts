import type { TableSeeder } from '../types';

const danh_giaSeeder: TableSeeder = {
  table: 'danh_gia',
  rows: [
    {
      id: 1, lich_hen_id: 1, tai_khoan_id: 11, chuyen_gia_id: 1, diem: 5,
      noi_dung: 'Chuyên gia rất tận tình, giải thích rõ ràng và dễ hiểu. Thực đơn được cá nhân hoá phù hợp với lịch sinh hoạt của mình. Đã giảm 1.5kg sau 2 tuần áp dụng!',
      tags: ['tan_tinh', 'de_hieu', 'thuc_don_phu_hop'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-01-23 10:00:00', cap_nhat_luc: '2026-01-23 10:00:00',
    },
    {
      id: 2, lich_hen_id: 2, tai_khoan_id: 12, chuyen_gia_id: 5, diem: 5,
      noi_dung: 'TS Mai Anh rất chuyên nghiệp, hiểu rõ bệnh tiểu đường của tôi. Thực đơn khoa học, đường huyết đã ổn định hơn sau 1 tháng theo dõi. Rất hài lòng!',
      tags: ['chuyen_nghiep', 'hieu_benh', 'hieu_qua'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-01-28 09:00:00', cap_nhat_luc: '2026-01-28 09:00:00',
    },
    {
      id: 3, lich_hen_id: 3, tai_khoan_id: 14, chuyen_gia_id: 3, diem: 5,
      noi_dung: 'PT Khải rất am hiểu về dinh dưỡng thể thao. Kế hoạch bulking rất chi tiết và thực tế. Sau 1 tháng đã tăng được 2kg cơ mà không tăng mỡ đáng kể.',
      tags: ['am_hieu', 'chi_tiet', 'hieu_qua'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-01-16 10:00:00', cap_nhat_luc: '2026-01-16 10:00:00',
    },
    {
      id: 4, lich_hen_id: 4, tai_khoan_id: 16, chuyen_gia_id: 5, diem: 5,
      noi_dung: 'Chuyên gia giải thích rất khoa học về chế độ ăn DASH. Huyết áp tôi đã giảm từ 145 xuống 132 sau 6 tuần. Cảm ơn TS Mai Anh rất nhiều!',
      tags: ['khoa_hoc', 'hieu_qua', 'chuyen_mon_cao'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-02-04 09:00:00', cap_nhat_luc: '2026-02-04 09:00:00',
    },
    {
      id: 5, lich_hen_id: 5, tai_khoan_id: 13, chuyen_gia_id: 2, diem: 5,
      noi_dung: 'BS Thu Hà rất hiểu về dinh dưỡng cho mẹ và bé. Tư vấn rất chu đáo về cả chế độ ăn khi cho con bú và cách giảm cân sau sinh an toàn.',
      tags: ['hieu_biet', 'chu_dao', 'phu_hop'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-02-11 09:00:00', cap_nhat_luc: '2026-02-11 09:00:00',
    },
    {
      id: 6, lich_hen_id: 6, tai_khoan_id: 17, chuyen_gia_id: 3, diem: 4,
      noi_dung: 'Kế hoạch dinh dưỡng cho marathon rất bài bản. Tuy nhiên mong muốn được giải thích thêm về cách thực hiện carb-loading trong ngày race.',
      tags: ['bai_ban', 'the_thao'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-02-19 08:00:00', cap_nhat_luc: '2026-02-19 08:00:00',
    },
    {
      id: 7, lich_hen_id: 7, tai_khoan_id: 20, chuyen_gia_id: 8, diem: 5,
      noi_dung: 'ThS Quốc Bảo rất am hiểu về dinh dưỡng người cao tuổi. Tư vấn tỉ mỉ, kiên nhẫn giải thích từng điểm. Đã bổ sung canxi đúng cách theo hướng dẫn.',
      tags: ['am_hieu', 'ti_mi', 'kien_nhan'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-02-24 09:00:00', cap_nhat_luc: '2026-02-24 09:00:00',
    },
    {
      id: 8, lich_hen_id: 8, tai_khoan_id: 19, chuyen_gia_id: 1, diem: 4,
      noi_dung: 'Chuyên gia hiểu rõ về IBS và low-FODMAP. Thực đơn khá đa dạng hơn tôi nghĩ. Chỉ mong buổi tư vấn dài hơn một chút để đi sâu hơn.',
      tags: ['hieu_biet', 'thuc_don_da_dang'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-03-06 09:00:00', cap_nhat_luc: '2026-03-06 09:00:00',
    },
    {
      id: 9, lich_hen_id: 9, tai_khoan_id: 21, chuyen_gia_id: 1, diem: 5,
      noi_dung: 'Rất hài lòng! Chuyên gia giải đáp đầy đủ về dinh dưỡng ăn chay. Biết thêm nhiều nguồn thực phẩm thay thế B12 và sắt mà vẫn thuần chay được.',
      tags: ['giai_dap_day_du', 'an_chay', 'thuc_te'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-03-13 08:00:00', cap_nhat_luc: '2026-03-13 08:00:00',
    },
    {
      id: 10, lich_hen_id: 11, tai_khoan_id: 12, chuyen_gia_id: 5, diem: 5,
      noi_dung: 'Buổi theo dõi thứ 2 rất hiệu quả. TS Mai Anh nhớ rõ tình trạng của tôi từ buổi trước, điều chỉnh phù hợp. Đường huyết đã về mức 7.4 rồi!',
      tags: ['theo_doi_chu_dong', 'hieu_qua', 'chuyen_nghiep'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-03-25 09:00:00', cap_nhat_luc: '2026-03-25 09:00:00',
    },
    {
      id: 11, lich_hen_id: 12, tai_khoan_id: 22, chuyen_gia_id: 3, diem: 5,
      noi_dung: 'Kế hoạch carb-loading rất chi tiết và căn chỉnh đúng chu kỳ tập. Giải giải thích khoa học về tại sao làm vậy, giúp tôi hiểu và tự điều chỉnh được.',
      tags: ['chi_tiet', 'giai_thich_khoa_hoc', 'hieu_qua'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-03-28 09:00:00', cap_nhat_luc: '2026-03-28 09:00:00',
    },
    {
      id: 12, lich_hen_id: 14, tai_khoan_id: 15, chuyen_gia_id: 4, diem: 5,
      noi_dung: 'ThS Ngọc Linh hiểu rất rõ tình trạng sinh viên không có điều kiện nấu ăn. Gợi ý thực tế, dễ áp dụng, không tốn kém. Đã cải thiện được thói quen ăn uống.',
      tags: ['thuc_te', 'de_ap_dung', 'hieu_hoan_canh'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-04-15 09:00:00', cap_nhat_luc: '2026-04-15 09:00:00',
    },
    // Đánh giá ẩn (1 cái để test)
    {
      id: 13, lich_hen_id: 16, tai_khoan_id: 13, chuyen_gia_id: 2, diem: 2,
      noi_dung: 'Nội dung không phù hợp với gia đình tôi',
      tags: [],
      trang_thai: 'bi_an', an_boi: 1, an_luc: '2026-04-23 10:00:00', ly_do_an: 'Vi phạm tiêu chuẩn cộng đồng',
      tao_luc: '2026-04-23 09:00:00', cap_nhat_luc: '2026-04-23 10:00:00',
    },
    {
      id: 14, lich_hen_id: 17, tai_khoan_id: 23, chuyen_gia_id: 4, diem: 4,
      noi_dung: 'Tư vấn tốt, chuyên gia hiểu vấn đề tiền mãn kinh. Thực đơn hợp lý. Hy vọng sau 2 tháng sẽ thấy kết quả rõ hơn.',
      tags: ['hieu_van_de', 'thuc_don_hop_ly'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-04-25 09:00:00', cap_nhat_luc: '2026-04-25 09:00:00',
    },
    {
      id: 15, lich_hen_id: 18, tai_khoan_id: 22, chuyen_gia_id: 3, diem: 5,
      noi_dung: 'Tuyệt vời! Kế hoạch chuẩn bị trước thi đấu rất chi tiết. Race vừa rồi đạt PB nhờ dinh dưỡng đúng. Cảm ơn PT Khải rất nhiều!',
      tags: ['chi_tiet', 'hieu_qua', 'dat_muc_tieu'],
      trang_thai: 'hien_thi', an_boi: null, an_luc: null, ly_do_an: null,
      tao_luc: '2026-04-29 09:00:00', cap_nhat_luc: '2026-04-29 09:00:00',
    },
  ],
};

export default danh_giaSeeder;
