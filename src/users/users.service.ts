import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserVerification } from './entities/user-verification.entity';
import { UserSecurity } from './entities/user-security.entity';
import { UserSettings } from './entities/user-settings.entity';
import { UserBlock } from './entities/user-block.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserVerification)
    private verificationRepository: Repository<UserVerification>,
    @InjectRepository(UserSecurity)
    private securityRepository: Repository<UserSecurity>,
    @InjectRepository(UserSettings)
    private settingsRepository: Repository<UserSettings>,
    @InjectRepository(UserBlock)
    private blockRepository: Repository<UserBlock>,
  ) {}

  async create(email: string, passwordHash: string, username: string, code: string): Promise<User> {
    const newUser = this.usersRepository.create({
      email,
      password: passwordHash,
      username,
      isEmailVerified: false,
    });
    const savedUser = await this.usersRepository.save(newUser);

    // Создаем связанные записи
    await this.verificationRepository.save({
      userId: savedUser.id,
      confirmationCode: code,
      codeCreatedAt: new Date(),
    });

    await this.securityRepository.save({
      userId: savedUser.id,
    });

    await this.settingsRepository.save({
      userId: savedUser.id,
    });

    await this.blockRepository.save({
      userId: savedUser.id,
    });

    return savedUser;
  }

  // Добавим метод подтверждения
  async verifyUser(email: string, code: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) {
      this.logger.warn('verifyUser: Пользователь не найден');
      return false;
    }

    const verification = await this.verificationRepository.findOne({
      where: { userId: user.id },
    });

    if (!verification) {
      return false;
    }

    this.logger.log(`verifyUser: До изменений: ${JSON.stringify({
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      confirmationCode: verification.confirmationCode,
    })}`);

    // ПРОВЕРКА ВРЕМЕНИ
    if (verification.codeCreatedAt) {
      const now = new Date();
      const diffInMinutes =
        (now.getTime() - verification.codeCreatedAt.getTime()) / 1000 / 60;
      if (diffInMinutes > 5) {
        throw new BadRequestException('Срок действия кода истек');
      }
    }

    if (verification.confirmationCode === code) {
      user.isEmailVerified = true;
      verification.confirmationCode = null;
      verification.codeCreatedAt = null;

      this.logger.log(`verifyUser: После изменений (перед сохранением): ${JSON.stringify({
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        confirmationCode: verification.confirmationCode,
      })}`);

      await this.verificationRepository.save(verification);
      const savedUser = await this.saveUser(user);

      this.logger.log(`verifyUser: После сохранения: ${JSON.stringify({
        email: savedUser.email,
        isEmailVerified: savedUser.isEmailVerified,
      })}`);

      return true;
    }

    this.logger.warn('verifyUser: Код не совпадает');
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
    this.logger.log(`saveUser: Сохранение пользователя ${JSON.stringify({
      id: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    })}`);
    
    const saved = await this.usersRepository.save(user);
    
    this.logger.log(`saveUser: Пользователь сохранен ${JSON.stringify({
      id: saved.id,
      email: saved.email,
      isEmailVerified: saved.isEmailVerified,
    })}`);
    
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

    let block = await this.blockRepository.findOne({ where: { userId: id } });
    if (!block) {
      block = this.blockRepository.create({ userId: id });
    }

    block.isBlocked = true;
    block.blockedAt = new Date();
    block.blockReason = reason || 'Заблокирован администратором';

    await this.blockRepository.save(block);
    return user;
  }

  async unblockUser(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException(`Пользователь с ID ${id} не найден`);
    }

    const block = await this.blockRepository.findOne({ where: { userId: id } });
    if (block) {
      block.isBlocked = false;
      block.blockedAt = null;
      block.blockReason = null;
      await this.blockRepository.save(block);
    }

    return user;
  }

  async getBlockedUsers(): Promise<User[]> {
    const blocks = await this.blockRepository.find({
      where: { isBlocked: true },
      order: { blockedAt: 'DESC' },
    });

    const userIds = blocks.map((b) => b.userId);
    if (userIds.length === 0) return [];

    return this.usersRepository.findByIds(userIds);
  }

  // Вспомогательные методы для работы с новыми таблицами
  async getVerification(userId: number): Promise<UserVerification | null> {
    return this.verificationRepository.findOne({ where: { userId } });
  }

  async getSecurity(userId: number): Promise<UserSecurity | null> {
    return this.securityRepository.findOne({ where: { userId } });
  }

  async getSettings(userId: number): Promise<UserSettings | null> {
    return this.settingsRepository.findOne({ where: { userId } });
  }

  async getBlock(userId: number): Promise<UserBlock | null> {
    return this.blockRepository.findOne({ where: { userId } });
  }

  async updateVerification(
    userId: number,
    data: Partial<UserVerification>,
  ): Promise<UserVerification> {
    let verification = await this.getVerification(userId);
    if (!verification) {
      verification = this.verificationRepository.create({ userId });
    }
    Object.assign(verification, data);
    return this.verificationRepository.save(verification);
  }

  async updateSecurity(
    userId: number,
    data: Partial<UserSecurity>,
  ): Promise<UserSecurity> {
    let security = await this.getSecurity(userId);
    if (!security) {
      security = this.securityRepository.create({ userId });
    }
    Object.assign(security, data);
    return this.securityRepository.save(security);
  }

  async updateSettings(
    userId: number,
    data: Partial<UserSettings>,
  ): Promise<UserSettings> {
    let settings = await this.getSettings(userId);
    if (!settings) {
      settings = this.settingsRepository.create({ userId });
    }
    Object.assign(settings, data);
    return this.settingsRepository.save(settings);
  }
}
