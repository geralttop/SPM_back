# 🔐 Настройка безопасности

## Настройка переменных окружения

### 1. Скопируйте файл с примером
```bash
cp .env.example .env
```

### 2. Сгенерируйте сильные JWT секреты

**Важно**: Используйте разные секреты для ACCESS и REFRESH токенов!

#### Способ 1: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Способ 2: OpenSSL
```bash
openssl rand -hex 64
```

#### Способ 3: Online генератор
Используйте https://generate-secret.vercel.app/64 (только для разработки!)

### 3. Обновите .env файл

```env
# JWT Secrets - ОБЯЗАТЕЛЬНО ЗАМЕНИТЕ НА СВОИ!
JWT_ACCESS_SECRET=ваш-сгенерированный-access-секрет-минимум-64-символа
JWT_REFRESH_SECRET=ваш-сгенерированный-refresh-секрет-минимум-64-символа

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Email configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Application
NODE_ENV=development
PORT=3000
```

## ⚠️ Важные правила безопасности

1. **НИКОГДА не коммитьте .env файл в репозиторий**
2. **Используйте разные секреты для разработки и продакшена**
3. **Секреты должны быть минимум 32 символа (рекомендуется 64)**
4. **Регулярно меняйте секреты в продакшене**
5. **Используйте переменные окружения на сервере, а не .env файлы**

## Проверка настройки

После настройки запустите приложение:
```bash
npm run start:dev
```

Если вы видите ошибки связанные с JWT, проверьте:
- Правильность секретов в .env
- Что .env файл находится в корне проекта
- Что ConfigModule правильно подключен