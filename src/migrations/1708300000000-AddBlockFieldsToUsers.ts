import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlockFieldsToUsers1708300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "isBlocked" boolean NOT NULL DEFAULT false
    `);
    
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "blockedAt" TIMESTAMP NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "blockReason" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "blockReason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "blockedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isBlocked"`);
  }
}