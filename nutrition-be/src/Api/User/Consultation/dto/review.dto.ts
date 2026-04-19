import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  bookingId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  diem!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  noiDung?: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  diem?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  noiDung?: string;
}

export class UserReviewQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bookingId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
