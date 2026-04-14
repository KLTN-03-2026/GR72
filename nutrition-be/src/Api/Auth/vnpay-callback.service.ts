import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ChuyenGiaDinhDuongEntity,
  RegistrationPaymentStatus,
} from '../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { ThongBaoEntity } from '../Admin/FoodReview/entities/thong-bao.entity';
import { TaiKhoanEntity } from '../Admin/User/entities/tai-khoan.entity';
import {
  verifyIpnSignature,
  verifyReturnSignature,
  isVnpaySuccess,
} from '../../common/vnpay/vnpay.util';

@Injectable()
export class VnpayCallbackService {
  constructor(
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly cgRepo: Repository<ChuyenGiaDinhDuongEntity>,
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepo: Repository<TaiKhoanEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notifRepo: Repository<ThongBaoEntity>,
  ) {}

  async handleVnpayIpn(query: Record<string, string>) {
    const isValid = verifyIpnSignature(query);
    if (!isValid) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const txnRef = query['vnp_TxnRef'];
    const [profileIdStr] = txnRef.split('_');
    const profileId = Number(profileIdStr);

    if (!profileId) {
      return { RspCode: '01', Message: 'Invalid order' };
    }

    const profile = await this.cgRepo.findOne({ where: { id: profileId } });
    if (!profile) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    const vnpStatus = query['vnp_TransactionStatus'];
    const now = new Date();

    if (isVnpaySuccess(vnpStatus)) {
      if (profile.trang_thai_thanh_toan !== 'thanh_cong') {
        profile.trang_thai_thanh_toan = 'thanh_cong' as RegistrationPaymentStatus;
        profile.vnp_txn_ref = txnRef;
        profile.vnp_transaction_no = query['vnp_TransactionNo'] ?? null;
        profile.ngay_thanh_toan = now;
        profile.lan_thanh_toan = (profile.lan_thanh_toan ?? 0) + 1;
        profile.cap_nhat_luc = now;
        await this.cgRepo.save(profile);
        await this.notifyAdmins(profile.id);
      }
      return { RspCode: '00', Message: 'Success' };
    }

    // Thanh toán thất bại
    profile.trang_thai_thanh_toan = 'that_bai' as RegistrationPaymentStatus;
    profile.vnp_txn_ref = txnRef;
    profile.vnp_transaction_no = query['vnp_TransactionNo'] ?? null;
    profile.cap_nhat_luc = now;
    await this.cgRepo.save(profile);
    return { RspCode: '00', Message: 'Update payment status' };
  }

  async handleVnpayReturn(query: Record<string, string>) {
    const isValid = verifyReturnSignature(query);
    if (!isValid) {
      return {
        success: false,
        message: 'Xac minh chu ky khong hop le',
        payment_status: 'invalid_signature',
      };
    }

    const txnRef = query['vnp_TxnRef'];
    const [profileIdStr] = txnRef.split('_');
    const profileId = Number(profileIdStr);

    const profile = await this.cgRepo.findOne({ where: { id: profileId } });
    if (!profile) {
      return { success: false, message: 'Don dang ky khong ton tai', payment_status: 'error' };
    }

    const vnpStatus = query['vnp_TransactionStatus'];

    if (isVnpaySuccess(vnpStatus)) {
      return {
        success: true,
        message: 'Thanh toan thanh cong. Don dang ky cua ban se duoc xu ly.',
        payment_status: profile.trang_thai_thanh_toan,
        trang_thai: profile.trang_thai,
      };
    }

    return {
      success: false,
      message: 'Thanh toan that bai hoac bi huy. Vui long thu lai.',
      payment_status: 'that_bai',
      trang_thai: profile.trang_thai,
    };
  }

  private async notifyAdmins(profileId: number) {
    const admins = await this.userRepo.find({ where: { vai_tro: 'quan_tri' as any } });
    const now = new Date();
    const notifications = admins.map((admin) =>
      this.notifRepo.create({
        tai_khoan_id: admin.id,
        loai: 'dang_ky_nutritionist',
        tieu_de: 'Don dang ky chuyen gia dinh duong moi',
        noi_dung: `Co don dang ky chuyen gia dinh duong #${profileId} can duyet. Nguoi dang ky da thanh toan phi.`,
        trang_thai: 'chua_doc',
        duong_dan_hanh_dong: '/admin/nutritionist-registrations',
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );
    if (notifications.length > 0) {
      await this.notifRepo.save(notifications);
    }
  }
}
