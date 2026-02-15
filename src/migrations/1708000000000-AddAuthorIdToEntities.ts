import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthorIdToEntities1708000000000 implements MigrationInterface {
  name = 'AddAuthorIdToEntities1708000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем колонку authorId к точкам
    await queryRunner.query(`
      ALTER TABLE "points" 
      ADD COLUMN "authorId" integer
    `);

    // Добавляем колонку authorId к контейнерам
    await queryRunner.query(`
      ALTER TABLE "containers" 
      ADD COLUMN "authorId" integer
    `);

    // Добавляем колонку authorId к категориям
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD COLUMN "authorId" integer
    `);

    // Если есть существующие записи без authorId, можно установить значение по умолчанию
    // или обновить их вручную через админку
    
    // Делаем поля обязательными для точек (у них всегда должен быть автор)
    await queryRunner.query(`
      ALTER TABLE "points" 
      ALTER COLUMN "authorId" SET NOT NULL
    `);

    // Для контейнеров и категорий authorId может быть null (системные записи)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем колонки authorId
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