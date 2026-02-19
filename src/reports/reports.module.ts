import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.entity';
import { User } from 'src/users/user.entity';
import { PointEntity } from 'src/points/entities/point.entity';
import { Comment } from 'src/points/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, User, PointEntity, Comment]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}