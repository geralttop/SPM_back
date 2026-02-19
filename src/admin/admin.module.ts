import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { PointsModule } from '../points/points.module';
import { CategoriesModule } from '../categories/categories.module';
import { ContainersModule } from '../containers/containers.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    UsersModule,
    PointsModule,
    CategoriesModule,
    ContainersModule,
    ReportsModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}