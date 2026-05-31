import { MigrationInterface, QueryRunner } from 'typeorm';
export class ChangeCategoryDeleteBehavior1772900000000 implements MigrationInterface {
    name = 'ChangeCategoryDeleteBehavior1772900000000';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ DECLARE r RECORD;
            BEGIN
                FOR r IN (
                    SELECT c.conname
                    FROM pg_constraint c
                    INNER JOIN pg_class t ON c.conrelid = t.oid
                    INNER JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey) AND NOT a.attisdropped
                    WHERE t.relname = 'points' AND a.attname = 'categoryId' AND c.contype = 'f'
                ) LOOP
                    EXECUTE format('ALTER TABLE "points" DROP CONSTRAINT %I', r.conname);
                END LOOP;
            END $$;
        `);
        await queryRunner.query(`
            ALTER TABLE "points"
            ADD CONSTRAINT "FK_points_category"
            FOREIGN KEY ("categoryId")
            REFERENCES "categories"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION
        `);
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "points"
            DROP CONSTRAINT IF EXISTS "FK_points_category"
        `);
        await queryRunner.query(`
            ALTER TABLE "points"
            ADD CONSTRAINT "FK_points_category"
            FOREIGN KEY ("categoryId")
            REFERENCES "categories"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);
    }
}
