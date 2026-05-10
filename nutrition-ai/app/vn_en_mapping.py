"""
Mapping tên món Việt → mô tả tiếng Anh để CLIP zero-shot match tốt hơn.
CLIP được train trên web text English, nên prompt tiếng Anh accuracy cao hơn ~15%.
"""

VN_TO_EN_DESCRIPTION = {
    # Bún & phở
    "phở bò": "vietnamese pho bo with beef and rice noodles in clear broth",
    "phở gà": "vietnamese pho ga with chicken and rice noodles",
    "bún chả": "vietnamese bun cha with grilled pork patties and noodles",
    "bún bò Huế": "spicy vietnamese bun bo hue beef noodle soup",
    "bún riêu": "vietnamese bun rieu crab noodle soup with tomato",
    "bún thịt nướng": "vietnamese grilled pork rice vermicelli noodle bowl",
    "bún cá": "vietnamese bun ca fish noodle soup",
    "bún ốc": "vietnamese bun oc snail noodle soup",
    "bún mọc": "vietnamese bun moc pork meatball noodle soup",
    "bún đậu mắm tôm": "vietnamese bun dau mam tom with fried tofu and shrimp paste",
    "hủ tiếu": "vietnamese hu tieu rice noodle soup with pork",
    "mì quảng": "vietnamese mi quang turmeric noodles with shrimp pork",
    "cao lầu": "vietnamese cao lau hoi an thick noodle dish",
    "bánh canh": "vietnamese banh canh thick udon-like noodle soup",
    "miến gà": "vietnamese mien ga glass noodle chicken soup",
    "miến lươn": "vietnamese mien luon eel glass noodle dish",

    # Cơm
    "cơm tấm": "vietnamese com tam broken rice with grilled pork chop",
    "cơm gà": "vietnamese chicken rice com ga",
    "cơm chiên": "vietnamese fried rice with vegetables and meat",
    "cơm rang dưa bò": "vietnamese fried rice with pickled cabbage and beef",
    "cơm âm phủ": "vietnamese hue mixed rice com am phu",

    # Cháo
    "cháo gà": "vietnamese chicken congee chao ga porridge",
    "cháo lòng": "vietnamese pork offal congee chao long",
    "cháo trắng": "plain vietnamese rice porridge congee",

    # Bánh
    "bánh mì thịt": "vietnamese banh mi sandwich with pork and pickled vegetables",
    "bánh xèo": "vietnamese crispy crepe banh xeo with shrimp pork bean sprouts",
    "bánh khọt": "vietnamese banh khot mini savory pancakes with shrimp",
    "bánh cuốn": "vietnamese steamed rice rolls banh cuon",
    "bánh giò": "vietnamese pyramid rice dumpling banh gio in banana leaf",
    "bánh chưng": "vietnamese square sticky rice cake banh chung tet new year",
    "bánh tét": "vietnamese cylindrical sticky rice cake banh tet",
    "bánh bao": "vietnamese steamed pork bun banh bao",
    "bánh bèo": "vietnamese small rice cakes banh beo with shrimp topping",
    "bánh nậm": "vietnamese flat steamed rice dumpling banh nam in banana leaf",
    "bánh ít": "vietnamese banh it sticky rice cake with mung bean filling",

    # Khai vị / cuốn
    "gỏi cuốn": "vietnamese fresh spring rolls goi cuon with shrimp pork rice paper",
    "chả giò": "vietnamese fried spring rolls cha gio nem ran crispy",
    "nem nướng": "vietnamese grilled pork sausage nem nuong",
    "nem chua": "vietnamese fermented pork roll nem chua",
    "chả lụa": "vietnamese pork sausage cha lua gio lua",

    # Món mặn
    "thịt kho tàu": "vietnamese caramelized pork belly with eggs thit kho",
    "cá kho tộ": "vietnamese braised fish in clay pot ca kho to",
    "thịt nướng": "vietnamese grilled pork thit nuong",
    "sườn nướng": "vietnamese grilled pork ribs suon nuong",
    "ba chỉ rang cháy": "vietnamese caramelized pork belly stir fry",
    "gà luộc": "vietnamese boiled chicken ga luoc",
    "gà kho gừng": "vietnamese braised chicken with ginger",
    "vịt nướng": "vietnamese grilled duck",
    "vịt quay": "vietnamese roasted duck vit quay",

    # Canh & lẩu
    "canh chua cá": "vietnamese sour fish soup canh chua",
    "canh khổ qua": "vietnamese stuffed bitter melon soup",
    "canh rau ngót": "vietnamese sweet leaf spinach soup",
    "lẩu": "vietnamese hot pot lau with vegetables and meat",
    "lẩu thái": "vietnamese tom yum thai hot pot",

    # Hải sản
    "tôm rang": "vietnamese stir-fried shrimp tom rang",
    "mực hấp": "vietnamese steamed squid muc hap",
    "ốc hương": "vietnamese stir-fried sweet snails oc huong",
    "ngao xào": "vietnamese stir-fried clams ngao xao",
    "cua rang me": "vietnamese tamarind crab cua rang me",

    # Khác
    "bò lúc lắc": "vietnamese shaking beef bo luc lac",
    "gà nướng": "vietnamese grilled chicken ga nuong",
    "rau muống xào": "vietnamese stir-fried water spinach with garlic",
    "đậu hũ chiên": "vietnamese fried tofu dau hu chien",
    "hột vịt lộn": "vietnamese balut fertilized duck egg hot vit lon",
    "trứng cuộn": "vietnamese rolled omelette",

    # Đồ uống & tráng miệng
    "trà sữa": "vietnamese boba bubble tea milk tea with tapioca pearls",
    "chè": "vietnamese sweet dessert soup che",
    "sinh tố": "vietnamese fruit smoothie sinh to",
    "cà phê sữa đá": "vietnamese iced coffee with condensed milk ca phe sua da",
    "sữa chua nếp cẩm": "vietnamese yogurt with black sticky rice",
    "nước mía": "vietnamese sugarcane juice nuoc mia",
    "sương sáo": "vietnamese grass jelly drink suong sao",
    "sương sa hạt lựu": "vietnamese pomegranate seed dessert with coconut milk",
}
