import 'dotenv/config';
import * as crypto from 'crypto';

const VNPAY_URL = process.env.VNPAY_URL!;
const VNPAY_API_URL = process.env.VNPAY_API_URL!;
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE!;
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET!;
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL!;

export interface VnpayPaymentParams {
  amount: number;
  bankCode?: string;
  orderDescription: string;
  orderType: string;
  language?: string;
  txnRef: string;
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

export interface VnpayRefundParams {
  amount: number;
  orderInfo: string;
  txnRef: string;
  transactionDate: string;
  createBy: string;
  ipAddr?: string;
  transactionNo?: string;
  transactionType?: '02' | '03';
}

export interface VnpayRefundResponse {
  vnp_ResponseId?: string;
  vnp_Command?: string;
  vnp_ResponseCode?: string;
  vnp_Message?: string;
  vnp_TmnCode?: string;
  vnp_TxnRef?: string;
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_PayDate?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionType?: string;
  vnp_TransactionStatus?: string;
  vnp_OrderInfo?: string;
  vnp_SecureHash?: string;
}

function sortObject(
  obj: Record<string, string | number>,
): Record<string, string> {
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
  return crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(data)
    .digest('hex');
}

function generateRequestId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 32);
}

function buildSignData(sorted: Record<string, string>): string {
  return Object.entries(sorted)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&');
}

export function generatePaymentUrl(params: VnpayPaymentParams): string {
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
    vnp_TxnRef: params.txnRef,
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

export function formatVnpayDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${mi}${s}`;
}

async function parseJsonResponse(response: Response): Promise<Record<string, string>> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, string>;
  } catch {
    throw new Error('VNPay tra ve du lieu khong hop le');
  }
}

function verifyRefundResponseSignature(params: Record<string, string>): boolean {
  const { vnp_SecureHash, ...rest } = params;
  if (!vnp_SecureHash) return false;

  const signData = [
    rest['vnp_ResponseId'] ?? '',
    rest['vnp_Command'] ?? '',
    rest['vnp_ResponseCode'] ?? '',
    rest['vnp_Message'] ?? '',
    rest['vnp_TmnCode'] ?? '',
    rest['vnp_TxnRef'] ?? '',
    rest['vnp_Amount'] ?? '',
    rest['vnp_BankCode'] ?? '',
    rest['vnp_PayDate'] ?? '',
    rest['vnp_TransactionNo'] ?? '',
    rest['vnp_TransactionType'] ?? '',
    rest['vnp_TransactionStatus'] ?? '',
    rest['vnp_OrderInfo'] ?? '',
  ].join('|');

  return hmacSHA512(signData) === vnp_SecureHash;
}

export async function refundVnpayTransaction(params: VnpayRefundParams): Promise<{
  success: boolean;
  message: string;
  response: VnpayRefundResponse;
}> {
  const requestId = generateRequestId('RF');
  const createDate = formatVnpayDate(new Date());
  const amountInCents = String(Math.round(params.amount * 100));
  const transactionType = params.transactionType ?? '02';
  const ipAddr = params.ipAddr ?? '127.0.0.1';
  const transactionNo = params.transactionNo ?? '';

  const payload: Record<string, string> = {
    vnp_RequestId: requestId,
    vnp_Version: '2.1.0',
    vnp_Command: 'refund',
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_TransactionType: transactionType,
    vnp_TxnRef: params.txnRef,
    vnp_Amount: amountInCents,
    vnp_TransactionNo: transactionNo,
    vnp_TransactionDate: params.transactionDate,
    vnp_CreateBy: params.createBy,
    vnp_CreateDate: createDate,
    vnp_IpAddr: ipAddr,
    vnp_OrderInfo: params.orderInfo,
  };

  const signData = [
    payload.vnp_RequestId,
    payload.vnp_Version,
    payload.vnp_Command,
    payload.vnp_TmnCode,
    payload.vnp_TransactionType,
    payload.vnp_TxnRef,
    payload.vnp_Amount,
    payload.vnp_TransactionNo,
    payload.vnp_TransactionDate,
    payload.vnp_CreateBy,
    payload.vnp_CreateDate,
    payload.vnp_IpAddr,
    payload.vnp_OrderInfo,
  ].join('|');

  payload.vnp_SecureHash = hmacSHA512(signData);

  const response = await fetch(VNPAY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const responseBody = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(responseBody['vnp_Message'] || 'VNPay tu choi yeu cau hoan tien');
  }

  if (!verifyRefundResponseSignature(responseBody)) {
    throw new Error('Chu ky phan hoi hoan tien VNPay khong hop le');
  }

  const responseCode = responseBody['vnp_ResponseCode'] ?? '';
  const transactionStatus = responseBody['vnp_TransactionStatus'] ?? '';

  if (responseCode !== '00') {
    return {
      success: false,
      message: responseBody['vnp_Message'] || 'VNPay khong chap nhan yeu cau hoan tien',
      response: responseBody,
    };
  }

  const successMessage =
    transactionStatus === '06'
      ? 'Yeu cau hoan tien da duoc gui thanh cong sang ngan hang qua VNPay.'
      : transactionStatus === '05'
        ? 'VNPay dang xu ly giao dich hoan tien.'
        : 'Hoan tien thanh cong qua VNPay.';

  return {
    success: true,
    message: successMessage,
    response: responseBody,
  };
}

function formatDate(date: Date): string {
  return formatVnpayDate(date);
}
