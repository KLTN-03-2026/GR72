import type { TableSeeder } from '../types';

const ghi_chu_tu_vanSeeder: TableSeeder = {
  table: 'ghi_chu_tu_van',
  rows: [
    {
      id: 1, lich_hen_id: 1, chuyen_gia_id: 1,
      tom_tat_cho_customer: 'Đã tư vấn xây dựng thực đơn giảm cân 1500kcal/ngày. Tập trung vào bữa sáng giàu protein và rau xanh bữa trưa/tối. Hạn chế tinh bột trắng sau 18h.',
      ghi_chu_noi_bo: 'BMI 24.9, mục tiêu 22. Theo dõi vòng eo mỗi 2 tuần. Cần cải thiện giấc ngủ.',
      khuyen_nghi_sau_tu_van: 'Ghi lại nhật ký ăn uống mỗi ngày. Uống 2.5L nước/ngày. Tập đi bộ 30 phút 5 ngày/tuần.',
      tags: ['giam_can', 'thuc_don', 'theo_doi'],
      tao_luc: '2026-01-22 10:00:00', cap_nhat_luc: '2026-01-22 10:00:00',
    },
    {
      id: 2, lich_hen_id: 2, chuyen_gia_id: 5,
      tom_tat_cho_customer: 'Lập thực đơn kiểm soát đường huyết theo nguyên tắc đĩa ăn lành mạnh: 1/2 rau, 1/4 tinh bột phức, 1/4 protein nạc. Tránh thức ăn nhanh và đồ ngọt.',
      ghi_chu_noi_bo: 'HbA1c cần giảm về dưới 7%. Đường huyết sau ăn cơm chiều thường cao nhất. Cần chia nhỏ bữa ăn.',
      khuyen_nghi_sau_tu_van: 'Đo đường huyết 2 tiếng sau bữa ăn. Tránh cơm trắng, thay bằng gạo lứt. Ăn trái cây có chỉ số GI thấp.',
      tags: ['tieu_duong', 'duong_huyet', 'che_do_an'],
      tao_luc: '2026-01-27 09:00:00', cap_nhat_luc: '2026-01-27 09:00:00',
    },
    {
      id: 3, lich_hen_id: 3, chuyen_gia_id: 3,
      tom_tat_cho_customer: 'Kế hoạch bulking: Tăng calo lên 2800kcal/ngày, protein 160g/ngày (2.3g/kg). Chia 5 bữa, bổ sung whey protein sau tập. Ưu tiên thịt gà, trứng, yến mạch.',
      ghi_chu_noi_bo: 'Đang tập 4 buổi/tuần. Chưa có kinh nghiệm về dinh dưỡng thể thao. Cần thực đơn đơn giản dễ thực hiện.',
      khuyen_nghi_sau_tu_van: 'Cân nặng và đo body fat mỗi tuần. Ăn bữa tiền tập 1.5h trước: cơm + ức gà. Ăn bữa hậu tập trong 30 phút: whey + chuối.',
      tags: ['tang_co', 'the_hinh', 'protein', 'bulking'],
      tao_luc: '2026-01-15 17:30:00', cap_nhat_luc: '2026-01-15 17:30:00',
    },
    {
      id: 4, lich_hen_id: 4, chuyen_gia_id: 5,
      tom_tat_cho_customer: 'Chế độ ăn DASH giảm huyết áp và mỡ máu: giảm muối dưới 2g/ngày, tăng kali từ chuối/khoai tây, omega-3 từ cá hồi. Tránh thức ăn chế biến sẵn.',
      ghi_chu_noi_bo: 'Huyết áp 145/92, cần đưa về 130/80. Mỡ LDL cao. Đang uống thuốc huyết áp. Tư vấn bổ trợ thuốc.',
      khuyen_nghi_sau_tu_van: 'Đọc nhãn dinh dưỡng, chú ý hàm lượng natri. Ăn cá béo 2-3 lần/tuần. Bổ sung tỏi vào nấu ăn hàng ngày.',
      tags: ['huyet_ap', 'mo_mau', 'tim_mach', 'DASH'],
      tao_luc: '2026-02-03 10:00:00', cap_nhat_luc: '2026-02-03 10:00:00',
    },
    {
      id: 5, lich_hen_id: 5, chuyen_gia_id: 2,
      tom_tat_cho_customer: 'Thực đơn cho mẹ cho con bú: tăng calo 500kcal so với bình thường, bổ sung sắt từ thịt bò và rau muống, canxi từ sữa tươi và hải sản không dị ứng.',
      ghi_chu_noi_bo: 'Mẹ dị ứng hải sản (hải sản có vỏ), bé đang bú tốt. Cân nặng sau sinh còn cao 5kg so với trước. Cần cân bằng giảm cân và đủ sữa.',
      khuyen_nghi_sau_tu_van: 'Không nhịn ăn khi cho con bú. Uống 3L nước/ngày. Ăn đa dạng thực phẩm để cung cấp đủ dưỡng chất qua sữa mẹ.',
      tags: ['cho_con_bu', 'sau_sinh', 'dinh_duong_me_be'],
      tao_luc: '2026-02-10 10:00:00', cap_nhat_luc: '2026-02-10 10:00:00',
    },
    {
      id: 6, lich_hen_id: 6, chuyen_gia_id: 3,
      tom_tat_cho_customer: 'Kế hoạch dinh dưỡng 12 tuần cho half marathon: giai đoạn nền tảng (tuần 1-6), giai đoạn tăng tốc (7-10), tuần giảm tải và carb-loading trước race.',
      ghi_chu_noi_bo: 'Pace hiện tại 6:30/km, mục tiêu sub-2:15. Cần tăng glycogen dự trữ và cải thiện fat-burning efficiency.',
      khuyen_nghi_sau_tu_van: 'Tập ăn trong khi chạy dài (gel hoặc chuối). Thử nghiệm hydration strategy trong các buổi long run cuối tuần.',
      tags: ['chay_bo', 'marathon', 'the_thao_suc_ben', 'carb_loading'],
      tao_luc: '2026-02-18 17:30:00', cap_nhat_luc: '2026-02-18 17:30:00',
    },
    {
      id: 7, lich_hen_id: 7, chuyen_gia_id: 8,
      tom_tat_cho_customer: 'Tăng cường canxi (1200mg/ngày) từ sữa, phô mai, rau lá xanh đậm. Bổ sung vitamin D từ ánh nắng sáng sớm và thực phẩm tăng cường.',
      ghi_chu_noi_bo: 'T-score -2.1, ngưỡng loãng xương. Cần tránh café và rượu làm giảm hấp thu canxi. Vitamin D huyết thanh thấp.',
      khuyen_nghi_sau_tu_van: 'Đi bộ 30 phút ngoài trời buổi sáng để tổng hợp vitamin D. Uống sữa ấm trước ngủ. Tránh café khi uống thực phẩm bổ sung canxi.',
      tags: ['loang_xuong', 'canxi', 'vitamin_D', 'nguoi_cao_tuoi'],
      tao_luc: '2026-02-23 10:00:00', cap_nhat_luc: '2026-02-23 10:00:00',
    },
    {
      id: 8, lich_hen_id: 8, chuyen_gia_id: 1,
      tom_tat_cho_customer: 'Chế độ ăn low-FODMAP cho IBS: loại bỏ lactose, fructose cao, gluten trong 4 tuần đầu, sau đó tái giới thiệu từng nhóm để xác định trigger.',
      ghi_chu_noi_bo: 'Triệu chứng IBS-D (tiêu chảy chiếm ưu thế). Đã thử low-FODMAP 2 tuần nhưng khó duy trì. Cần thực đơn đa dạng hơn.',
      khuyen_nghi_sau_tu_van: 'Ghi nhật ký thức ăn và triệu chứng. Ăn chậm và nhai kỹ. Tránh ăn quá no một lúc.',
      tags: ['IBS', 'low_FODMAP', 'ruot_kich_thich'],
      tao_luc: '2026-03-05 15:00:00', cap_nhat_luc: '2026-03-05 15:00:00',
    },
    {
      id: 9, lich_hen_id: 9, chuyen_gia_id: 1,
      tom_tat_cho_customer: 'Thực đơn vegan đủ chất: protein đầy đủ từ đậu phụ, tempeh, quinoa, đậu lăng. Bổ sung B12 từ thực phẩm tăng cường hoặc viên uống. Omega-3 từ hạt chia, hạt lanh.',
      ghi_chu_noi_bo: 'BMI 19.3, hơi thấp. Cần tăng calo và đảm bảo đủ vi chất. Lo ngại thiếu sắt non-heme và kẽm từ thực vật.',
      khuyen_nghi_sau_tu_van: 'Uống B12 1000mcg/ngày. Kết hợp nguồn sắt thực vật với vitamin C để tăng hấp thu. Xét nghiệm B12 và ferritin sau 3 tháng.',
      tags: ['an_chay', 'vegan', 'B12', 'dinh_duong_thuc_vat'],
      tao_luc: '2026-03-12 09:00:00', cap_nhat_luc: '2026-03-12 09:00:00',
    },
    {
      id: 10, lich_hen_id: 11, chuyen_gia_id: 5,
      tom_tat_cho_customer: 'Đánh giá sau 2 tháng: HbA1c giảm từ 8.2% xuống 7.4%, huyết áp cải thiện. Mở rộng thực đơn với trái cây GI thấp (bưởi, táo xanh) và ngũ cốc nguyên hạt.',
      ghi_chu_noi_bo: 'Tiến triển tốt. Bệnh nhân tuân thủ khá tốt. Cần duy trì momentum. Tăng thêm cá béo vào thực đơn.',
      khuyen_nghi_sau_tu_van: 'Tiếp tục theo dõi đường huyết. Bổ sung thêm bài tập nhẹ sau bữa ăn (đi bộ 15 phút). Đặt lịch kiểm tra HbA1c sau 6 tuần.',
      tags: ['tieu_duong', 'theo_doi', 'danh_gia'],
      tao_luc: '2026-03-24 09:00:00', cap_nhat_luc: '2026-03-24 09:00:00',
    },
  ],
};

export default ghi_chu_tu_vanSeeder;
