import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVinlandAssetTable1772600000000 implements MigrationInterface {
  name = 'CreateVinlandAssetTable1772600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "metadata"`);

    await queryRunner.query(`
      CREATE TABLE "metadata"."vinland_asset" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "filePath" character varying NOT NULL,
        "caption" text,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "uploaderId" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vinland_asset" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vinland_asset_sortOrder"
      ON "metadata"."vinland_asset" ("sortOrder")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "metadata"."vinland_asset"`);
  }
}
