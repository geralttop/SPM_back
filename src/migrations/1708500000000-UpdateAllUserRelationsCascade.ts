import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAllUserRelationsCascade1708500000000 implements MigrationInterface {
  name = 'UpdateAllUserRelationsCascade1708500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Удаляем старые внешние ключи
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_author"`);
    await queryRunner.query(`ALTER TABLE "containers" DROP CONSTRAINT IF EXISTS "FK_containers_author"`);
    await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "FK_reports_reporter"`);
    await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "FK_reports_reportedUser"`);
    await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "FK_reports_reviewedBy"`);
    
    // Добавляем новые с правильными CASCADE/SET NULL
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD CONSTRAINT "FK_categories_author" 
      FOREIGN KEY ("authorId") REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE "containers" 
      ADD CONSTRAINT "FK_containers_author" 
      FOREIGN KEY ("authorId") REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_reports_reporter" 
      FOREIGN KEY ("reporterId") REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_reports_reportedUser" 
      FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_reports_reviewedBy" 
      FOREIGN KEY ("reviewedById") REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Возвращаем обратно без CASCADE
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_author"`);
    await queryRunner.query(`ALTER TABLE "containers" DROP CONSTRAINT "FK_containers_author"`);
    await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reporter"`);
    await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reportedUser"`);
    await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reviewedBy"`);
    
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD CONSTRAINT "FK_categories_author" 
      FOREIGN KEY ("authorId") REFERENCES "users"("id")
    `);
    
    await queryRunner.query(`
      ALTER TABLE "containers" 
      ADD CONSTRAINT "FK_containers_author" 
      FOREIGN KEY ("authorId") REFERENCES "users"("id")
    `);
    
    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_reports_reporter" 
      FOREIGN KEY ("reporterId") REFERENCES "users"("id")
    `);
    
    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_reports_reportedUser" 
      FOREIGN KEY ("reportedUserId") REFERENCES "users"("id")
    `);
    
    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_reports_reviewedBy" 
      FOREIGN KEY ("reviewedById") REFERENCES "users"("id")
    `);
  }
}