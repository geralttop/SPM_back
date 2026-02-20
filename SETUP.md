# Настройка переменных окружения

## Первоначальная настройка

1. Скопируйте файл `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```

2. Заполните переменные в файле `.env`:

### База данных
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
```

### Email (Яндекс SMTP)
```env
MAIL_HOST=smtp.yandex.ru
MAIL_PORT=465
MAIL_USER=your-email@yandex.ru
MAIL_PASS=your-yandex-app-password
MAIL_FROM_NAME=SPM
```

**Важно:** Для Яндекс почты нужно использовать пароль приложения, а не основной пароль аккаунта.

### JWT секреты
Сгенерируйте сильные секреты (минимум 32 символа):
```env
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars
```

### Админ пользователь
```env
ADMIN_EMAIL=admin@spm.com
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_USERNAME=admin
```

## Создание админ пользователя

После настройки переменных окружения запустите скрипт:
```bash
npm run create-admin
```

## Безопасность

- **НИКОГДА** не коммитьте файл `.env` в репозиторий
- Используйте сильные пароли для продакшена
- Регулярно меняйте JWT секреты
- Для Яндекс почты используйте пароли приложений