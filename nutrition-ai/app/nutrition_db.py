"""
Nutrition database - mapping Food-101 labels (và món Việt bổ sung) → tiếng Việt + dinh dưỡng.
Dữ liệu tổng hợp từ USDA FoodData Central và Viện Dinh dưỡng Quốc gia VN.
Đơn vị: per 100g (hoặc per portion với serving_g cố định).
"""
from __future__ import annotations
from typing import Optional, Dict

NUTRITION_DB: Dict[str, dict] = {
    # ─── Món châu Á / Việt có trong Food-101 ───
    "pho": {
        "name_vi": "Phở bò",
        "calories": 80, "protein": 7, "carbs": 12, "fat": 2,
        "serving_g": 500, "category": "Mì sợi & nước",
        "tip": "Phở giàu natri. Hạn chế nước béo nếu đang giảm cân hoặc cao huyết áp."
    },
    "ramen": {
        "name_vi": "Mì ramen",
        "calories": 110, "protein": 5, "carbs": 18, "fat": 3,
        "serving_g": 450, "category": "Mì sợi & nước",
        "tip": "Ramen công nghiệp rất nhiều natri. Nên giảm gói gia vị 1/2."
    },
    "spring_rolls": {
        "name_vi": "Gỏi cuốn / Chả giò",
        "calories": 150, "protein": 6, "carbs": 18, "fat": 6,
        "serving_g": 80, "category": "Khai vị",
        "tip": "Gỏi cuốn (tươi) lành mạnh hơn nhiều so với chả giò chiên."
    },
    "sushi": {
        "name_vi": "Sushi",
        "calories": 150, "protein": 6, "carbs": 28, "fat": 1,
        "serving_g": 200, "category": "Hải sản",
        "tip": "Sushi cá hồi nhiều omega-3. Nhưng cơm sushi có đường, ăn vừa phải."
    },
    "fried_rice": {
        "name_vi": "Cơm chiên",
        "calories": 165, "protein": 4, "carbs": 23, "fat": 6,
        "serving_g": 350, "category": "Cơm",
        "tip": "Cơm chiên nhiều dầu. Chọn cơm rang ít dầu hoặc thay bằng gạo lứt."
    },
    "dumplings": {
        "name_vi": "Há cảo / Sủi cảo",
        "calories": 230, "protein": 8, "carbs": 25, "fat": 11,
        "serving_g": 150, "category": "Điểm tâm",
        "tip": "Hấp ít calo hơn chiên. Ăn 6-8 cái mỗi bữa là đủ."
    },
    "miso_soup": {
        "name_vi": "Súp miso",
        "calories": 40, "protein": 3, "carbs": 4, "fat": 1,
        "serving_g": 250, "category": "Súp",
        "tip": "Lành, giàu probiotics nhưng natri cao."
    },
    "edamame": {
        "name_vi": "Đậu nành Nhật",
        "calories": 120, "protein": 11, "carbs": 9, "fat": 5,
        "serving_g": 100, "category": "Khai vị",
        "tip": "Giàu protein thực vật và chất xơ. Snack rất lành mạnh."
    },

    # ─── Các món Tây/Âu phổ biến ───
    "pizza": {
        "name_vi": "Pizza",
        "calories": 270, "protein": 11, "carbs": 33, "fat": 10,
        "serving_g": 200, "category": "Fast food",
        "tip": "Pizza nhiều calo và chất béo. 1 lát/bữa là tối đa nếu giảm cân."
    },
    "hamburger": {
        "name_vi": "Hamburger",
        "calories": 295, "protein": 17, "carbs": 25, "fat": 14,
        "serving_g": 250, "category": "Fast food",
        "tip": "Burger fast food có nhiều natri và chất béo bão hòa."
    },
    "french_fries": {
        "name_vi": "Khoai tây chiên",
        "calories": 312, "protein": 4, "carbs": 41, "fat": 15,
        "serving_g": 150, "category": "Fast food",
        "tip": "Khoai chiên ngập dầu. Nên thay bằng khoai nướng."
    },
    "hot_dog": {
        "name_vi": "Hot dog",
        "calories": 290, "protein": 11, "carbs": 22, "fat": 18,
        "serving_g": 100, "category": "Fast food",
        "tip": "Xúc xích chế biến. WHO khuyến cáo hạn chế."
    },
    "donuts": {
        "name_vi": "Bánh donut",
        "calories": 450, "protein": 5, "carbs": 51, "fat": 25,
        "serving_g": 80, "category": "Tráng miệng",
        "tip": "Đường + dầu cao. Ăn dịp đặc biệt thôi."
    },
    "ice_cream": {
        "name_vi": "Kem",
        "calories": 207, "protein": 4, "carbs": 24, "fat": 11,
        "serving_g": 100, "category": "Tráng miệng",
        "tip": "Đường cao, không phù hợp người tiểu đường."
    },
    "chocolate_cake": {
        "name_vi": "Bánh socola",
        "calories": 371, "protein": 4, "carbs": 53, "fat": 16,
        "serving_g": 120, "category": "Tráng miệng",
        "tip": "Calo và đường cao. 1 lát nhỏ/lần là đủ."
    },
    "tiramisu": {
        "name_vi": "Tiramisu",
        "calories": 240, "protein": 4, "carbs": 30, "fat": 12,
        "serving_g": 120, "category": "Tráng miệng",
        "tip": "Có cà phê + rượu nhẹ. Người mất ngủ tránh ăn tối."
    },
    "cheesecake": {
        "name_vi": "Bánh phô mai",
        "calories": 321, "protein": 6, "carbs": 26, "fat": 22,
        "serving_g": 120, "category": "Tráng miệng",
        "tip": "Chất béo cao. Ăn vừa phải."
    },
    "spaghetti_bolognese": {
        "name_vi": "Mì Ý sốt thịt bò",
        "calories": 162, "protein": 8, "carbs": 22, "fat": 4,
        "serving_g": 350, "category": "Mì Ý",
        "tip": "Cân bằng. Chọn mì nguyên cám sẽ giàu chất xơ hơn."
    },
    "spaghetti_carbonara": {
        "name_vi": "Mì Ý Carbonara",
        "calories": 280, "protein": 11, "carbs": 31, "fat": 12,
        "serving_g": 350, "category": "Mì Ý",
        "tip": "Có lòng đỏ trứng + thịt xông khói. Cholesterol cao."
    },
    "lasagna": {
        "name_vi": "Lasagna",
        "calories": 195, "protein": 11, "carbs": 17, "fat": 9,
        "serving_g": 300, "category": "Mì Ý",
        "tip": "Đầy đủ dinh dưỡng nhưng nhiều phô mai."
    },
    "macaroni_and_cheese": {
        "name_vi": "Mì macaroni phô mai",
        "calories": 164, "protein": 7, "carbs": 19, "fat": 6,
        "serving_g": 250, "category": "Mì Ý",
        "tip": "Calorie và bão hòa cao. Ăn lâu lâu thôi."
    },
    "steak": {
        "name_vi": "Bít tết",
        "calories": 271, "protein": 25, "carbs": 0, "fat": 19,
        "serving_g": 200, "category": "Thịt",
        "tip": "Giàu protein và sắt. Chọn nạc, hạn chế bão hòa."
    },
    "grilled_salmon": {
        "name_vi": "Cá hồi nướng",
        "calories": 208, "protein": 22, "carbs": 0, "fat": 13,
        "serving_g": 200, "category": "Hải sản",
        "tip": "Giàu omega-3, rất tốt cho tim mạch và não."
    },
    "fried_calamari": {
        "name_vi": "Mực chiên",
        "calories": 175, "protein": 15, "carbs": 8, "fat": 8,
        "serving_g": 150, "category": "Hải sản",
        "tip": "Chiên nhiều dầu. Chọn mực hấp/nướng tốt hơn."
    },
    "fish_and_chips": {
        "name_vi": "Cá & khoai tây chiên",
        "calories": 230, "protein": 12, "carbs": 28, "fat": 10,
        "serving_g": 300, "category": "Fast food",
        "tip": "Bữa nặng. Ăn kèm salad để cân bằng."
    },
    "tacos": {
        "name_vi": "Tacos",
        "calories": 226, "protein": 12, "carbs": 19, "fat": 12,
        "serving_g": 100, "category": "Fast food",
        "tip": "Nếu nhân nạc + nhiều rau thì khá lành."
    },
    "guacamole": {
        "name_vi": "Sốt bơ Guacamole",
        "calories": 160, "protein": 2, "carbs": 9, "fat": 14,
        "serving_g": 100, "category": "Khai vị",
        "tip": "Béo nhưng là chất béo lành (bơ). Ăn vừa phải."
    },
    "caesar_salad": {
        "name_vi": "Salad Caesar",
        "calories": 190, "protein": 8, "carbs": 7, "fat": 14,
        "serving_g": 200, "category": "Salad",
        "tip": "Nước sốt khá nhiều béo. Yêu cầu sốt riêng nếu cần."
    },
    "greek_salad": {
        "name_vi": "Salad Hy Lạp",
        "calories": 130, "protein": 4, "carbs": 6, "fat": 11,
        "serving_g": 200, "category": "Salad",
        "tip": "Lành mạnh, nhiều rau và olive."
    },
    "pancakes": {
        "name_vi": "Bánh pancake",
        "calories": 227, "protein": 6, "carbs": 28, "fat": 10,
        "serving_g": 150, "category": "Bữa sáng",
        "tip": "Đường cao do siro. Dùng mật ong / trái cây tươi sẽ tốt hơn."
    },
    "waffles": {
        "name_vi": "Bánh waffles",
        "calories": 291, "protein": 8, "carbs": 33, "fat": 14,
        "serving_g": 100, "category": "Bữa sáng",
        "tip": "Tương tự pancake, ăn dịp cuối tuần."
    },
    "french_toast": {
        "name_vi": "Bánh mì nướng kiểu Pháp",
        "calories": 229, "protein": 8, "carbs": 25, "fat": 11,
        "serving_g": 150, "category": "Bữa sáng",
        "tip": "Có trứng nên giàu protein, nhưng ngấm dầu."
    },
    "omelette": {
        "name_vi": "Trứng ốp la",
        "calories": 154, "protein": 11, "carbs": 1, "fat": 12,
        "serving_g": 150, "category": "Bữa sáng",
        "tip": "Giàu protein. Bớt dầu / phô mai để nhẹ hơn."
    },
    "eggs_benedict": {
        "name_vi": "Trứng Benedict",
        "calories": 290, "protein": 14, "carbs": 18, "fat": 19,
        "serving_g": 200, "category": "Bữa sáng",
        "tip": "Nước sốt Hollandaise rất béo."
    },
    "fried_chicken": {
        "name_vi": "Gà rán",
        "calories": 246, "protein": 19, "carbs": 8, "fat": 15,
        "serving_g": 200, "category": "Thịt",
        "tip": "Chiên ngập dầu. Chọn gà nướng hoặc luộc tốt hơn."
    },
    "chicken_curry": {
        "name_vi": "Cà ri gà",
        "calories": 156, "protein": 12, "carbs": 8, "fat": 9,
        "serving_g": 350, "category": "Món hầm",
        "tip": "Cà ri có nghệ chống viêm. Chọn ức gà thay vì đùi."
    },
    "chicken_wings": {
        "name_vi": "Cánh gà",
        "calories": 290, "protein": 27, "carbs": 0, "fat": 20,
        "serving_g": 150, "category": "Thịt",
        "tip": "Da gà béo. Bóc da để giảm calo."
    },
    "garlic_bread": {
        "name_vi": "Bánh mì bơ tỏi",
        "calories": 350, "protein": 7, "carbs": 41, "fat": 17,
        "serving_g": 100, "category": "Khai vị",
        "tip": "Bơ + dầu cao. Ăn 1-2 lát kèm món chính."
    },
    "bruschetta": {
        "name_vi": "Bánh mì Bruschetta",
        "calories": 200, "protein": 6, "carbs": 25, "fat": 9,
        "serving_g": 100, "category": "Khai vị",
        "tip": "Lành nếu topping rau + cà chua."
    },
    "club_sandwich": {
        "name_vi": "Sandwich",
        "calories": 250, "protein": 13, "carbs": 24, "fat": 12,
        "serving_g": 250, "category": "Bữa nhẹ",
        "tip": "Tùy vào nguyên liệu. Chọn bánh nguyên cám + thịt nạc."
    },
    "lobster_bisque": {
        "name_vi": "Súp tôm hùm",
        "calories": 95, "protein": 4, "carbs": 7, "fat": 5,
        "serving_g": 250, "category": "Súp",
        "tip": "Có kem nhưng không quá nặng."
    },
    "clam_chowder": {
        "name_vi": "Súp ngao",
        "calories": 95, "protein": 5, "carbs": 9, "fat": 4,
        "serving_g": 250, "category": "Súp",
        "tip": "Súp kem. Lành so với chowder phô mai."
    },
    "hot_and_sour_soup": {
        "name_vi": "Canh chua cay",
        "calories": 50, "protein": 3, "carbs": 5, "fat": 2,
        "serving_g": 250, "category": "Súp",
        "tip": "Ít calo, phù hợp giảm cân."
    },
    "onion_rings": {
        "name_vi": "Hành tây chiên",
        "calories": 332, "protein": 4, "carbs": 39, "fat": 18,
        "serving_g": 100, "category": "Khai vị",
        "tip": "Ngấm dầu rất nhiều. Hạn chế."
    },
    "nachos": {
        "name_vi": "Nachos",
        "calories": 343, "protein": 8, "carbs": 36, "fat": 19,
        "serving_g": 150, "category": "Khai vị",
        "tip": "Béo và mặn. Chia sẻ thay vì ăn 1 mình."
    },
    "apple_pie": {
        "name_vi": "Bánh táo",
        "calories": 240, "protein": 2, "carbs": 34, "fat": 11,
        "serving_g": 120, "category": "Tráng miệng",
        "tip": "Đường cao. 1 lát nhỏ là đủ."
    },
    "creme_brulee": {
        "name_vi": "Crème brûlée",
        "calories": 270, "protein": 4, "carbs": 22, "fat": 19,
        "serving_g": 120, "category": "Tráng miệng",
        "tip": "Kem + đường + caramel. Calo cao."
    },
    "macarons": {
        "name_vi": "Bánh macarons",
        "calories": 410, "protein": 4, "carbs": 50, "fat": 22,
        "serving_g": 50, "category": "Tráng miệng",
        "tip": "Rất ngọt. Ăn 1-2 cái thôi."
    },
    "cup_cakes": {
        "name_vi": "Bánh cupcake",
        "calories": 300, "protein": 3, "carbs": 50, "fat": 11,
        "serving_g": 80, "category": "Tráng miệng",
        "tip": "Đường cao, không tốt cho người tiểu đường."
    },
    "strawberry_shortcake": {
        "name_vi": "Bánh dâu kem",
        "calories": 224, "protein": 3, "carbs": 35, "fat": 9,
        "serving_g": 120, "category": "Tráng miệng",
        "tip": "Có dâu giàu vitamin C."
    },
    "panna_cotta": {
        "name_vi": "Panna cotta",
        "calories": 210, "protein": 3, "carbs": 21, "fat": 13,
        "serving_g": 120, "category": "Tráng miệng",
        "tip": "Nhẹ nhàng. Nhiều béo nhưng ít hơn cheesecake."
    },

    # ─── Bổ sung Food-101 còn thiếu ───
    "baby_back_ribs": {
        "name_vi": "Sườn nướng BBQ",
        "calories": 290, "protein": 21, "carbs": 9, "fat": 19,
        "serving_g": 250, "category": "Thịt",
        "tip": "Sốt BBQ nhiều đường. Ăn kèm salad để cân bằng."
    },
    "baklava": {
        "name_vi": "Baklava (bánh ngọt Trung Đông)",
        "calories": 428, "protein": 6, "carbs": 49, "fat": 24,
        "serving_g": 80, "category": "Tráng miệng",
        "tip": "Đường + bơ + hạt. Ăn 1 miếng nhỏ."
    },
    "beef_carpaccio": {
        "name_vi": "Bò sống thái lát Carpaccio",
        "calories": 175, "protein": 22, "carbs": 1, "fat": 9,
        "serving_g": 120, "category": "Khai vị",
        "tip": "Bò sống — chỉ ăn ở nhà hàng uy tín. Không cho phụ nữ mang thai."
    },
    "beef_tartare": {
        "name_vi": "Bò sống băm Tartare",
        "calories": 220, "protein": 25, "carbs": 2, "fat": 12,
        "serving_g": 150, "category": "Khai vị",
        "tip": "Bò sống. Có nguy cơ vi khuẩn — không phù hợp người miễn dịch yếu."
    },
    "beet_salad": {
        "name_vi": "Salad củ dền",
        "calories": 90, "protein": 3, "carbs": 12, "fat": 4,
        "serving_g": 200, "category": "Salad",
        "tip": "Củ dền giàu chất xơ và folate, tốt cho tim mạch."
    },
    "beignets": {
        "name_vi": "Bánh donut Pháp Beignets",
        "calories": 380, "protein": 6, "carbs": 45, "fat": 19,
        "serving_g": 80, "category": "Tráng miệng",
        "tip": "Chiên + bột đường. Ăn dịp đặc biệt."
    },
    "bibimbap": {
        "name_vi": "Cơm trộn Hàn Quốc Bibimbap",
        "calories": 130, "protein": 7, "carbs": 18, "fat": 4,
        "serving_g": 450, "category": "Cơm",
        "tip": "Cân bằng dinh dưỡng tốt — nhiều rau + ít thịt + 1 trứng."
    },
    "bread_pudding": {
        "name_vi": "Bánh pudding bánh mì",
        "calories": 230, "protein": 6, "carbs": 33, "fat": 9,
        "serving_g": 150, "category": "Tráng miệng",
        "tip": "Có sữa + trứng nên giàu protein hơn các bánh ngọt khác."
    },
    "breakfast_burrito": {
        "name_vi": "Burrito sáng",
        "calories": 215, "protein": 9, "carbs": 23, "fat": 10,
        "serving_g": 300, "category": "Bữa sáng",
        "tip": "Nhiều protein. Chọn vỏ nguyên cám tốt hơn."
    },
    "cannoli": {
        "name_vi": "Bánh kem Ý Cannoli",
        "calories": 280, "protein": 6, "carbs": 32, "fat": 14,
        "serving_g": 100, "category": "Tráng miệng",
        "tip": "Vỏ chiên + nhân kem ricotta + đường. Calo cao."
    },
    "caprese_salad": {
        "name_vi": "Salad Caprese (cà chua mozzarella)",
        "calories": 180, "protein": 8, "carbs": 5, "fat": 14,
        "serving_g": 200, "category": "Salad",
        "tip": "Đơn giản, lành mạnh. Cà chua + mozzarella tươi giàu canxi."
    },
    "carrot_cake": {
        "name_vi": "Bánh cà rốt",
        "calories": 408, "protein": 4, "carbs": 50, "fat": 22,
        "serving_g": 100, "category": "Tráng miệng",
        "tip": "Mặc dù có cà rốt, vẫn rất nhiều đường + dầu."
    },
    "ceviche": {
        "name_vi": "Cá tươi ngâm chanh Ceviche",
        "calories": 110, "protein": 18, "carbs": 4, "fat": 2,
        "serving_g": 200, "category": "Hải sản",
        "tip": "Cá sống ướp axit. Lành mạnh, ít calo."
    },
    "cheese_plate": {
        "name_vi": "Đĩa phô mai",
        "calories": 380, "protein": 23, "carbs": 3, "fat": 31,
        "serving_g": 100, "category": "Khai vị",
        "tip": "Calo và bão hòa cao. Ăn 30-50g/lần."
    },
    "chicken_quesadilla": {
        "name_vi": "Bánh kẹp Mexico Quesadilla gà",
        "calories": 270, "protein": 16, "carbs": 24, "fat": 13,
        "serving_g": 250, "category": "Fast food",
        "tip": "Phô mai + bột mì. Chọn vỏ nguyên cám tốt hơn."
    },
    "chocolate_mousse": {
        "name_vi": "Mousse socola",
        "calories": 290, "protein": 5, "carbs": 26, "fat": 19,
        "serving_g": 100, "category": "Tráng miệng",
        "tip": "Béo từ kem + lòng đỏ trứng. Ăn vừa phải."
    },
    "churros": {
        "name_vi": "Churros",
        "calories": 350, "protein": 4, "carbs": 41, "fat": 18,
        "serving_g": 100, "category": "Tráng miệng",
        "tip": "Bột chiên + đường. Cực kỳ nhiều calo."
    },
    "crab_cakes": {
        "name_vi": "Bánh cua chiên",
        "calories": 230, "protein": 14, "carbs": 12, "fat": 14,
        "serving_g": 150, "category": "Hải sản",
        "tip": "Cua giàu B12. Nhưng chiên nhiều dầu."
    },
    "croque_madame": {
        "name_vi": "Sandwich kiểu Pháp Croque Madame",
        "calories": 350, "protein": 17, "carbs": 23, "fat": 22,
        "serving_g": 250, "category": "Bữa nhẹ",
        "tip": "Phô mai + thịt nguội + trứng. Bữa giàu protein nhưng béo."
    },
    "deviled_eggs": {
        "name_vi": "Trứng cay nhồi",
        "calories": 195, "protein": 10, "carbs": 1, "fat": 16,
        "serving_g": 100, "category": "Khai vị",
        "tip": "Có lòng đỏ + mayonnaise. 2-3 quả là đủ."
    },
    "escargots": {
        "name_vi": "Ốc Pháp",
        "calories": 180, "protein": 16, "carbs": 2, "fat": 13,
        "serving_g": 100, "category": "Khai vị",
        "tip": "Bơ tỏi nhiều béo. Phụ nữ mang thai nên tránh."
    },
    "falafel": {
        "name_vi": "Falafel (đậu gà chiên)",
        "calories": 333, "protein": 13, "carbs": 32, "fat": 18,
        "serving_g": 100, "category": "Bữa nhẹ",
        "tip": "Protein thực vật cao. Chọn nướng thay vì chiên."
    },
    "filet_mignon": {
        "name_vi": "Bít tết Filet Mignon",
        "calories": 270, "protein": 27, "carbs": 0, "fat": 18,
        "serving_g": 200, "category": "Thịt",
        "tip": "Thịt thăn nội bò — nạc, ít gân. Lý tưởng cho người tập gym."
    },
    "foie_gras": {
        "name_vi": "Gan ngỗng béo",
        "calories": 462, "protein": 12, "carbs": 5, "fat": 44,
        "serving_g": 50, "category": "Khai vị",
        "tip": "Cực kỳ béo. Cholesterol rất cao — hạn chế."
    },
    "french_onion_soup": {
        "name_vi": "Súp hành tây kiểu Pháp",
        "calories": 165, "protein": 8, "carbs": 16, "fat": 8,
        "serving_g": 350, "category": "Súp",
        "tip": "Phô mai + bánh mì nướng phía trên. Khá nhiều natri."
    },
    "frozen_yogurt": {
        "name_vi": "Sữa chua đông lạnh",
        "calories": 159, "protein": 4, "carbs": 24, "fat": 6,
        "serving_g": 150, "category": "Tráng miệng",
        "tip": "Lành hơn kem nhưng vẫn có đường."
    },
    "gnocchi": {
        "name_vi": "Mì khoai tây Gnocchi",
        "calories": 130, "protein": 4, "carbs": 26, "fat": 1,
        "serving_g": 250, "category": "Mì Ý",
        "tip": "Ít béo nhưng tinh bột cao. Chọn sốt nhẹ."
    },
    "grilled_cheese_sandwich": {
        "name_vi": "Sandwich phô mai nướng",
        "calories": 290, "protein": 11, "carbs": 28, "fat": 16,
        "serving_g": 150, "category": "Bữa nhẹ",
        "tip": "Bơ + phô mai. Đơn giản nhưng nhiều bão hòa."
    },
    "gyoza": {
        "name_vi": "Há cảo Nhật Gyoza",
        "calories": 220, "protein": 9, "carbs": 24, "fat": 10,
        "serving_g": 150, "category": "Điểm tâm",
        "tip": "Áp chảo. 6-8 cái/bữa là đủ no."
    },
    "huevos_rancheros": {
        "name_vi": "Trứng kiểu Mexico",
        "calories": 210, "protein": 11, "carbs": 18, "fat": 11,
        "serving_g": 250, "category": "Bữa sáng",
        "tip": "Trứng + đậu + sốt cà. Cân bằng dinh dưỡng tốt."
    },
    "hummus": {
        "name_vi": "Hummus (đậu gà nghiền)",
        "calories": 166, "protein": 8, "carbs": 14, "fat": 10,
        "serving_g": 100, "category": "Khai vị",
        "tip": "Chất xơ cao, lành mạnh. Ăn kèm rau củ."
    },
    "lobster_roll_sandwich": {
        "name_vi": "Bánh mì kẹp tôm hùm",
        "calories": 220, "protein": 12, "carbs": 20, "fat": 11,
        "serving_g": 250, "category": "Hải sản",
        "tip": "Tôm hùm giàu B12. Nhưng có mayonnaise béo."
    },
    "mussels": {
        "name_vi": "Vẹm xanh hấp",
        "calories": 172, "protein": 24, "carbs": 7, "fat": 4,
        "serving_g": 200, "category": "Hải sản",
        "tip": "Giàu sắt, kẽm, B12. Rất tốt cho người thiếu máu."
    },
    "oysters": {
        "name_vi": "Hàu",
        "calories": 81, "protein": 9, "carbs": 5, "fat": 2,
        "serving_g": 100, "category": "Hải sản",
        "tip": "Giàu kẽm. Phụ nữ mang thai tránh ăn sống."
    },
    "pad_thai": {
        "name_vi": "Pad Thai (mì xào Thái)",
        "calories": 156, "protein": 7, "carbs": 24, "fat": 4,
        "serving_g": 350, "category": "Mì xào",
        "tip": "Sốt me ngọt — hơi nhiều đường. Ăn kèm chanh."
    },
    "paella": {
        "name_vi": "Cơm hải sản Tây Ban Nha Paella",
        "calories": 145, "protein": 9, "carbs": 21, "fat": 3,
        "serving_g": 400, "category": "Cơm",
        "tip": "Hải sản + gạo + nghệ. Cân bằng tốt."
    },
    "peking_duck": {
        "name_vi": "Vịt quay Bắc Kinh",
        "calories": 337, "protein": 19, "carbs": 0, "fat": 28,
        "serving_g": 200, "category": "Thịt",
        "tip": "Da vịt rất béo. Ăn ít, kèm bánh tráng + dưa leo."
    },
    "pork_chop": {
        "name_vi": "Sườn heo nướng",
        "calories": 231, "protein": 26, "carbs": 0, "fat": 14,
        "serving_g": 200, "category": "Thịt",
        "tip": "Chọn miếng nạc, cắt bớt mỡ trước khi nướng."
    },
    "poutine": {
        "name_vi": "Khoai chiên phô mai (Canada)",
        "calories": 300, "protein": 8, "carbs": 30, "fat": 17,
        "serving_g": 300, "category": "Fast food",
        "tip": "Khoai chiên + phô mai + sốt. Calo siêu cao."
    },
    "prime_rib": {
        "name_vi": "Sườn bò nướng Prime Rib",
        "calories": 338, "protein": 22, "carbs": 0, "fat": 28,
        "serving_g": 250, "category": "Thịt",
        "tip": "Bò mỡ vân đẹp. Ăn ít — bão hòa cao."
    },
    "pulled_pork_sandwich": {
        "name_vi": "Bánh mì thịt heo BBQ",
        "calories": 250, "protein": 14, "carbs": 22, "fat": 12,
        "serving_g": 250, "category": "Bữa nhẹ",
        "tip": "Sốt BBQ nhiều đường. 1 cái nhỏ là đủ."
    },
    "ravioli": {
        "name_vi": "Mì Ý nhân Ravioli",
        "calories": 150, "protein": 7, "carbs": 23, "fat": 4,
        "serving_g": 250, "category": "Mì Ý",
        "tip": "Tùy nhân — phô mai, thịt, hay rau. Chọn nhân rau lành hơn."
    },
    "red_velvet_cake": {
        "name_vi": "Bánh Red Velvet",
        "calories": 367, "protein": 4, "carbs": 47, "fat": 19,
        "serving_g": 100, "category": "Tráng miệng",
        "tip": "Đường + bơ rất cao. Có phẩm màu đỏ."
    },
    "risotto": {
        "name_vi": "Cơm Ý Risotto",
        "calories": 174, "protein": 4, "carbs": 22, "fat": 8,
        "serving_g": 300, "category": "Cơm",
        "tip": "Bơ + phô mai làm tăng calo. Chọn risotto rau củ tốt hơn."
    },
    "samosa": {
        "name_vi": "Bánh Samosa Ấn Độ",
        "calories": 308, "protein": 5, "carbs": 32, "fat": 18,
        "serving_g": 100, "category": "Khai vị",
        "tip": "Vỏ chiên + nhân khoai cay. Calo cao."
    },
    "sashimi": {
        "name_vi": "Sashimi (cá sống Nhật)",
        "calories": 130, "protein": 22, "carbs": 0, "fat": 4,
        "serving_g": 150, "category": "Hải sản",
        "tip": "Cá hồi sashimi giàu omega-3. Lý tưởng cho người ăn kiêng."
    },
    "scallops": {
        "name_vi": "Sò điệp",
        "calories": 137, "protein": 24, "carbs": 6, "fat": 1,
        "serving_g": 150, "category": "Hải sản",
        "tip": "Protein cao, ít béo. Tuyệt vời cho người giảm cân."
    },
    "seaweed_salad": {
        "name_vi": "Salad rong biển",
        "calories": 70, "protein": 1, "carbs": 9, "fat": 3,
        "serving_g": 100, "category": "Salad",
        "tip": "Giàu i-ốt và khoáng chất. Lý tưởng cho tuyến giáp."
    },
    "shrimp_and_grits": {
        "name_vi": "Tôm với cháo ngô (Mỹ)",
        "calories": 215, "protein": 14, "carbs": 18, "fat": 10,
        "serving_g": 350, "category": "Hải sản",
        "tip": "Cháo ngô + bơ + phô mai. Calo cao."
    },
    "takoyaki": {
        "name_vi": "Takoyaki (bánh bạch tuộc Nhật)",
        "calories": 195, "protein": 8, "carbs": 25, "fat": 7,
        "serving_g": 150, "category": "Khai vị",
        "tip": "Sốt nhiều đường + mayonnaise. 4-6 viên là đủ."
    },
    "tuna_tartare": {
        "name_vi": "Cá ngừ tartare",
        "calories": 145, "protein": 23, "carbs": 2, "fat": 5,
        "serving_g": 150, "category": "Hải sản",
        "tip": "Cá sống — chọn nhà hàng uy tín. Giàu omega-3."
    },
}

# Mapping mở rộng cho món Việt (CLIP zero-shot có thể nhận)
VIETNAMESE_FOOD_LABELS = [
    # Bún & phở
    "phở bò", "phở gà", "bún chả", "bún bò Huế", "bún riêu", "bún thịt nướng",
    "bún cá", "bún ốc", "bún mọc", "bún đậu mắm tôm", "hủ tiếu", "mì quảng",
    "cao lầu", "bánh canh", "miến gà", "miến lươn",
    # Cơm
    "cơm tấm", "cơm gà", "cơm chiên", "cơm rang dưa bò", "cơm âm phủ",
    # Cháo
    "cháo gà", "cháo lòng", "cháo trắng",
    # Bánh
    "bánh mì thịt", "bánh xèo", "bánh khọt", "bánh cuốn", "bánh giò",
    "bánh chưng", "bánh tét", "bánh bao", "bánh bèo", "bánh nậm", "bánh ít",
    # Khai vị / cuốn
    "gỏi cuốn", "chả giò", "nem nướng", "nem chua", "chả lụa",
    # Món mặn
    "thịt kho tàu", "cá kho tộ", "thịt nướng", "sườn nướng", "ba chỉ rang cháy",
    "gà luộc", "gà kho gừng", "vịt nướng", "vịt quay",
    # Canh & lẩu
    "canh chua cá", "canh khổ qua", "canh rau ngót", "lẩu", "lẩu thái",
    # Hải sản
    "tôm rang", "mực hấp", "ốc hương", "ngao xào", "cua rang me",
    # Khác
    "bò lúc lắc", "gà nướng", "rau muống xào", "đậu hũ chiên",
    "hột vịt lộn", "trứng cuộn",
    # Đồ uống & tráng miệng
    "trà sữa", "chè", "sinh tố", "cà phê sữa đá", "sữa chua nếp cẩm",
    "nước mía", "sương sáo", "sương sa hạt lựu",
]

VIETNAMESE_FOOD_NUTRITION = {
    "phở bò": NUTRITION_DB["pho"],
    "bún chả": {"name_vi": "Bún chả", "calories": 145, "protein": 9, "carbs": 18, "fat": 4, "serving_g": 400, "category": "Mì sợi & nước", "tip": "Cân bằng. Hạn chế nước mắm chấm nếu cao huyết áp."},
    "bún bò Huế": {"name_vi": "Bún bò Huế", "calories": 110, "protein": 8, "carbs": 14, "fat": 3, "serving_g": 500, "category": "Mì sợi & nước", "tip": "Cay nóng. Người dạ dày nhạy cảm cần lưu ý."},
    "bún riêu": {"name_vi": "Bún riêu", "calories": 90, "protein": 6, "carbs": 13, "fat": 2, "serving_g": 500, "category": "Mì sợi & nước", "tip": "Cua giàu canxi. Phù hợp người loãng xương."},
    "bún thịt nướng": {"name_vi": "Bún thịt nướng", "calories": 155, "protein": 10, "carbs": 22, "fat": 4, "serving_g": 400, "category": "Mì sợi & nước", "tip": "Đạm vừa phải, kèm rau sống tốt."},
    "cơm tấm": {"name_vi": "Cơm tấm sườn", "calories": 165, "protein": 9, "carbs": 28, "fat": 5, "serving_g": 400, "category": "Cơm", "tip": "Sườn nướng có đường + mỡ. Ăn dĩa nhỏ."},
    "cơm gà": {"name_vi": "Cơm gà", "calories": 175, "protein": 12, "carbs": 26, "fat": 4, "serving_g": 400, "category": "Cơm", "tip": "Gà luộc/hấp lành mạnh hơn gà chiên."},
    "cháo gà": {"name_vi": "Cháo gà", "calories": 70, "protein": 5, "carbs": 11, "fat": 1, "serving_g": 400, "category": "Cháo", "tip": "Dễ tiêu, tốt khi ốm hoặc bệnh dạ dày."},
    "cháo lòng": {"name_vi": "Cháo lòng", "calories": 110, "protein": 7, "carbs": 14, "fat": 4, "serving_g": 400, "category": "Cháo", "tip": "Lòng nội tạng có cholesterol cao."},
    "bánh mì thịt": {"name_vi": "Bánh mì thịt", "calories": 250, "protein": 9, "carbs": 32, "fat": 9, "serving_g": 200, "category": "Bữa nhẹ", "tip": "Tiện lợi. Thêm rau dưa để cân bằng."},
    "bánh xèo": {"name_vi": "Bánh xèo", "calories": 200, "protein": 7, "carbs": 22, "fat": 9, "serving_g": 250, "category": "Bánh truyền thống", "tip": "Vỏ chiên nhiều dầu. 1 cái nhỏ là đủ."},
    "bánh khọt": {"name_vi": "Bánh khọt", "calories": 195, "protein": 5, "carbs": 24, "fat": 8, "serving_g": 200, "category": "Bánh truyền thống", "tip": "Tương tự bánh xèo."},
    "bánh cuốn": {"name_vi": "Bánh cuốn", "calories": 130, "protein": 5, "carbs": 21, "fat": 3, "serving_g": 250, "category": "Bánh truyền thống", "tip": "Hấp, ít calo. Lựa chọn tốt cho bữa sáng."},
    "bánh giò": {"name_vi": "Bánh giò", "calories": 170, "protein": 5, "carbs": 26, "fat": 5, "serving_g": 200, "category": "Bánh truyền thống", "tip": "No bụng, vừa phải."},
    "gỏi cuốn": {"name_vi": "Gỏi cuốn tươi", "calories": 110, "protein": 5, "carbs": 16, "fat": 2, "serving_g": 80, "category": "Khai vị", "tip": "Tươi, ít calo. Lý tưởng cho giảm cân."},
    "chả giò": {"name_vi": "Chả giò", "calories": 220, "protein": 6, "carbs": 22, "fat": 12, "serving_g": 100, "category": "Khai vị", "tip": "Chiên, nhiều dầu. Hạn chế ăn nhiều."},
    "nem nướng": {"name_vi": "Nem nướng", "calories": 235, "protein": 14, "carbs": 8, "fat": 16, "serving_g": 150, "category": "Khai vị", "tip": "Đạm cao nhưng béo cũng cao."},
    "thịt kho tàu": {"name_vi": "Thịt kho tàu", "calories": 250, "protein": 17, "carbs": 5, "fat": 18, "serving_g": 200, "category": "Món mặn", "tip": "Mỡ + đường nhiều. Ăn ít, kèm cơm + canh."},
    "cá kho tộ": {"name_vi": "Cá kho tộ", "calories": 165, "protein": 18, "carbs": 4, "fat": 9, "serving_g": 150, "category": "Hải sản", "tip": "Giàu omega-3 từ cá. Ngon."},
    "canh chua cá": {"name_vi": "Canh chua cá", "calories": 60, "protein": 5, "carbs": 6, "fat": 2, "serving_g": 350, "category": "Súp", "tip": "Canh thanh đạm, dễ tiêu."},
    "lẩu": {"name_vi": "Lẩu", "calories": 80, "protein": 7, "carbs": 6, "fat": 4, "serving_g": 500, "category": "Món hầm", "tip": "Tùy nguyên liệu. Hạn chế nước béo + viên thả lẩu."},
    "bò lúc lắc": {"name_vi": "Bò lúc lắc", "calories": 220, "protein": 22, "carbs": 8, "fat": 11, "serving_g": 200, "category": "Thịt", "tip": "Đạm cao. Ăn kèm rau xà lách."},
    "gà nướng": {"name_vi": "Gà nướng", "calories": 200, "protein": 25, "carbs": 2, "fat": 10, "serving_g": 200, "category": "Thịt", "tip": "Ức gà nướng là lựa chọn tốt cho thể hình."},
    "tôm rang": {"name_vi": "Tôm rang", "calories": 145, "protein": 18, "carbs": 5, "fat": 6, "serving_g": 150, "category": "Hải sản", "tip": "Giàu protein, ít chất béo."},
    "trà sữa": {"name_vi": "Trà sữa trân châu", "calories": 270, "protein": 2, "carbs": 38, "fat": 11, "serving_g": 500, "category": "Đồ uống", "tip": "Đường cực cao. Yêu cầu giảm 50% đường."},
    "chè": {"name_vi": "Chè", "calories": 180, "protein": 3, "carbs": 35, "fat": 4, "serving_g": 250, "category": "Tráng miệng", "tip": "Đường cao nhưng có đậu/đỗ giàu chất xơ."},
    "sinh tố": {"name_vi": "Sinh tố trái cây", "calories": 130, "protein": 2, "carbs": 26, "fat": 2, "serving_g": 350, "category": "Đồ uống", "tip": "Lành nếu ít đường + sữa đặc."},
    "rau muống xào": {"name_vi": "Rau muống xào tỏi", "calories": 65, "protein": 3, "carbs": 6, "fat": 4, "serving_g": 200, "category": "Rau", "tip": "Lý tưởng. Giàu sắt và chất xơ."},
    "đậu hũ chiên": {"name_vi": "Đậu hũ chiên", "calories": 180, "protein": 12, "carbs": 5, "fat": 13, "serving_g": 150, "category": "Đậu", "tip": "Protein thực vật tốt, nhưng chiên nhiều dầu."},

    # ─── Bổ sung món Việt ───
    "phở gà": {"name_vi": "Phở gà", "calories": 75, "protein": 8, "carbs": 11, "fat": 1, "serving_g": 500, "category": "Mì sợi & nước", "tip": "Nhẹ hơn phở bò, ít béo. Tốt cho bữa sáng."},
    "bún cá": {"name_vi": "Bún cá", "calories": 95, "protein": 7, "carbs": 13, "fat": 2, "serving_g": 500, "category": "Mì sợi & nước", "tip": "Cá giàu omega-3 và đạm dễ tiêu. Lành mạnh."},
    "bún ốc": {"name_vi": "Bún ốc", "calories": 85, "protein": 6, "carbs": 12, "fat": 2, "serving_g": 500, "category": "Mì sợi & nước", "tip": "Ốc giàu sắt và canxi. Tốt cho người thiếu máu."},
    "bún mọc": {"name_vi": "Bún mọc", "calories": 105, "protein": 7, "carbs": 14, "fat": 3, "serving_g": 500, "category": "Mì sợi & nước", "tip": "Mọc làm từ giò sống — cân bằng đạm + tinh bột."},
    "bún đậu mắm tôm": {"name_vi": "Bún đậu mắm tôm", "calories": 240, "protein": 11, "carbs": 26, "fat": 11, "serving_g": 350, "category": "Mì sợi", "tip": "Đậu chiên + chả nướng. Mắm tôm rất mặn — hạn chế."},
    "hủ tiếu": {"name_vi": "Hủ tiếu", "calories": 120, "protein": 8, "carbs": 17, "fat": 3, "serving_g": 500, "category": "Mì sợi & nước", "tip": "Có nhiều biến thể. Hủ tiếu khô ít calo hơn nước."},
    "mì quảng": {"name_vi": "Mì Quảng", "calories": 130, "protein": 8, "carbs": 18, "fat": 3, "serving_g": 400, "category": "Mì sợi & nước", "tip": "Đặc sản Quảng Nam. Nước dùng đậm đà."},
    "cao lầu": {"name_vi": "Cao lầu", "calories": 145, "protein": 9, "carbs": 20, "fat": 4, "serving_g": 350, "category": "Mì sợi", "tip": "Đặc sản Hội An. Mì dai, ít nước, vị riêng."},
    "bánh canh": {"name_vi": "Bánh canh", "calories": 115, "protein": 6, "carbs": 18, "fat": 2, "serving_g": 450, "category": "Mì sợi & nước", "tip": "Bánh canh cua giò heo có nhiều mỡ — chọn bánh canh chả cá."},
    "miến gà": {"name_vi": "Miến gà", "calories": 90, "protein": 7, "carbs": 13, "fat": 1, "serving_g": 400, "category": "Mì sợi & nước", "tip": "Miến từ đậu xanh — ít calo, không gluten. Tốt cho giảm cân."},
    "miến lươn": {"name_vi": "Miến lươn", "calories": 110, "protein": 9, "carbs": 14, "fat": 2, "serving_g": 400, "category": "Mì sợi & nước", "tip": "Lươn giàu protein và DHA. Tốt cho não bộ."},
    "cơm rang dưa bò": {"name_vi": "Cơm rang dưa bò", "calories": 175, "protein": 9, "carbs": 25, "fat": 5, "serving_g": 350, "category": "Cơm", "tip": "Dưa cải có lợi khuẩn. Nhưng cơm rang nhiều dầu."},
    "cơm âm phủ": {"name_vi": "Cơm âm phủ Huế", "calories": 160, "protein": 8, "carbs": 24, "fat": 4, "serving_g": 400, "category": "Cơm", "tip": "Cơm trộn với 7 loại topping. Đẹp mắt, đủ chất."},
    "cháo trắng": {"name_vi": "Cháo trắng", "calories": 60, "protein": 1, "carbs": 14, "fat": 0, "serving_g": 350, "category": "Cháo", "tip": "Dễ tiêu nhất. Phù hợp khi ốm hoặc kiêng."},
    "bánh chưng": {"name_vi": "Bánh chưng", "calories": 195, "protein": 5, "carbs": 31, "fat": 6, "serving_g": 200, "category": "Bánh truyền thống", "tip": "Calo cao. 1 miếng nhỏ ngày Tết là đủ."},
    "bánh tét": {"name_vi": "Bánh tét", "calories": 200, "protein": 5, "carbs": 32, "fat": 6, "serving_g": 200, "category": "Bánh truyền thống", "tip": "Tương tự bánh chưng. Bánh tét chuối ngọt hơn."},
    "bánh bao": {"name_vi": "Bánh bao", "calories": 220, "protein": 8, "carbs": 30, "fat": 7, "serving_g": 150, "category": "Điểm tâm", "tip": "Hấp, không chiên. 1-2 cái nhỏ là đủ no."},
    "bánh bèo": {"name_vi": "Bánh bèo", "calories": 110, "protein": 4, "carbs": 19, "fat": 2, "serving_g": 200, "category": "Bánh truyền thống", "tip": "Đặc sản Huế. Hấp, ít calo."},
    "bánh nậm": {"name_vi": "Bánh nậm", "calories": 105, "protein": 4, "carbs": 18, "fat": 2, "serving_g": 200, "category": "Bánh truyền thống", "tip": "Đặc sản Huế, gói lá chuối hấp. Lành mạnh."},
    "bánh ít": {"name_vi": "Bánh ít", "calories": 200, "protein": 4, "carbs": 35, "fat": 5, "serving_g": 150, "category": "Bánh truyền thống", "tip": "Bánh nếp ngọt — đường cao, người tiểu đường nên tránh."},
    "nem chua": {"name_vi": "Nem chua", "calories": 195, "protein": 12, "carbs": 5, "fat": 14, "serving_g": 100, "category": "Khai vị", "tip": "Thịt sống lên men — chỉ ăn ở nguồn uy tín."},
    "chả lụa": {"name_vi": "Chả lụa (giò lụa)", "calories": 215, "protein": 14, "carbs": 4, "fat": 16, "serving_g": 100, "category": "Khai vị", "tip": "Có muối + bột nhiều. Hạn chế nếu cao huyết áp."},
    "thịt nướng": {"name_vi": "Thịt heo nướng", "calories": 230, "protein": 18, "carbs": 6, "fat": 15, "serving_g": 200, "category": "Thịt", "tip": "Chọn miếng nạc. Ăn kèm rau sống."},
    "sườn nướng": {"name_vi": "Sườn heo nướng", "calories": 280, "protein": 20, "carbs": 8, "fat": 19, "serving_g": 250, "category": "Thịt", "tip": "Mỡ + đường ướp nhiều. 1 miếng/bữa là đủ."},
    "ba chỉ rang cháy": {"name_vi": "Ba chỉ rang cháy cạnh", "calories": 320, "protein": 17, "carbs": 5, "fat": 27, "serving_g": 200, "category": "Thịt", "tip": "Mỡ rất cao. Không phù hợp với người mỡ máu."},
    "gà luộc": {"name_vi": "Gà luộc", "calories": 165, "protein": 25, "carbs": 0, "fat": 7, "serving_g": 200, "category": "Thịt", "tip": "Bóc da để giảm béo. Giàu protein cho gym."},
    "gà kho gừng": {"name_vi": "Gà kho gừng", "calories": 195, "protein": 19, "carbs": 7, "fat": 10, "serving_g": 200, "category": "Thịt", "tip": "Gừng tốt cho tiêu hóa. Cân bằng tốt."},
    "vịt nướng": {"name_vi": "Vịt nướng", "calories": 270, "protein": 19, "carbs": 4, "fat": 20, "serving_g": 200, "category": "Thịt", "tip": "Vịt béo hơn gà. Bóc da để giảm calo."},
    "vịt quay": {"name_vi": "Vịt quay", "calories": 310, "protein": 17, "carbs": 0, "fat": 27, "serving_g": 200, "category": "Thịt", "tip": "Da giòn rất béo. 1 phần nhỏ kèm cơm + dưa leo."},
    "canh khổ qua": {"name_vi": "Canh khổ qua nhồi thịt", "calories": 55, "protein": 5, "carbs": 5, "fat": 2, "serving_g": 350, "category": "Súp", "tip": "Khổ qua giúp hạ đường huyết. Tốt cho tiểu đường."},
    "canh rau ngót": {"name_vi": "Canh rau ngót", "calories": 35, "protein": 3, "carbs": 4, "fat": 1, "serving_g": 350, "category": "Súp", "tip": "Rau ngót lành. Phụ nữ mang thai 3 tháng đầu nên hạn chế."},
    "lẩu thái": {"name_vi": "Lẩu Thái", "calories": 95, "protein": 8, "carbs": 7, "fat": 5, "serving_g": 500, "category": "Món hầm", "tip": "Cay chua. Hạn chế nước béo và viên thả."},
    "mực hấp": {"name_vi": "Mực hấp", "calories": 92, "protein": 16, "carbs": 3, "fat": 1, "serving_g": 200, "category": "Hải sản", "tip": "Protein cao, gần như không béo. Lý tưởng giảm cân."},
    "ốc hương": {"name_vi": "Ốc hương", "calories": 87, "protein": 13, "carbs": 5, "fat": 1, "serving_g": 200, "category": "Hải sản", "tip": "Giàu kẽm và sắt. Ăn kèm rau răm."},
    "ngao xào": {"name_vi": "Ngao xào", "calories": 110, "protein": 14, "carbs": 5, "fat": 4, "serving_g": 200, "category": "Hải sản", "tip": "Ngao giàu iod tốt cho tuyến giáp."},
    "cua rang me": {"name_vi": "Cua rang me", "calories": 165, "protein": 17, "carbs": 11, "fat": 7, "serving_g": 250, "category": "Hải sản", "tip": "Sốt me ngọt — đường khá cao."},
    "hột vịt lộn": {"name_vi": "Hột vịt lộn", "calories": 185, "protein": 14, "carbs": 1, "fat": 14, "serving_g": 80, "category": "Khai vị", "tip": "Cholesterol cao. Người bệnh tim mạch hạn chế."},
    "trứng cuộn": {"name_vi": "Trứng cuộn", "calories": 175, "protein": 12, "carbs": 2, "fat": 13, "serving_g": 150, "category": "Bữa sáng", "tip": "Protein tốt. Giảm dầu khi chiên."},
    "cà phê sữa đá": {"name_vi": "Cà phê sữa đá", "calories": 120, "protein": 2, "carbs": 18, "fat": 4, "serving_g": 250, "category": "Đồ uống", "tip": "Sữa đặc rất ngọt. Yêu cầu giảm sữa nếu giảm cân."},
    "sữa chua nếp cẩm": {"name_vi": "Sữa chua nếp cẩm", "calories": 155, "protein": 5, "carbs": 27, "fat": 3, "serving_g": 200, "category": "Tráng miệng", "tip": "Probiotics + chất xơ từ nếp cẩm. Tốt cho tiêu hóa."},
    "nước mía": {"name_vi": "Nước mía", "calories": 75, "protein": 0, "carbs": 19, "fat": 0, "serving_g": 350, "category": "Đồ uống", "tip": "Đường tự nhiên cao. Người tiểu đường tránh."},
    "sương sáo": {"name_vi": "Sương sáo", "calories": 80, "protein": 1, "carbs": 19, "fat": 0, "serving_g": 250, "category": "Tráng miệng", "tip": "Giải nhiệt mùa hè. Ít calo."},
    "sương sa hạt lựu": {"name_vi": "Sương sa hạt lựu", "calories": 165, "protein": 2, "carbs": 32, "fat": 4, "serving_g": 250, "category": "Tráng miệng", "tip": "Đường + nước cốt dừa khá nhiều."},

    # ─── Bổ sung từ dataset 30VNFoods ───
    "bánh bột lọc": {"name_vi": "Bánh bột lọc", "calories": 150, "protein": 5, "carbs": 26, "fat": 3, "serving_g": 200, "category": "Bánh truyền thống", "tip": "Đặc sản Huế, vỏ bột năng trong suốt nhân tôm thịt. Hấp ít calo."},
    "bánh căn": {"name_vi": "Bánh căn", "calories": 175, "protein": 6, "carbs": 22, "fat": 7, "serving_g": 200, "category": "Bánh truyền thống", "tip": "Đặc sản Phan Thiết. Vỏ giòn, ăn kèm nước chấm cá."},
    "bánh đúc": {"name_vi": "Bánh đúc", "calories": 120, "protein": 3, "carbs": 22, "fat": 2, "serving_g": 200, "category": "Bánh truyền thống", "tip": "Bánh đúc nóng có thịt, hành phi. Bánh đúc lá ngọt nhiều đường."},
    "bánh pía": {"name_vi": "Bánh pía", "calories": 380, "protein": 6, "carbs": 50, "fat": 17, "serving_g": 100, "category": "Tráng miệng", "tip": "Đặc sản Sóc Trăng, nhân đậu xanh + sầu riêng. Đường cao."},
    "bánh tráng nướng": {"name_vi": "Bánh tráng nướng", "calories": 230, "protein": 8, "carbs": 30, "fat": 9, "serving_g": 150, "category": "Bánh truyền thống", "tip": "'Pizza Đà Lạt'. Nhiều topping nên calo cao."},
    "bún mắm": {"name_vi": "Bún mắm", "calories": 120, "protein": 9, "carbs": 14, "fat": 4, "serving_g": 500, "category": "Mì sợi & nước", "tip": "Đặc sản miền Tây. Nước dùng đậm vị mắm, rất mặn."},
    "xôi xéo": {"name_vi": "Xôi xéo", "calories": 230, "protein": 5, "carbs": 42, "fat": 5, "serving_g": 200, "category": "Cơm", "tip": "Xôi nếp + đậu xanh + hành phi. No bụng nhanh."},
}


def get_nutrition(label: str) -> Optional[dict]:
    """Lookup nutrition info bằng label English (Food-101) hoặc tiếng Việt."""
    if label in NUTRITION_DB:
        return NUTRITION_DB[label]
    if label in VIETNAMESE_FOOD_NUTRITION:
        return VIETNAMESE_FOOD_NUTRITION[label]
    return None


def estimate_total_nutrition(per_100g: dict, portion_multiplier: float = 1.0) -> dict:
    """Estimate dinh dưỡng cho 1 phần ăn dựa vào serving_g."""
    serving = per_100g.get("serving_g", 100)
    factor = (serving * portion_multiplier) / 100
    return {
        "calories": round(per_100g["calories"] * factor),
        "protein": round(per_100g["protein"] * factor, 1),
        "carbs": round(per_100g["carbs"] * factor, 1),
        "fat": round(per_100g["fat"] * factor, 1),
        "estimated_serving_g": round(serving * portion_multiplier),
    }
