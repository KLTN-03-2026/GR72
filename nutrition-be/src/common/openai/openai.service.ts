import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type AiContext = {
  loaiContext?: string;
  profile?: {
    gioi_tinh?: string | null;
    ngay_sinh?: string | null;
    chieu_cao_cm?: number | null;
    can_nang_hien_tai_kg?: number | null;
    muc_do_van_dong?: string | null;
    muc_tieu_suc_khoe?: string | null;
  } | null;
  latestMetric?: {
    can_nang_kg?: number | null;
    bmi?: number | null;
    huyet_ap_tam_thu?: number | null;
    huyet_ap_tam_truong?: number | null;
  } | null;
};

const CONTEXT_LABEL: Record<string, string> = {
  suc_khoe: 'sức khỏe tổng quát',
  dinh_duong: 'dinh dưỡng',
  tap_luyen: 'tập luyện',
  tu_van_chung: 'tư vấn chung',
};

const ACTIVITY_LABEL: Record<string, string> = {
  it_van_dong: 'ít vận động',
  nhe_nhang: 'vận động nhẹ',
  trung_binh: 'vận động trung bình',
  tich_cuc: 'tích cực',
  rat_tich_cuc: 'rất tích cực',
};

const GOAL_LABEL: Record<string, string> = {
  giam_can: 'giảm cân',
  tang_can: 'tăng cân',
  giu_can: 'giữ cân',
  cai_thien_suc_khoe: 'cải thiện sức khỏe',
};

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private client: OpenAI | null = null;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.logger.log(`OpenAI client khởi tạo với model ${this.model}`);
    } else {
      this.logger.warn('OPENAI_API_KEY chưa được cấu hình, AI chat sẽ trả về fallback.');
    }
  }

  isConfigured() {
    return Boolean(this.client);
  }

  private buildSystemPrompt(context: AiContext) {
    const topic = CONTEXT_LABEL[context.loaiContext ?? 'tu_van_chung'] ?? 'tư vấn chung';
    const lines: string[] = [
      `Bạn là trợ lý sức khỏe của ứng dụng NutriConsult, chuyên về ${topic}.`,
      `Trả lời ngắn gọn (4-8 câu), súc tích, dùng tiếng Việt, ưu tiên gạch đầu dòng khi liệt kê.`,
      `Không chẩn đoán bệnh; luôn nhắc người dùng tham khảo ý kiến chuyên gia/bác sĩ khi nghi ngờ vấn đề nghiêm trọng.`,
      `Không đưa lời khuyên dùng thuốc cụ thể.`,
    ];

    if (context.profile) {
      const p = context.profile;
      const parts: string[] = [];
      if (p.gioi_tinh) parts.push(`Giới tính: ${p.gioi_tinh}`);
      if (p.chieu_cao_cm) parts.push(`Cao ${p.chieu_cao_cm}cm`);
      if (p.can_nang_hien_tai_kg) parts.push(`Nặng ${p.can_nang_hien_tai_kg}kg`);
      if (p.muc_do_van_dong) parts.push(`Mức vận động: ${ACTIVITY_LABEL[p.muc_do_van_dong] ?? p.muc_do_van_dong}`);
      if (p.muc_tieu_suc_khoe) parts.push(`Mục tiêu: ${GOAL_LABEL[p.muc_tieu_suc_khoe] ?? p.muc_tieu_suc_khoe}`);
      if (parts.length) lines.push(`Hồ sơ người dùng: ${parts.join(' • ')}.`);
    }

    if (context.latestMetric) {
      const m = context.latestMetric;
      const parts: string[] = [];
      if (m.can_nang_kg) parts.push(`Cân nặng ${m.can_nang_kg}kg`);
      if (m.bmi) parts.push(`BMI ${Number(m.bmi).toFixed(1)}`);
      if (m.huyet_ap_tam_thu && m.huyet_ap_tam_truong) parts.push(`Huyết áp ${m.huyet_ap_tam_thu}/${m.huyet_ap_tam_truong}mmHg`);
      if (parts.length) lines.push(`Chỉ số mới nhất: ${parts.join(' • ')}.`);
    }

    return lines.join('\n');
  }

  /**
   * Gọi GPT để trả lời câu hỏi. Nếu không có API key, trả về fallback rule-based.
   */
  async generateReply(
    question: string,
    history: ChatMessage[],
    context: AiContext,
  ): Promise<{ content: string; model: string; tokenInput?: number; tokenOutput?: number; fallback: boolean }> {
    if (!this.client) {
      return { content: this.fallbackReply(question, context), model: 'fallback-rule-based', fallback: true };
    }

    const systemPrompt = this.buildSystemPrompt(context);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: question },
    ];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.6,
        max_tokens: 500,
      });
      const choice = response.choices?.[0]?.message?.content?.trim();
      if (!choice) throw new Error('Phản hồi trống từ GPT');
      return {
        content: choice,
        model: response.model ?? this.model,
        tokenInput: response.usage?.prompt_tokens,
        tokenOutput: response.usage?.completion_tokens,
        fallback: false,
      };
    } catch (error: any) {
      this.logger.error(`OpenAI lỗi: ${error?.message ?? error}`);
      // Fallback để không break UX khi GPT lỗi (rate limit, network…)
      return {
        content: this.fallbackReply(question, context),
        model: 'fallback-rule-based',
        fallback: true,
      };
    }
  }

  /**
   * Sinh bộ câu hỏi gợi ý dựa trên context. Dùng GPT nếu có, fallback nếu không.
   */
  async generateSuggestedQuestions(context: AiContext): Promise<string[]> {
    const fallback = this.fallbackSuggestions(context.loaiContext ?? 'tu_van_chung');
    if (!this.client) return fallback;

    try {
      const systemPrompt = `${this.buildSystemPrompt(context)}\nNhiệm vụ: chỉ trả về 5 câu hỏi ngắn gọn liên quan tới chủ đề trên. Mỗi câu một dòng, không đánh số, không thêm chú thích.`;
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Gợi ý 5 câu hỏi tôi nên hỏi để được tư vấn sức khỏe tốt nhất.' },
        ],
        temperature: 0.8,
        max_tokens: 300,
      });
      const text = response.choices?.[0]?.message?.content ?? '';
      const items = text
        .split('\n')
        .map((line: string) => line.replace(/^[-*\d.\s)]+/, '').trim())
        .filter((line: string) => line.length > 5 && line.length < 200)
        .slice(0, 5);
      return items.length ? items : fallback;
    } catch (error: any) {
      this.logger.warn(`Suggested questions fallback: ${error?.message ?? error}`);
      return fallback;
    }
  }

  private fallbackReply(question: string, context: AiContext) {
    const topic = CONTEXT_LABEL[context.loaiContext ?? 'tu_van_chung'] ?? 'tư vấn chung';
    return [
      `Cảm ơn bạn đã hỏi về ${topic}.`,
      `Hiện hệ thống AI đang tạm thời chưa phản hồi được. Bạn có thể tham khảo các gợi ý nhanh:`,
      `• Duy trì lối sống cân bằng: ngủ đủ 7-8 tiếng, vận động đều, ăn đa dạng nhóm thực phẩm.`,
      `• Theo dõi chỉ số định kỳ (cân nặng, huyết áp) để phát hiện thay đổi sớm.`,
      `• Khi có dấu hiệu bất thường, hãy đặt lịch tư vấn với chuyên gia thật.`,
      `Câu hỏi của bạn: "${question.slice(0, 160)}"`,
    ].join('\n');
  }

  private fallbackSuggestions(contextType: string): string[] {
    const map: Record<string, string[]> = {
      dinh_duong: [
        'Tôi nên ăn bao nhiêu calo mỗi ngày để giảm cân?',
        'Buổi sáng nên ăn gì để có năng lượng?',
        'Cách bổ sung protein cho người ăn chay?',
        'Những thực phẩm nào giúp ổn định đường huyết?',
        'Tôi có thể thay thế cơm bằng gì để giảm tinh bột?',
      ],
      tap_luyen: [
        'Người mới bắt đầu nên tập gì để khỏe và giảm cân?',
        'Mỗi tuần nên tập bao nhiêu buổi cardio?',
        'Bài tập nào tốt cho lưng và cột sống?',
        'Làm sao để tăng cơ mà không tăng mỡ?',
        'Cần khởi động và giãn cơ thế nào trước khi tập?',
      ],
      suc_khoe: [
        'Làm sao để cải thiện chất lượng giấc ngủ?',
        'BMI bao nhiêu là khỏe mạnh?',
        'Cách giảm stress hàng ngày hiệu quả?',
        'Tôi nên kiểm tra sức khỏe định kỳ thế nào?',
        'Dấu hiệu nào cần đi khám bác sĩ ngay?',
      ],
      tu_van_chung: [
        'Tôi đang thừa cân, nên bắt đầu từ đâu?',
        'Làm sao để duy trì thói quen sống lành mạnh?',
        'Lượng nước nên uống mỗi ngày là bao nhiêu?',
        'Có nên ăn kiêng gián đoạn (intermittent fasting)?',
        'Khi nào cần đặt lịch với chuyên gia dinh dưỡng?',
      ],
    };
    return map[contextType] ?? map.tu_van_chung;
  }
}
