import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import * as bcrypt from 'bcrypt';

async function createAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = process.env.ADMIN_EMAIL || 'admin@spm.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const username = process.env.ADMIN_USERNAME || 'admin';

  try {
    // Проверяем, существует ли уже админ
    const existingAdmin = await usersService.findByEmail(email);
    if (existingAdmin) {
      console.log('Админ уже существует:', email);
      await app.close();
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const admin = await usersService.create(email, hashedPassword, username, '');
    
    // Обновляем роль и подтверждаем email
    await usersService.update(admin.id, {
      role: 'admin',
      isEmailVerified: true,
      confirmationCode: null,
      codeCreatedAt: null,
    });

    console.log('Админ успешно создан:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Username:', username);
    
  } catch (error) {
    console.error('Ошибка при создании админа:', error);
  }

  await app.close();
}

createAdmin();