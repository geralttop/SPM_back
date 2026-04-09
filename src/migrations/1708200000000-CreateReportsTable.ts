import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateReportsTable1708200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" SERIAL NOT NULL,
        "type" character varying NOT NULL CHECK ("type" IN ('point', 'comment', 'user')),
        "reason" character varying NOT NULL CHECK ("reason" IN ('spam', 'inappropriate', 'harassment', 'fake', 'other')),
        "description" text,
        "status" character varying NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'reviewed', 'resolved', 'dismissed')),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "reporterId" integer NOT NULL,
        "pointId" uuid,
        "commentId" integer,
        "reportedUserId" integer,
        "reviewedById" integer,
        "adminNotes" text,
        CONSTRAINT "PK_d9013193989303580d2c7e1d4e2" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_REPORTS_STATUS" ON "reports" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_REPORTS_TYPE" ON "reports" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_REPORTS_CREATED_AT" ON "reports" ("createdAt")`);
        await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_REPORTS_REPORTER" 
      FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
        await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_REPORTS_POINT" 
      FOREIGN KEY ("pointId") REFERENCES "points"("id") ON DELETE CASCADE
    `);
        await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_REPORTS_COMMENT" 
      FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE
    `);
        await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_REPORTS_REPORTED_USER" 
      FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
        await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_REPORTS_REVIEWED_BY" 
      FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL
    `);
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "reports"`);
    }
}
