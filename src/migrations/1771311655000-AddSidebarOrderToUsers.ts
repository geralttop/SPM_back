import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSidebarOrderToUsers1771311655000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'sidebarOrder',
        type: 'json',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'sidebarOrder');
  }
}
