import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { User } from '../users/user.entity';
import { UserBlock } from '../users/entities/user-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, User, UserBlock])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService], // Экспортируем, чтобы использовать в модуле Points
})
export class CategoriesModule {}