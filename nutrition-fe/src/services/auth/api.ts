import { AUTH_API_PREFIX } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  message?: string | string[];
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type LoginPayload = {
  email: string;
  matKhau: string;
};

type RegisterPayload = {
  vaiTro: 'nguoi_dung' | 'chuyen_gia_dinh_duong';
  hoTen: string;
  email: string;
  matKhau: string;
  chuyenMon?: string;
  moTa?: string;
  kinhNghiem?: string;
  hocVi?: string;
  chungChi?: string;
  gioLamViec?: string;
  anhDaiDienUrl?: string;
};

type ForgotPasswordPayload = {
  email: string;
};

type ResetPasswordPayload = {
  email: string;
  matKhauMoi: string;
  maDatLai: string;
};

type VerifyOtpPayload = {
  email: string;
  maOtp: string;
};

type SendOtpPayload = {
  email: string;
  loai?: 'xac_thuc' | 'dat_lai_mat_khau';
};

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${AUTH_API_PREFIX}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const rawMessage = payload?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage || 'Yêu cầu thất bại';

    throw new ApiError(message, response.status);
  }

  return payload as ApiSuccessResponse<T>;
}

// ====== SIGN IN ======
export async function login(payload: LoginPayload) {
  const response = await request<{ user: AuthUser }>('/sign-in', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data.user;
}

// ====== SIGN OUT ======
export async function logout() {
  await request<null>('/sign-out', {
    method: 'POST',
  });
}

// ====== GET CURRENT USER ======
export async function getCurrentUser() {
  const response = await request<AuthUser | null>('/me', {
    method: 'GET',
  });

  return response.data;
}

// ====== REGISTER (sign-up) ======
export async function register(payload: RegisterPayload): Promise<{
  id: number;
  email: string;
  ho_ten: string;
  vai_tro: string;
  payment_url?: string;
}> {
  const response = await request<{
    id: number;
    email: string;
    ho_ten: string;
    vai_tro: string;
    trang_thai?: string;
    trang_thai_thanh_toan?: string;
  }>('/sign-up', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    id: response.data.id,
    email: response.data.email,
    ho_ten: response.data.ho_ten,
    vai_tro: response.data.vai_tro,
    payment_url: (response as unknown as { payment_url?: string }).payment_url,
  };
}

// ====== FORGOT PASSWORD ======
export async function forgotPassword(payload: ForgotPasswordPayload) {
  const response = await request<null>('/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response;
}

// ====== RESET PASSWORD ======
export async function resetPassword(payload: ResetPasswordPayload) {
  const response = await request<null>('/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response;
}

// ====== SEND OTP ======
export async function sendOtp(payload: SendOtpPayload) {
  const response = await request<null>('/send-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response;
}

// ====== VERIFY OTP ======
export async function verifyOtp(payload: VerifyOtpPayload) {
  const response = await request<{ email: string }>('/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

// ====== RESEND OTP ======
export async function resendOtp(email: string) {
  const response = await request<null>('/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  return response;
}
