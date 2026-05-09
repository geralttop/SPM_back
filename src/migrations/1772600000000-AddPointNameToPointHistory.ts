import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPointNameToPointHistory1772600000000
  implements MigrationInterface
{
  name = 'AddPointNameToPointHistory1772600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'point_history',
      new TableColumn({
        name: 'pointName',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('point_history', 'pointName');
  }
}

