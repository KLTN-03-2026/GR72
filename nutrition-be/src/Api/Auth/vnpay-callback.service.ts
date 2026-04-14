import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  ChuyenGiaDinhDuongEntity,
  RegistrationPaymentStatus,
} from '../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { ThongBaoEntity } from '../Admin/FoodReview/entities/thong-bao.entity';
import { HoSoEntity } from '../Admin/User/entities/ho-so.entity';
import { TaiKhoanEntity } from '../Admin/User/entities/tai-khoan.entity';
import {
  isVnpaySuccess,
  verifyReturnSignature,
  verifyIpnSignature,
} from '../../common/vnpay/vnpay.util';

type PaymentSyncResult = {
  success: boolean;
  message: string;
  payment_status: RegistrationPaymentStatus | 'invalid_signature' | 'error';
  trang_thai?: string | null;
  orderMissing?: boolean;
};

@Injectable()
export class VnpayCallbackService {
  constructor(
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly cgRepo: Repository<ChuyenGiaDinhDuongEntity>,
    @InjectRepository(HoSoEntity)
    private readonly hoSoRepo: Repository<HoSoEntity>,
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepo: Repository<TaiKhoanEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notifRepo: Repository<ThongBaoEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async handleVnpayIpn(query: Record<string, string>) {
    const isValid = verifyIpnSignature(query);
    if (!isValid) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const profileId = this.extractProfileId(query['vnp_TxnRef']);
    if (!profileId) {
      return { RspCode: '01', Message: 'Invalid order' };
    }

    const result = await this.syncPaymentStatus(profileId, query);

    if (result.orderMissing && result.payment_status === 'thanh_cong') {
      return { RspCode: '01', Message: 'Order not found' };
    }

    if (result.success) {
      return { RspCode: '00', Message: 'Success' };
    }

    return { RspCode: '00', Message: 'Registration rolled back' };
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

    const profileId = this.extractProfileId(query['vnp_TxnRef']);
    if (!profileId) {
      return {
        success: false,
        message: 'Don dang ky khong ton tai',
        payment_status: 'error',
      };
    }

    return this.syncPaymentStatus(profileId, query);
  }

  private extractProfileId(txnRef?: string) {
    if (!txnRef) return 0;
    const [profileIdStr] = txnRef.split('_');
    return Number(profileIdStr);
  }

  private async syncPaymentStatus(
    profileId: number,
    query: Record<string, string>,
  ): Promise<PaymentSyncResult> {
    if (isVnpaySuccess(query['vnp_TransactionStatus'])) {
      return this.markRegistrationAsPaid(profileId, query);
    }

    return this.rollbackFailedRegistration(profileId, query);
  }

  private async markRegistrationAsPaid(
    profileId: number,
    query: Record<string, string>,
  ): Promise<PaymentSyncResult> {
    return this.dataSource.transaction(async (manager) => {
      const profile = await manager.findOne(ChuyenGiaDinhDuongEntity, {
        where: { id: profileId },
      });

      if (!profile) {
        return {
          success: false,
          message: 'Don dang ky khong ton tai',
          payment_status: 'error',
          orderMissing: true,
        };
      }

      if (profile.trang_thai_thanh_toan !== 'thanh_cong') {
        const now = new Date();
        profile.trang_thai_thanh_toan =
          'thanh_cong' as RegistrationPaymentStatus;
        profile.vnp_txn_ref = query['vnp_TxnRef'] ?? profile.vnp_txn_ref;
        profile.vnp_transaction_no = query['vnp_TransactionNo'] ?? null;
        profile.ngay_thanh_toan = now;
        profile.lan_thanh_toan = (profile.lan_thanh_toan ?? 0) + 1;
        profile.cap_nhat_luc = now;
        await manager.save(ChuyenGiaDinhDuongEntity, profile);
        await this.notifyAdmins(manager, profile.id);
      }

      return {
        success: true,
        message:
          'Thanh toan thanh cong. Don dang ky cua ban dang cho admin duyet.',
        payment_status: 'thanh_cong',
        trang_thai: profile.trang_thai,
      };
    });
  }

  private async rollbackFailedRegistration(
    profileId: number,
    query: Record<string, string>,
  ): Promise<PaymentSyncResult> {
    return this.dataSource.transaction(async (manager) => {
      const profile = await manager.findOne(ChuyenGiaDinhDuongEntity, {
        where: { id: profileId },
      });

      if (!profile) {
        return {
          success: false,
          message:
            'Thanh toan that bai hoac bi huy. Ho so dang ky da duoc hoan tac.',
          payment_status: 'that_bai',
        };
      }

      if (profile.trang_thai_thanh_toan === 'thanh_cong') {
        return {
          success: true,
          message:
            'Thanh toan thanh cong. Don dang ky cua ban dang cho admin duyet.',
          payment_status: 'thanh_cong',
          trang_thai: profile.trang_thai,
        };
      }

      const now = new Date();
      profile.trang_thai_thanh_toan = 'that_bai' as RegistrationPaymentStatus;
      profile.vnp_txn_ref = query['vnp_TxnRef'] ?? profile.vnp_txn_ref;
      profile.vnp_transaction_no = query['vnp_TransactionNo'] ?? null;
      profile.cap_nhat_luc = now;
      await manager.save(ChuyenGiaDinhDuongEntity, profile);

      await manager.delete(HoSoEntity, { tai_khoan_id: profile.tai_khoan_id });
      await manager.delete(ChuyenGiaDinhDuongEntity, { id: profile.id });
      await manager.delete(TaiKhoanEntity, { id: profile.tai_khoan_id });

      return {
        success: false,
        message:
          'Thanh toan that bai hoac bi huy. Ho so dang ky da duoc hoan tac, vui long dang ky lai neu muon tiep tuc.',
        payment_status: 'that_bai',
      };
    });
  }

  private async notifyAdmins(manager: EntityManager, profileId: number) {
    const admins = await manager.find(TaiKhoanEntity, {
      where: { vai_tro: 'quan_tri' as any },
    });
    const now = new Date();
    const notifications = admins.map((admin) =>
      manager.create(ThongBaoEntity, {
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
      await manager.save(ThongBaoEntity, notifications);
    }
  }
}
