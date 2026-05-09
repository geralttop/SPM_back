import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex, } from 'typeorm';

export class AddIsVerifiedAndVerificationRequests1772800000000 implements MigrationInterface {
  name = 'AddIsVerifiedAndVerificationRequests1772800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('users', new TableColumn({
      name: 'isVerified',
      type: 'boolean',
      isNullable: false,
      default: false,
    }));

    await queryRunner.createTable(new Table({
      name: 'user_verification_requests',
      columns: [
        {
          name: 'id',
          type: 'int',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'increment',
        },
        { name: 'userId', type: 'int', isNullable: false },
        { name: 'reason', type: 'text', isNullable: false },
        { name: 'links', type: 'text', isNullable: true },
        { name: 'status', type: 'varchar', length: '20', isNullable: false, default: `'pending'` },
        { name: 'adminId', type: 'int', isNullable: true },
        { name: 'adminNote', type: 'text', isNullable: true },
        { name: 'createdAt', type: 'timestamp', isNullable: false, default: 'now()' },
        { name: 'updatedAt', type: 'timestamp', isNullable: false, default: 'now()' },
        { name: 'decidedAt', type: 'timestamp', isNullable: true },
      ],
      foreignKeys: [
        {
          columnNames: ['userId'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        },
        {
          columnNames: ['adminId'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        },
      ],
    }), true);

    await queryRunner.createIndex('user_verification_requests', new TableIndex({
      name: 'IDX_user_verification_requests_userId',
      columnNames: ['userId'],
    }));

    await queryRunner.createIndex('user_verification_requests', new TableIndex({
      name: 'IDX_user_verification_requests_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('user_verification_requests', new TableIndex({
      name: 'IDX_user_verification_requests_adminId',
      columnNames: ['adminId'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('user_verification_requests', 'IDX_user_verification_requests_adminId');
    await queryRunner.dropIndex('user_verification_requests', 'IDX_user_verification_requests_status');
    await queryRunner.dropIndex('user_verification_requests', 'IDX_user_verification_requests_userId');
    await queryRunner.dropTable('user_verification_requests');
    await queryRunner.dropColumn('users', 'isVerified');
  }
}

