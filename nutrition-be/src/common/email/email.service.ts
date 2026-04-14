import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: Number(process.env.EMAIL_PORT ?? 587) === 465,
    auth:
      process.env.EMAIL_USER
        ? {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          }
        : undefined,
  });

  async send(options: SendEmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM ?? '"Nutrition App" <noreply@nutrition.app>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Mã xác thực OTP - Nutrition App',
      html: this.buildOtpTemplate(otp),
    });
  }

  async sendPasswordReset(email: string, resetCode: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Đặt lại mật khẩu - Nutrition App',
      html: this.buildPasswordResetTemplate(resetCode),
    });
  }

  async sendWelcome(email: string, hoTen: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Chào mừng bạn đến với Nutrition App',
      html: this.buildWelcomeTemplate(hoTen),
    });
  }

  private buildOtpTemplate(otp: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mã xác thực OTP</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #16a34a, #22c55e); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: #dcfce7; margin: 8px 0 0; font-size: 14px; }
    .content { padding: 32px 24px; text-align: center; }
    .content p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
    .otp-box { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 800; color: #16a34a; letter-spacing: 8px; }
    .otp-label { font-size: 13px; color: #6b7280; margin-top: 8px; }
    .warning { font-size: 12px; color: #9ca3af; margin-top: 24px; }
    .footer { background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Xác thực tài khoản</h1>
      <p>Nutrition App - Hệ thống dinh dưỡng thông minh</p>
    </div>
    <div class="content">
      <p>Xin chào bạn,</p>
      <p>Mã xác thực OTP của bạn là:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-label">Mã OTP có hiệu lực trong 5 phút</div>
      </div>
      <p class="warning">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Nutrition App. Bảo mật thông tin của bạn là ưu tiên hàng đầu.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private buildPasswordResetTemplate(resetCode: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đặt lại mật khẩu</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1d4ed8, #3b82f6); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: #dbeafe; margin: 8px 0 0; font-size: 14px; }
    .content { padding: 32px 24px; text-align: center; }
    .content p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
    .code-box { background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .reset-code { font-size: 28px; font-weight: 800; color: #1d4ed8; letter-spacing: 4px; }
    .code-label { font-size: 13px; color: #6b7280; margin-top: 8px; }
    .warning { font-size: 12px; color: #9ca3af; margin-top: 24px; }
    .footer { background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Đặt lại mật khẩu</h1>
      <p>Nutrition App - Hệ thống dinh dưỡng thông minh</p>
    </div>
    <div class="content">
      <p>Xin chào bạn,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
      <p>Sử dụng mã bên dưới để đặt lại mật khẩu:</p>
      <div class="code-box">
        <div class="reset-code">${resetCode}</div>
        <div class="code-label">Mã có hiệu lực trong 15 phút</div>
      </div>
      <p class="warning">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và bảo mật tài khoản của bạn.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Nutrition App. Bảo mật thông tin của bạn là ưu tiên hàng đầu.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private buildWelcomeTemplate(hoTen: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chào mừng</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #16a34a, #22c55e); padding: 40px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; }
    .header p { color: #dcfce7; margin: 8px 0 0; font-size: 14px; }
    .content { padding: 32px 24px; text-align: center; }
    .content p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .footer { background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Chào mừng ${hoTen}!</h1>
      <p>Nutrition App - Hệ thống dinh dưỡng thông minh</p>
    </div>
    <div class="content">
      <p>Cảm ơn bạn đã đăng ký tài khoản tại Nutrition App.</p>
      <p>Tài khoản của bạn đã được tạo thành công. Bây giờ bạn có thể đăng nhập và bắt đầu hành trình dinh dưỡng của mình.</p>
      <p>Nếu cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Nutrition App.</p>
    </div>
  </div>
</body>
</html>`;
  }
}
