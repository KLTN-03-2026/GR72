import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @IsPositive()
  nutritionistId!: number;

  @IsInt()
  @IsPositive()
  goiTuVanId!: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngayHen!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  gioBatDau!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  mucDich?: string;
}

export class CancelUserBookingDto {
  @IsString()
  @Length(1, 2000)
  lyDoHuy!: string;
}
