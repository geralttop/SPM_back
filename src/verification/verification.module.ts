import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { UserVerificationRequest } from './entities/user-verification-request.entity';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { AdminVerificationController } from './admin-verification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserVerificationRequest]), UsersModule],
  providers: [VerificationService],
  controllers: [VerificationController, AdminVerificationController],
  exports: [VerificationService, TypeOrmModule],
})
export class VerificationModule {}

