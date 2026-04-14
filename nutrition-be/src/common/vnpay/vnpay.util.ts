import 'dotenv/config';
import * as crypto from 'crypto';

const VNPAY_URL = process.env.VNPAY_URL!;
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE!;
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET!;
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL!;

export interface VnpayPaymentParams {
  amount: number;
  bankCode?: string;
  orderDescription: string;
  orderType: string;
  language?: string;
}

export interface VnpayIpnParams {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_TmnCode: string;
  vnp_TxnRef: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_SecureHash: string;
}

export interface VnpayReturnParams {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseId: string;
  vnp_TmnCode: string;
  vnp_TxnRef: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_SecureHash: string;
}

function sortObject(obj: Record<string, string | number>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const k of keys) {
    const v = String(obj[k]);
    if (v !== '' && v !== null && v !== undefined) {
      sorted[k] = v;
    }
  }
  return sorted;
}

function hmacSHA512(data: string): string {
  return crypto.createHmac('sha512', VNPAY_HASH_SECRET).update(data).digest('hex');
}

function buildSignData(sorted: Record<string, string>): string {
  return Object.entries(sorted)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&');
}

export function generatePaymentUrl(params: VnpayPaymentParams, profileId: number): string {
  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000));

  const amountInCents = Math.round(params.amount * 100);

  const vnp_Params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_Locale: params.language || 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: `${profileId}_${Date.now()}`,
    vnp_OrderInfo: params.orderDescription,
    vnp_OrderType: params.orderType,
    vnp_Amount: String(amountInCents),
    vnp_ReturnUrl: VNPAY_RETURN_URL,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  if (params.bankCode) {
    vnp_Params['vnp_BankCode'] = params.bankCode;
  }

  const sorted = sortObject(vnp_Params);
  const signData = buildSignData(sorted);
  const secureHash = hmacSHA512(signData);

  return `${VNPAY_URL}?${signData}&vnp_SecureHash=${secureHash}`;
}

export function verifyIpnSignature(params: Record<string, string>): boolean {
  const { vnp_SecureHash, ...rest } = params;
  if (!vnp_SecureHash) return false;

  const sorted = sortObject(rest);
  const signData = buildSignData(sorted);
  const secureHash = hmacSHA512(signData);

  return secureHash === vnp_SecureHash;
}

export function verifyReturnSignature(params: Record<string, string>): boolean {
  const { vnp_SecureHash, ...rest } = params;
  if (!vnp_SecureHash) return false;

  const sorted = sortObject(rest);
  const signData = buildSignData(sorted);
  const secureHash = hmacSHA512(signData);

  return secureHash === vnp_SecureHash;
}

export function isVnpaySuccess(status: string): boolean {
  return status === '00';
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${mi}${s}`;
}
