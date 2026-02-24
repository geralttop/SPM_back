import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMapSettingsToUserSettings1771943162000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем поле availableMapStyles
    await queryRunner.addColumn(
      'user_settings',
      new TableColumn({
        name: 'availableMapStyles',
        type: 'json',
        isNullable: true,
      }),
    );

    // Добавляем поле defaultMapStyle
    await queryRunner.addColumn(
      'user_settings',
      new TableColumn({
        name: 'defaultMapStyle',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_settings', 'availableMapStyles');
    await queryRunner.dropColumn('user_settings', 'defaultMapStyle');
  }
}
