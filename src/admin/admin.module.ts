import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { PointsModule } from '../points/points.module';
import { CategoriesModule } from '../categories/categories.module';
import { ContainersModule } from '../containers/containers.module';

@Module({
  imports: [
    UsersModule,
    PointsModule,
    CategoriesModule,
    ContainersModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}