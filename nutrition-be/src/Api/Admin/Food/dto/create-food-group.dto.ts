import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFoodGroupDto {
  @IsString()
  @IsNotEmpty()
  ten!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  moTa?: string;
}
