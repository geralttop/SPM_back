import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, passwordHash: string, username: string, code: string): Promise<User> {
  const newUser = this.usersRepository.create({
      email,
      password: passwordHash,
      username,
      confirmationCode: code,
      isEmailVerified: false, // по умолчанию не подтвержден
    });
    return this.usersRepository.save(newUser);
  }

// Добавим метод подтверждения
  async verifyUser(email: string, code: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) return false;

    // ПРОВЕРКА ВРЕМЕНИ
    if (user.codeCreatedAt) {
      const now = new Date();
      const diffInMinutes = (now.getTime() - user.codeCreatedAt.getTime()) / 1000 / 60;
      if (diffInMinutes > 5) {
        throw new BadRequestException('Срок действия кода истек');
      }
    }

    if (user.confirmationCode === code) {
      user.isEmailVerified = true;
      user.confirmationCode = null;
      user.codeCreatedAt = null; // Очищаем
      await this.saveUser(user);
      return true;
    }
    return false;
  }

  // Метод для поиска пользователя (нужен при логине и проверке уникальности)
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  // Метод для поиска по ID (пригодится для профиля)
  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  // Позволяет сохранить любые изменения в объекте пользователя
  async saveUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  // Метод для частичного обновления данных пользователя
  async update(id: number, attrs: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException(`Пользователь с ID ${id} не найден`);
    }
    
    // Копируем новые атрибуты (например, hashedRefreshToken) в объект пользователя
    Object.assign(user, attrs);
    
    return this.usersRepository.save(user);
  }
}
