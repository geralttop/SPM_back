import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class AddPointPhotosAndCardViewSetting1772100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('points', [
      new TableColumn({
        name: 'mediaAspectW',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'mediaAspectH',
        type: 'int',
        isNullable: true,
      }),
    ]);

    await queryRunner.addColumn(
      'user_settings',
      new TableColumn({
        name: 'pointCardInitialView',
        type: 'varchar',
        length: '16',
        isNullable: true,
        default: `'map'`,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'point_photos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: `gen_random_uuid()`,
          },
          {
            name: 'pointId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '512',
            isNullable: false,
          },
          {
            name: 'sortOrder',
            type: 'int',
            isNullable: false,
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
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'point_photos',
      new TableForeignKey({
        columnNames: ['pointId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'points',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('point_photos');
    const fk = table?.foreignKeys.find((f) => f.columnNames.indexOf('pointId') !== -1);
    if (fk) {
      await queryRunner.dropForeignKey('point_photos', fk);
    }
    await queryRunner.dropTable('point_photos');
    await queryRunner.dropColumn('user_settings', 'pointCardInitialView');
    await queryRunner.dropColumn('points', 'mediaAspectH');
    await queryRunner.dropColumn('points', 'mediaAspectW');
  }
}
