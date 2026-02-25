import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeContainerDeleteBehavior1771950000000 implements MigrationInterface {
    name = 'ChangeContainerDeleteBehavior1771950000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Удаляем старый внешний ключ с CASCADE
        await queryRunner.query(`
            ALTER TABLE "points" 
            DROP CONSTRAINT IF EXISTS "FK_points_container"
        `);

        // Создаем новый внешний ключ с SET NULL
        await queryRunner.query(`
            ALTER TABLE "points" 
            ADD CONSTRAINT "FK_points_container" 
            FOREIGN KEY ("containerId") 
            REFERENCES "containers"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Откатываем изменения - возвращаем CASCADE
        await queryRunner.query(`
            ALTER TABLE "points" 
            DROP CONSTRAINT IF EXISTS "FK_points_container"
        `);

        await queryRunner.query(`
            ALTER TABLE "points" 
            ADD CONSTRAINT "FK_points_container" 
            FOREIGN KEY ("containerId") 
            REFERENCES "containers"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }
}
