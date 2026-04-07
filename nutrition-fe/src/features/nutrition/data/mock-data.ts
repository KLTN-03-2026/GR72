import type {
  AiAdvisorState,
  ArticleRecord,
  FoodRecord,
  FoodReviewRequestRecord,
  GoalSummary,
  HealthMetricEntry,
  HealthTrendPoint,
  MacroSummary,
  MealLogRecord,
  MealPlanRecord,
  MealTemplateRecord,
  NotificationRecord,
  RecipeRecord,
  StaffDashboardSummary,
  StaffUserRecord,
  UserProfile,
} from '@/features/nutrition/types'

export const todaySummary: MacroSummary = {
  calories: 1680,
  protein: 112,
  carbs: 172,
  fat: 52,
}

export const activeGoal: GoalSummary = {
  type: 'Giảm cân',
  targetWeight: 58,
  startWeight: 64,
  dailyTargets: {
    calories: 1750,
    protein: 120,
    carbs: 180,
    fat: 55,
  },
  targetDate: '30/06/2026',
}

export const healthTrend: HealthTrendPoint[] = [
  { date: '17/03', weight: 63.8, bmi: 24.1 },
  { date: '18/03', weight: 63.6, bmi: 24.0 },
  { date: '19/03', weight: 63.4, bmi: 23.9 },
  { date: '20/03', weight: 63.3, bmi: 23.8 },
  { date: '21/03', weight: 63.1, bmi: 23.8 },
  { date: '22/03', weight: 62.9, bmi: 23.7 },
  { date: '23/03', weight: 62.8, bmi: 23.6 },
]

export const userProfile: UserProfile = {
  fullName: 'Minh Anh Tran',
  gender: 'Nữ',
  birthDate: '12/10/2002',
  heightCm: 163,
  currentWeightKg: 62.8,
  activityLevel: 'Vận động vừa',
  allergies: ['Hải sản vỏ cứng', 'Sữa nguyên kem'],
  dietaryPreferences: ['Ít đường', 'Nhiều đạm', 'Ưu tiên món Việt'],
}

export const healthMetrics: HealthMetricEntry[] = [
  {
    measuredAt: '23/03/2026 07:30',
    weightKg: 62.8,
    bmi: 23.6,
    bmr: 1345,
    tdee: 2017,
    note: 'Ngủ đủ giấc, cảm giác cơ thể nhẹ hơn.',
  },
  {
    measuredAt: '20/03/2026 07:20',
    weightKg: 63.3,
    bmi: 23.8,
    bmr: 1352,
    tdee: 2028,
    note: 'Giữ nhịp tập 4 buổi/tuần.',
  },
  {
    measuredAt: '17/03/2026 07:10',
    weightKg: 63.8,
    bmi: 24.1,
    bmr: 1358,
    tdee: 2037,
    note: 'Bắt đầu lại kế hoạch ăn kiểm soát calories.',
  },
]

export const foods: FoodRecord[] = [
  {
    id: 'FOOD-001',
    name: 'Ức gà áp chảo',
    group: 'Thịt nạc',
    serving: '100g',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    source: 'Nội bộ',
    status: 'Đã xác minh',
  },
  {
    id: 'FOOD-002',
    name: 'Yến mạch cán dẹt',
    group: 'Tinh bột tốt',
    serving: '100g',
    calories: 389,
    protein: 16.9,
    carbs: 66.3,
    fat: 6.9,
    source: 'Nội bộ',
    status: 'Đã xác minh',
  },
  {
    id: 'FOOD-003',
    name: 'Sữa chua Hy Lạp',
    group: 'Sữa chua',
    serving: '100g',
    calories: 120,
    protein: 10,
    carbs: 4,
    fat: 6,
    source: 'USDA import',
    status: 'Từ nguồn ngoài',
  },
  {
    id: 'FOOD-004',
    name: 'Cơm gạo lứt',
    group: 'Tinh bột',
    serving: '100g',
    calories: 123,
    protein: 2.7,
    carbs: 25.6,
    fat: 1,
    source: 'Nội bộ',
    status: 'Đã xác minh',
  },
  {
    id: 'FOOD-005',
    name: 'Bông cải xanh luộc',
    group: 'Rau củ',
    serving: '100g',
    calories: 35,
    protein: 2.4,
    carbs: 7.2,
    fat: 0.4,
    source: 'Nội bộ',
    status: 'Đã xác minh',
  },
]

export const mealLogs: MealLogRecord[] = [
  {
    id: 'LOG-001',
    date: '23/03/2026',
    mealType: 'Bữa sáng',
    items: 'Yến mạch, sữa chua Hy Lạp, chuối',
    calories: 420,
    protein: 23,
    carbs: 58,
    fat: 10,
  },
  {
    id: 'LOG-002',
    date: '23/03/2026',
    mealType: 'Bữa trưa',
    items: 'Ức gà áp chảo, cơm gạo lứt, bông cải xanh',
    calories: 560,
    protein: 44,
    carbs: 47,
    fat: 14,
  },
  {
    id: 'LOG-003',
    date: '22/03/2026',
    mealType: 'Bữa tối',
    items: 'Cá hồi nướng, salad xanh, súp bí đỏ',
    calories: 520,
    protein: 36,
    carbs: 28,
    fat: 24,
  },
]

export const mealPlans: MealPlanRecord[] = [
  {
    id: 'PLAN-001',
    title: 'Thực đơn giảm mỡ ngày 23/03',
    planDate: '23/03/2026',
    meals: ['Yến mạch buổi sáng', 'Ức gà cơm gạo lứt', 'Salad cá hồi'],
    totalCalories: 1720,
    status: 'Đang áp dụng',
  },
  {
    id: 'PLAN-002',
    title: 'Thực đơn đi làm ít thời gian',
    planDate: '24/03/2026',
    meals: ['Overnight oats', 'Cơm hộp ức gà', 'Súp rau + sandwich'],
    totalCalories: 1685,
    status: 'Bản nháp',
  },
]

export const mealTemplates: MealTemplateRecord[] = [
  {
    id: 'TPL-001',
    title: 'Template giảm mỡ cơ bản',
    target: 'Giảm cân',
    targetCalories: 1750,
    meals: ['Yến mạch + sữa chua', 'Ức gà + cơm gạo lứt', 'Cá hồi + salad'],
    status: 'Xuất bản',
  },
  {
    id: 'TPL-002',
    title: 'Template đi làm bận rộn',
    target: 'Duy trì',
    targetCalories: 1850,
    meals: ['Overnight oats', 'Cơm hộp nhiều đạm', 'Bánh mì nguyên cám + súp'],
    status: 'Xuất bản',
  },
  {
    id: 'TPL-003',
    title: 'Template tăng đạm sau tập',
    target: 'Tăng cân',
    targetCalories: 2150,
    meals: ['Sinh tố đạm', 'Cơm bò áp chảo', 'Mì Ý sốt cà chua'],
    status: 'Bản nháp',
  },
]

export const articles: ArticleRecord[] = [
  {
    id: 'ART-001',
    title: '5 nguyên tắc ăn đủ đạm để giảm mỡ bền vững',
    slug: '5-nguyen-tac-an-du-dam-de-giam-mo-ben-vung',
    category: 'Kiến thức dinh dưỡng',
    summary: 'Cách chia protein hợp lý trong ngày để giữ no và bảo toàn cơ.',
    content:
      'Ăn đủ đạm không có nghĩa là ăn quá nhiều trong một bữa. Cách hiệu quả hơn là chia đều protein qua ba bữa chính và một bữa phụ nếu cần.\n\nƯu tiên nguồn đạm dễ chuẩn bị như trứng, sữa chua Hy Lạp, ức gà, cá hồi, đậu hũ và sữa ít đường. Khi mỗi bữa có đủ đạm, cảm giác no sẽ ổn định hơn và bạn cũng dễ giữ mức calories phù hợp hơn.\n\nNếu đang giảm mỡ, hãy kết hợp đạm với rau và tinh bột tốt. Điều này giúp bữa ăn bền năng lượng, hạn chế thèm đồ ngọt vào cuối ngày và hỗ trợ duy trì khối cơ tốt hơn.',
    thumbnailUrl: '/logo.jpg',
    author: 'Nguyễn Hà My',
    tags: ['protein', 'giảm mỡ', 'thói quen ăn uống'],
    publishedAt: '22/03/2026',
    status: 'Xuất bản',
    updatedAt: '22/03/2026',
    aiGuidelines: ['Ưu tiên lời khuyên dễ áp dụng', 'Không khuyến khích cắt carb cực đoan'],
  },
  {
    id: 'ART-002',
    title: 'Thực đơn mẫu cho người làm văn phòng',
    slug: 'thuc-don-mau-cho-nguoi-lam-van-phong',
    category: 'Thực đơn mẫu',
    summary: 'Gợi ý 3 bữa dễ chuẩn bị, calories vừa phải và giàu vi chất.',
    content:
      'Người làm văn phòng thường bỏ bữa sáng hoặc ăn quá nhanh vào buổi trưa. Một thực đơn đơn giản nên bắt đầu bằng bữa sáng giàu đạm, bữa trưa đủ rau và một bữa tối nhẹ nhưng vẫn cân đối.\n\nBạn có thể chuẩn bị overnight oats, cơm hộp ức gà và một bữa tối với súp rau cùng bánh mì nguyên cám. Mẫu này giúp tiết kiệm thời gian mà vẫn giữ chất lượng dinh dưỡng đủ tốt cho mục tiêu duy trì cân nặng.\n\nĐiểm quan trọng là chuẩn bị trước vào tối hôm trước và mang theo bữa phụ nhỏ như trái cây ít ngọt hoặc sữa chua không đường để tránh ăn vặt mất kiểm soát.',
    thumbnailUrl: '/logo.jpg',
    author: 'Lê Minh Thảo',
    tags: ['meal prep', 'văn phòng', 'thực đơn mẫu'],
    publishedAt: '21/03/2026',
    status: 'Xuất bản',
    updatedAt: '21/03/2026',
    aiGuidelines: ['Luôn nhắc uống đủ nước', 'Ưu tiên món Việt quen thuộc'],
  },
  {
    id: 'ART-003',
    title: 'Khung guideline tư vấn AI cho người thừa cân nhẹ',
    slug: 'khung-guideline-tu-van-ai-cho-nguoi-thua-can-nhe',
    category: 'AI Guideline',
    summary: 'Bộ hướng dẫn dùng làm ngữ cảnh cho AI khi tư vấn giảm mỡ.',
    content:
      'Bài viết này mô tả bộ guideline nội bộ dành cho AI khi phản hồi các câu hỏi liên quan đến người thừa cân nhẹ. Nội dung ưu tiên giọng văn không phán xét, tập trung vào thay đổi nhỏ, thực tế và bền vững.\n\nMọi khuyến nghị đều cần kèm disclaimer rõ ràng rằng AI không thay thế bác sĩ hay chẩn đoán y khoa. Khi gặp dữ liệu bất thường, hệ thống nên gợi ý người dùng đi kiểm tra chuyên môn thay vì kết luận chắc chắn.',
    thumbnailUrl: '/logo.jpg',
    author: 'Nguyễn Hà My',
    tags: ['ai', 'guideline', 'giảm cân'],
    publishedAt: undefined,
    status: 'Bản nháp',
    updatedAt: '20/03/2026',
    aiGuidelines: ['Không dùng ngôn ngữ phán xét', 'Luôn kèm disclaimer sức khỏe'],
  },
]

export const notifications: NotificationRecord[] = [
  {
    id: 'NOTI-001',
    title: 'Đã 2 ngày bạn chưa cập nhật chỉ số',
    content: 'Hãy nhập cân nặng hôm nay để hệ thống đánh giá tiến độ chính xác hơn.',
    type: 'Nhắc việc',
    status: 'Chưa đọc',
    createdAt: '23/03/2026 08:00',
  },
  {
    id: 'NOTI-002',
    title: 'AI vừa tạo khuyến nghị dinh dưỡng mới',
    content: 'Khuyến nghị mới tập trung vào việc tăng protein buổi sáng và giảm đường ẩn.',
    type: 'AI',
    status: 'Chưa đọc',
    createdAt: '22/03/2026 18:30',
  },
  {
    id: 'NOTI-003',
    title: 'Bài viết mới: 5 nguyên tắc ăn đủ đạm',
    content: 'Nutritionist vừa xuất bản một bài viết mới phù hợp với mục tiêu giảm mỡ.',
    type: 'Hệ thống',
    status: 'Đã đọc',
    createdAt: '22/03/2026 10:15',
  },
]

export const aiAdvisorState: AiAdvisorState = {
  sessionTitle: 'Tư vấn dinh dưỡng tuần này',
  healthEvaluation:
    'BMI hiện tại của bạn đang ở mức cận trên bình thường. TDEE ổn định quanh 2,000 kcal và xu hướng cân nặng đang giảm đều.',
  recommendation:
    'Nên duy trì mức 1,700 đến 1,800 kcal/ngày, tăng protein lên khoảng 120g và ưu tiên bữa sáng đủ đạm để giảm cảm giác đói cuối ngày.',
  messages: [
    {
      id: 'MSG-001',
      role: 'user',
      content: 'Mình hay đói vào cuối chiều, nên chỉnh bữa nào trước?',
      time: '09:00',
    },
    {
      id: 'MSG-002',
      role: 'assistant',
      content:
        'Bạn nên tăng lượng đạm và chất xơ ở bữa trưa hoặc thêm bữa phụ nhẹ với sữa chua Hy Lạp, trái cây ít ngọt.',
      time: '09:01',
    },
    {
      id: 'MSG-003',
      role: 'user',
      content: 'Nếu bận thì có gợi ý món nhanh nào không?',
      time: '09:03',
    },
    {
      id: 'MSG-004',
      role: 'assistant',
      content:
        'Bạn có thể chuẩn bị overnight oats, trứng luộc, sữa chua Hy Lạp và ức gà cắt sẵn để tiết kiệm thời gian mà vẫn kiểm soát calories.',
      time: '09:04',
    },
  ],
}

export const staffDashboard: StaffDashboardSummary = {
  totalUsers: 1284,
  totalMealLogs: 6402,
  totalAiSessions: 942,
  publishedArticles: 18,
  pendingFoodReviews: 7,
}

export const foodReviewRequests: FoodReviewRequestRecord[] = [
  {
    id: 'REV-001',
    requestType: 'Duyệt import ngoài',
    foodName: 'Sữa chua Hy Lạp ít béo',
    source: 'USDA',
    requestedBy: 'System import',
    status: 'Chờ duyệt',
    updatedAt: '23/03/2026',
  },
  {
    id: 'REV-002',
    requestType: 'Cập nhật dữ liệu',
    foodName: 'Ức gà áp chảo',
    source: 'Nutritionist Hoai Thu',
    requestedBy: 'Nutritionist Hoai Thu',
    status: 'Đã duyệt',
    updatedAt: '22/03/2026',
  },
  {
    id: 'REV-003',
    requestType: 'Duyệt import ngoài',
    foodName: 'Granola hạt hỗn hợp',
    source: 'OpenFoodFacts',
    requestedBy: 'System import',
    status: 'Từ chối',
    updatedAt: '21/03/2026',
  },
]

export const recipes: RecipeRecord[] = [
  {
    id: 'REC-001',
    name: 'Salad ức gà sốt mè rang',
    category: 'Giảm cân',
    servings: 2,
    totalCalories: 420,
    status: 'Xuất bản',
  },
  {
    id: 'REC-002',
    name: 'Cháo yến mạch bí đỏ',
    category: 'Bữa sáng',
    servings: 1,
    totalCalories: 310,
    status: 'Xuất bản',
  },
  {
    id: 'REC-003',
    name: 'Cơm gạo lứt cá hồi áp chảo',
    category: 'Giàu đạm',
    servings: 2,
    totalCalories: 560,
    status: 'Bản nháp',
  },
]

export const staffUsers: StaffUserRecord[] = [
  {
    id: 'USR-001',
    name: 'Minh Anh Tran',
    email: 'member@nutriwise.vn',
    role: 'User',
    status: 'Hoạt động',
    lastActive: '23/03/2026 08:10',
  },
  {
    id: 'USR-002',
    name: 'Hoai Thu',
    email: 'nutritionist@nutriwise.vn',
    role: 'Nutritionist',
    status: 'Hoạt động',
    lastActive: '23/03/2026 09:00',
  },
  {
    id: 'USR-003',
    name: 'Linh Chi',
    email: 'admin@nutriwise.vn',
    role: 'Admin',
    status: 'Hoạt động',
    lastActive: '23/03/2026 09:12',
  },
]
