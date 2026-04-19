import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CreateFoodGroupDto } from './dto/create-food-group.dto';
import { UpdateFoodGroupDto } from './dto/update-food-group.dto';
import { FoodService } from './food.service';

@Roles('quan_tri')
@Controller('admin/food-groups')
export class FoodGroupController {
  constructor(private readonly foodService: FoodService) {}

  @Get()
  getFoodGroups() {
    return this.foodService.getFoodGroups();
  }

  @Post()
  createFoodGroup(@Body() body: CreateFoodGroupDto) {
    return this.foodService.createFoodGroup(body);
  }

  @Patch(':id')
  updateFoodGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateFoodGroupDto,
  ) {
    return this.foodService.updateFoodGroup(id, body);
  }

  @Delete(':id')
  removeFoodGroup(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.removeFoodGroup(id);
  }
}
