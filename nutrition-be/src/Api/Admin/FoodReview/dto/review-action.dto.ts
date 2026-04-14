import { IsOptional, IsString } from 'class-validator';

export class ApproveReviewDto {
  @IsOptional()
  @IsString()
  ghiChuDuyet?: string;
}

export class RejectReviewDto {
  @IsString()
  ghiChuDuyet!: string;
}
