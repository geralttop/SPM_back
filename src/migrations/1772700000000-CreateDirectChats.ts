import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class CreateDirectChats1772700000000 implements MigrationInterface {
  name = 'CreateDirectChats1772700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'direct_conversations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'userLowId', type: 'int' },
          { name: 'userHighId', type: 'int' },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'direct_conversations',
      new TableUnique({
        name: 'UQ_direct_conversations_pair',
        columnNames: ['userLowId', 'userHighId'],
      }),
    );

    await queryRunner.createForeignKeys('direct_conversations', [
      new TableForeignKey({
        columnNames: ['userLowId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['userHighId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'direct_messages',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'conversationId', type: 'int' },
          { name: 'senderId', type: 'int' },
          { name: 'body', type: 'varchar', length: '2000' },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('direct_messages', [
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'direct_conversations',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.query(`
      CREATE INDEX "IDX_direct_messages_conversation_created"
      ON "direct_messages" ("conversationId", "createdAt" DESC)
    `);

    await queryRunner.createTable(
      new Table({
        name: 'direct_conversation_reads',
        columns: [
          { name: 'conversationId', type: 'int', isPrimary: true },
          { name: 'userId', type: 'int', isPrimary: true },
          { name: 'lastReadAt', type: 'timestamptz' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('direct_conversation_reads', [
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'direct_conversations',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('direct_conversation_reads');
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_direct_messages_conversation_created"`);
    await queryRunner.dropTable('direct_messages');
    await queryRunner.dropTable('direct_conversations');
  }
}
