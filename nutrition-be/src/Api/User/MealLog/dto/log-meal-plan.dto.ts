import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class LogMealPlanDto {
  @IsOptional()
  @IsDateString({}, { message: 'Ngày ghi không hợp lệ' })
  ngayGhi?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean({ message: 'Cờ ghi đè phải là boolean' })
  ghiDe?: boolean;
}
