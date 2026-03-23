import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColorToContainers1772300000000 implements MigrationInterface {
  name = 'AddColorToContainers1772300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "containers"
      ADD COLUMN IF NOT EXISTS "color" character varying(7)
    `);

    await queryRunner.query(`
      UPDATE "containers"
      SET "color" = '#3B82F6'
      WHERE "color" IS NULL OR "color" = ''
    `);

    await queryRunner.query(`
      ALTER TABLE "containers"
      ALTER COLUMN "color" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "containers"
      ALTER COLUMN "color" SET DEFAULT '#3B82F6'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "containers"
      DROP COLUMN IF EXISTS "color"
    `);
  }
}
