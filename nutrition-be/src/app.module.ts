import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './Api/Auth/auth.module';
import { AdminFoodModule } from './Api/Admin/Food/food.module';
import { AdminFoodReviewModule } from './Api/Admin/FoodReview/food-review.module';
import { AdminPackageModule } from './Api/Admin/Package/package.module';
import { AdminPackageFeatureModule } from './Api/Admin/PackageFeature/package-feature.module';
import { AdminSubscriptionModule } from './Api/Admin/Subscription/subscription.module';
import { AdminPaymentModule } from './Api/Admin/Payment/payment.module';
import { AdminNotificationModule } from './Api/Admin/Notification/notification.module';
import { AdminReportModule } from './Api/Admin/Report/report.module';
import { AdminDashboardModule } from './Api/Admin/Dashboard/dashboard.module';
import { NutritionistFoodModule } from './Api/Nutritionist/Food/food.module';
import { NutritionistFoodReviewModule } from './Api/Nutritionist/FoodReview/food-review.module';
import { NutritionistArticleModule } from './Api/Nutritionist/Article/article.module';
import { NutritionistRecipeModule } from './Api/Nutritionist/Recipe/recipe.module';
import { NutritionistMealTemplateModule } from './Api/Nutritionist/MealTemplate/meal-template.module';
import { NutritionistDashboardModule } from './Api/Nutritionist/Dashboard/dashboard.module';
import { NutritionistNotificationsModule } from './Api/Nutritionist/Notifications/nutritionist-notifications.module';
import { NutritionistProfileModule } from './Api/Nutritionist/Profile/profile.module';
import { NutritionistConsultationPackageModule } from './Api/Nutritionist/ConsultationPackage/consultation-package.module';
import { NutritionistBookingModule } from './Api/Nutritionist/Booking/booking.module';
import { NutritionistEarningsModule } from './Api/Nutritionist/Earnings/earnings.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminUserModule } from './Api/Admin/User/user.module';
import { AdminChuyenGiaModule } from './Api/Admin/ChuyenGiaDinhDuong/chuyen-gia.module';
import { AdminBookingModule } from './Api/Admin/Booking/booking.module';
import { AdminArticleModule } from './Api/Admin/Article/article.module';
import { AdminMealTemplateModule } from './Api/Admin/MealTemplate/meal-template.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { getTypeOrmConfig } from './database/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    JwtModule.register({}),
    AuthModule,
    AdminFoodModule,
    AdminFoodReviewModule,
    AdminPackageModule,
    AdminPackageFeatureModule,
    AdminSubscriptionModule,
    AdminPaymentModule,
    AdminNotificationModule,
    AdminReportModule,
    AdminDashboardModule,
    AdminUserModule,
    AdminChuyenGiaModule,
    AdminBookingModule,
    AdminArticleModule,
    AdminMealTemplateModule,
    NutritionistFoodModule,
    NutritionistFoodReviewModule,
    NutritionistArticleModule,
    NutritionistRecipeModule,
    NutritionistMealTemplateModule,
    NutritionistDashboardModule,
    NutritionistNotificationsModule,
    NutritionistProfileModule,
    NutritionistConsultationPackageModule,
    NutritionistBookingModule,
    NutritionistEarningsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
