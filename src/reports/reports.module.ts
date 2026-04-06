import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.entity';
import { User } from 'src/users/user.entity';
import { UserBlock } from 'src/users/entities/user-block.entity';
import { PointEntity } from 'src/points/entities/point.entity';
import { Comment } from 'src/points/entities/comment.entity';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, User, UserBlock, PointEntity, Comment]),
    PointsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}