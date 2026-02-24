import { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitUserTable1771400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Создаем таблицу user_verification
    await queryRunner.query(`
      CREATE TABLE user_verification (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER UNIQUE NOT NULL,
        "confirmationCode" VARCHAR,
        "codeCreatedAt" TIMESTAMP,
        CONSTRAINT "FK_user_verification_user" FOREIGN KEY ("userId") 
          REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 2. Создаем таблицу user_security
    await queryRunner.query(`
      CREATE TABLE user_security (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER UNIQUE NOT NULL,
        "failedCodeAttempts" INTEGER DEFAULT 0,
        "codeBlockedUntil" TIMESTAMP,
        "failedLoginAttempts" INTEGER DEFAULT 0,
        "loginBlockedUntil" TIMESTAMP,
        CONSTRAINT "FK_user_security_user" FOREIGN KEY ("userId") 
          REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Создаем таблицу user_settings
    await queryRunner.query(`
      CREATE TABLE user_settings (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER UNIQUE NOT NULL,
        "sidebarOrder" JSON,
        CONSTRAINT "FK_user_settings_user" FOREIGN KEY ("userId") 
          REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 4. Создаем таблицу user_blocks
    await queryRunner.query(`
      CREATE TABLE user_blocks (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER UNIQUE NOT NULL,
        "isBlocked" BOOLEAN DEFAULT false,
        "blockedAt" TIMESTAMP,
        "blockReason" TEXT,
        CONSTRAINT "FK_user_blocks_user" FOREIGN KEY ("userId") 
          REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 5. Переносим данные из users в user_verification
    await queryRunner.query(`
      INSERT INTO user_verification ("userId", "confirmationCode", "codeCreatedAt")
      SELECT id, "confirmationCode", "codeCreatedAt"
      FROM users
    `);

    // 6. Переносим данные из users в user_security
    await queryRunner.query(`
      INSERT INTO user_security ("userId", "failedCodeAttempts", "codeBlockedUntil", "failedLoginAttempts", "loginBlockedUntil")
      SELECT id, "failedCodeAttempts", "codeBlockedUntil", "failedLoginAttempts", "loginBlockedUntil"
      FROM users
    `);

    // 7. Переносим данные из users в user_settings
    await queryRunner.query(`
      INSERT INTO user_settings ("userId", "sidebarOrder")
      SELECT id, "sidebarOrder"
      FROM users
    `);

    // 8. Переносим данные из users в user_blocks
    await queryRunner.query(`
      INSERT INTO user_blocks ("userId", "isBlocked", "blockedAt", "blockReason")
      SELECT id, "isBlocked", "blockedAt", "blockReason"
      FROM users
    `);

    // 9. Удаляем старые колонки из users
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN "confirmationCode",
      DROP COLUMN "codeCreatedAt",
      DROP COLUMN "failedCodeAttempts",
      DROP COLUMN "codeBlockedUntil",
      DROP COLUMN "failedLoginAttempts",
      DROP COLUMN "loginBlockedUntil",
      DROP COLUMN "sidebarOrder",
      DROP COLUMN "isBlocked",
      DROP COLUMN "blockedAt",
      DROP COLUMN "blockReason"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Восстанавливаем колонки в users
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN "confirmationCode" VARCHAR,
      ADD COLUMN "codeCreatedAt" TIMESTAMP,
      ADD COLUMN "failedCodeAttempts" INTEGER DEFAULT 0,
      ADD COLUMN "codeBlockedUntil" TIMESTAMP,
      ADD COLUMN "failedLoginAttempts" INTEGER DEFAULT 0,
      ADD COLUMN "loginBlockedUntil" TIMESTAMP,
      ADD COLUMN "sidebarOrder" JSON,
      ADD COLUMN "isBlocked" BOOLEAN DEFAULT false,
      ADD COLUMN "blockedAt" TIMESTAMP,
      ADD COLUMN "blockReason" TEXT
    `);

    // 2. Восстанавливаем данные из user_verification
    await queryRunner.query(`
      UPDATE users u
      SET "confirmationCode" = v."confirmationCode",
          "codeCreatedAt" = v."codeCreatedAt"
      FROM user_verification v
      WHERE u.id = v."userId"
    `);

    // 3. Восстанавливаем данные из user_security
    await queryRunner.query(`
      UPDATE users u
      SET "failedCodeAttempts" = s."failedCodeAttempts",
          "codeBlockedUntil" = s."codeBlockedUntil",
          "failedLoginAttempts" = s."failedLoginAttempts",
          "loginBlockedUntil" = s."loginBlockedUntil"
      FROM user_security s
      WHERE u.id = s."userId"
    `);

    // 4. Восстанавливаем данные из user_settings
    await queryRunner.query(`
      UPDATE users u
      SET "sidebarOrder" = st."sidebarOrder"
      FROM user_settings st
      WHERE u.id = st."userId"
    `);

    // 5. Восстанавливаем данные из user_blocks
    await queryRunner.query(`
      UPDATE users u
      SET "isBlocked" = b."isBlocked",
          "blockedAt" = b."blockedAt",
          "blockReason" = b."blockReason"
      FROM user_blocks b
      WHERE u.id = b."userId"
    `);

    // 6. Удаляем новые таблицы
    await queryRunner.query(`DROP TABLE user_verification`);
    await queryRunner.query(`DROP TABLE user_security`);
    await queryRunner.query(`DROP TABLE user_settings`);
    await queryRunner.query(`DROP TABLE user_blocks`);
  }
}
