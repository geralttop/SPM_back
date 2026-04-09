import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddCascadeDeleteToUserRelations1708400000000 implements MigrationInterface {
    name = 'AddCascadeDeleteToUserRelations1708400000000';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "points" DROP CONSTRAINT IF EXISTS "FK_points_author"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "FK_comments_author"`);
        await queryRunner.query(`
      ALTER TABLE "points" 
      ADD CONSTRAINT "FK_points_author" 
      FOREIGN KEY ("authorId") REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
        await queryRunner.query(`
      ALTER TABLE "comments" 
      ADD CONSTRAINT "FK_comments_author" 
      FOREIGN KEY ("authorId") REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "points" DROP CONSTRAINT "FK_points_author"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_author"`);
        await queryRunner.query(`
      ALTER TABLE "points" 
      ADD CONSTRAINT "FK_points_author" 
      FOREIGN KEY ("authorId") REFERENCES "users"("id")
    `);
        await queryRunner.query(`
      ALTER TABLE "comments" 
      ADD CONSTRAINT "FK_comments_author" 
      FOREIGN KEY ("authorId") REFERENCES "users"("id")
    `);
    }
}
