import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { VinlandAssetEntity } from './entities/vinland-asset.entity';
import { VinlandController } from './vinland.controller';
import { VinlandService } from './vinland.service';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([VinlandAssetEntity])],
  controllers: [VinlandController],
  providers: [VinlandService],
})
export class VinlandModule {}
