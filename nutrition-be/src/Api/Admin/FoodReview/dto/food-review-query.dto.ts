import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const REVIEW_STATUSES = ['cho_duyet', 'da_duyet', 'tu_choi'] as const;

export class FoodReviewQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(REVIEW_STATUSES)
  trangThai?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
