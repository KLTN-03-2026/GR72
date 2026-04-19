import { IsOptional, IsString } from 'class-validator';

export class UpdateFoodGroupDto {
  @IsOptional()
  @IsString()
  ten?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  moTa?: string;
}
