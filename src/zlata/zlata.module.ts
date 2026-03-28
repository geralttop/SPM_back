import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { ZlataAssetEntity } from './entities/zlata-asset.entity';
import { ZlataAssetTagEntity } from './entities/zlata-asset-tag.entity';
import { ZlataTagEntity } from './entities/zlata-tag.entity';
import { ZlataController } from './zlata.controller';
import { ZlataService } from './zlata.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([ZlataAssetEntity, ZlataTagEntity, ZlataAssetTagEntity]),
  ],
  controllers: [ZlataController],
  providers: [ZlataService],
})
export class ZlataModule {}
