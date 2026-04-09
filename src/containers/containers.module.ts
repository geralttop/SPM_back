import { Module } from '@nestjs/common';
import { ContainersService } from './containers.service';
import { ContainersController } from './containers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Container } from './entities/container.entity';
import { User } from '../users/user.entity';
import { UserBlock } from '../users/entities/user-block.entity';
import { PointsModule } from '../points/points.module';
@Module({
    imports: [TypeOrmModule.forFeature([Container, User, UserBlock]), PointsModule],
    controllers: [ContainersController],
    providers: [ContainersService],
    exports: [ContainersService, TypeOrmModule]
})
export class ContainersModule {
}
