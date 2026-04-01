import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePointHistory1772500000000 implements MigrationInterface {
  name = 'CreatePointHistory1772500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'point_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'pointId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'authorId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
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
      'point_history',
      new TableForeignKey({
        columnNames: ['pointId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'points',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'point_history',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      CREATE INDEX "IDX_point_history_pointId_createdAt"
      ON "point_history" ("pointId", "createdAt" DESC)
    `);

    await queryRunner.createTable(
      new Table({
        name: 'point_history_photos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'historyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '512',
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'width',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'height',
            type: 'int',
            isNullable: true,
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
      'point_history_photos',
      new TableForeignKey({
        columnNames: ['historyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'point_history',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      CREATE INDEX "IDX_point_history_photos_historyId_sortOrder"
      ON "point_history_photos" ("historyId", "sortOrder" ASC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_point_history_photos_historyId_sortOrder"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_point_history_pointId_createdAt"`,
    );
    await queryRunner.dropTable('point_history_photos');
    await queryRunner.dropTable('point_history');
  }
}

