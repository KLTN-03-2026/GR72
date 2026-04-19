import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class CreateConsultationPaymentDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  bookingId!: number;
}

export class PendingConsultationPaymentQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  booking_id!: number;
}

export class ConsultationPaymentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  bookingId?: number;
}
