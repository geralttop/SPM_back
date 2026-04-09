import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddAuthorIdToEntities1708000000000 implements MigrationInterface {
    name = 'AddAuthorIdToEntities1708000000000';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "points" 
      ADD COLUMN "authorId" integer
    `);
        await queryRunner.query(`
      ALTER TABLE "containers" 
      ADD COLUMN "authorId" integer
    `);
        await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD COLUMN "authorId" integer
    `);
        await queryRunner.query(`
      ALTER TABLE "points" 
      ALTER COLUMN "authorId" SET NOT NULL
    `);
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "points" 
      DROP COLUMN "authorId"
    `);
        await queryRunner.query(`
      ALTER TABLE "containers" 
      DROP COLUMN "authorId"
    `);
        await queryRunner.query(`
      ALTER TABLE "categories" 
      DROP COLUMN "authorId"
    `);
    }
}
