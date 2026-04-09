import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddAvatarToUsers1771960000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" varchar
    `);
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar"
    `);
    }
}
