import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateZlataMetadataTables1772500000000 implements MigrationInterface {
  name = 'CreateZlataMetadataTables1772500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "metadata"`);

    await queryRunner.query(`
      CREATE TABLE "metadata"."zlata_asset" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "filePath" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "uploaderId" integer NOT NULL,
        CONSTRAINT "PK_zlata_asset" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "metadata"."zlata_tag" (
        "id" SERIAL NOT NULL,
        "name" character varying(128) NOT NULL,
        CONSTRAINT "PK_zlata_tag" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_zlata_tag_name_lower"
      ON "metadata"."zlata_tag" (LOWER("name"))
    `);

    await queryRunner.query(`
      CREATE TABLE "metadata"."zlata_asset_tag" (
        "assetId" uuid NOT NULL,
        "tagId" integer NOT NULL,
        CONSTRAINT "PK_zlata_asset_tag" PRIMARY KEY ("assetId", "tagId"),
        CONSTRAINT "FK_zlata_asset_tag_asset" FOREIGN KEY ("assetId")
          REFERENCES "metadata"."zlata_asset"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_zlata_asset_tag_tag" FOREIGN KEY ("tagId")
          REFERENCES "metadata"."zlata_tag"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_zlata_asset_tag_tagId" ON "metadata"."zlata_asset_tag" ("tagId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "metadata"."zlata_asset_tag"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "metadata"."zlata_tag"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "metadata"."zlata_asset"`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS "metadata"`);
  }
}
