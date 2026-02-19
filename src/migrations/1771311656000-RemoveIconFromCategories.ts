import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveIconFromCategories1771311656000 implements MigrationInterface {
  name = 'RemoveIconFromCategories1771311656000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Удаляем колонку icon из таблицы categories
    await queryRunner.query(`
      ALTER TABLE "categories" 
      DROP COLUMN "icon"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Восстанавливаем колонку icon в таблице categories
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD COLUMN "icon" character varying
    `);
  }
}