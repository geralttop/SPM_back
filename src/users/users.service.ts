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
    if (!user) {
      console.log('❌ verifyUser: Пользователь не найден');
      return false;
    }

    console.log('🔍 verifyUser: До изменений:', {
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      confirmationCode: user.confirmationCode,
    });

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
      
      console.log('✏️ verifyUser: После изменений (перед сохранением):', {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        confirmationCode: user.confirmationCode,
      });
      
      const savedUser = await this.saveUser(user);
      
      console.log('✅ verifyUser: После сохранения:', {
        email: savedUser.email,
        isEmailVerified: savedUser.isEmailVerified,
        confirmationCode: savedUser.confirmationCode,
      });
      
      return true;
    }
    
    console.log('❌ verifyUser: Код не совпадает');
    return false;
  }

  // Метод для поиска пользователя (нужен при логине и проверке уникальности)
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  // Метод для поиска по username (для проверки уникальности)
  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
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
    console.log('💾 saveUser: Сохранение пользователя', {
      id: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    });
    
    const saved = await this.usersRepository.save(user);
    
    console.log('✅ saveUser: Пользователь сохранен', {
      id: saved.id,
      email: saved.email,
      isEmailVerified: saved.isEmailVerified,
    });
    
    return saved;
  }

  async remove(id: number): Promise<void> {
      const user = await this.findById(id);
      if (!user) {
        throw new BadRequestException(`Пользователь с ID ${id} не найден`);
      }

      if (user.role === 'admin') {
        throw new BadRequestException('Нельзя удалить администратора');
      }

      // Используем remove вместо delete для корректного удаления с каскадами
      await this.usersRepository.remove(user);
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

  // Метод для поиска пользователей по username
  async searchByUsername(query: string): Promise<User[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE LOWER(:query)', { query: `%${query}%` })
      .select(['user.id', 'user.username', 'user.email', 'user.bio'])
      .take(20) // Ограничиваем результаты
      .getMany();
  }

  // Метод для админки с пагинацией
  async findAllWithPagination(options: {
    skip?: number;
    take?: number;
    order?: any;
  }): Promise<[User[], number]> {
    return this.usersRepository.findAndCount({
      skip: options.skip || 0,
      take: options.take || 10,
      order: options.order || { id: 'ASC' },
    });
  }

  // Методы для блокировки пользователей
  async blockUser(id: number, reason?: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException(`Пользователь с ID ${id} не найден`);
    }

    if (user.role === 'admin') {
      throw new BadRequestException('Нельзя заблокировать администратора');
    }

    user.isBlocked = true;
    user.blockedAt = new Date();
    user.blockReason = reason || 'Заблокирован администратором';

    return this.usersRepository.save(user);
  }

  async unblockUser(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException(`Пользователь с ID ${id} не найден`);
    }

    user.isBlocked = false;
    user.blockedAt = null;
    user.blockReason = null;

    return this.usersRepository.save(user);
  }

  async getBlockedUsers(): Promise<User[]> {
    return this.usersRepository.find({
      where: { isBlocked: true },
      order: { blockedAt: 'DESC' },
    });
  }
}
