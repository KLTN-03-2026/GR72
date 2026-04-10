export type FoodSourceType = 'noi_bo' | 'thu_cong' | 'api_ngoai';

export type FoodGroupSummary = {
  id: number;
  ten: string;
  slug: string;
  mo_ta?: string | null;
};

export type PublicFood = {
  id: number;
  nhom_thuc_pham_id: number;
  nhom_thuc_pham: FoodGroupSummary | null;
  ten: string;
  slug: string;
  mo_ta: string | null;
  the_gan: string[];
  loai_nguon: FoodSourceType;
  ten_nguon: string | null;
  ma_nguon: string | null;
  khau_phan_tham_chieu: number;
  don_vi_khau_phan: string;
  calories_100g: number;
  protein_100g: number;
  carb_100g: number;
  fat_100g: number;
  chat_xo_100g: number;
  duong_100g: number;
  natri_100g: number;
  du_lieu_goc: Record<string, unknown> | null;
  da_xac_minh: boolean;
  tao_boi: number | null;
  cap_nhat_boi: number | null;
  tao_luc: string;
  cap_nhat_luc: string;
};
