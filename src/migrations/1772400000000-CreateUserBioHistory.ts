import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateUserBioHistory1772400000000 implements MigrationInterface {
  name = 'CreateUserBioHistory1772400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_bio_history',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'int',
          },
          {
            name: 'bioText',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_bio_history',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      CREATE INDEX "IDX_user_bio_history_userId_createdAt"
      ON "user_bio_history" ("userId", "createdAt" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_bio_history_userId_createdAt"`);
    await queryRunner.dropTable('user_bio_history');
  }
}
