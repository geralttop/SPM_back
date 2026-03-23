import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillMissingPointCardAndMediaColumns1772200000000
  implements MigrationInterface
{
  name = 'BackfillMissingPointCardAndMediaColumns1772200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_settings"
      ADD COLUMN IF NOT EXISTS "pointCardInitialView" character varying(16) DEFAULT 'map'
    `);

    await queryRunner.query(`
      ALTER TABLE "points"
      ADD COLUMN IF NOT EXISTS "mediaAspectW" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "points"
      ADD COLUMN IF NOT EXISTS "mediaAspectH" integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "points"
      DROP COLUMN IF EXISTS "mediaAspectH"
    `);

    await queryRunner.query(`
      ALTER TABLE "points"
      DROP COLUMN IF EXISTS "mediaAspectW"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_settings"
      DROP COLUMN IF EXISTS "pointCardInitialView"
    `);
  }
}
