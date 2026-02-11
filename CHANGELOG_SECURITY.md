# 🔐 Исправление критической уязвимости: Hardcoded секреты

## ✅ Что было исправлено

### Проблема
JWT секреты были жестко закодированы в исходном коде:
- `auth.service.ts`: `secret: 'ACCESS_SECRET'` и `secret: 'REFRESH_SECRET'`
- `auth.module.ts`: `secret: 'ACCESS_SECRET'`
- `jwt.strategy.ts`: `secretOrKey: 'ACCESS_SECRET'`

### Решение
1. **Создан .env файл** с сильными сгенерированными секретами
2. **Установлен @nestjs/config** для работы с переменными окружения
3. **Обновлен код** для использования ConfigService вместо hardcoded значений
4. **Добавлены проверки** на существование секретов при запуске

## 📁 Измененные файлы

### Новые файлы:
- `SPM_backend/.env` - переменные окружения (НЕ коммитится)
- `SPM_backend/.env.example` - пример конфигурации
- `SPM_backend/SECURITY_SETUP.md` - инструкции по настройке
- `SPM_backend/CHANGELOG_SECURITY.md` - этот файл

### Измененные файлы:
- `SPM_backend/src/app.module.ts` - добавлен ConfigModule
- `SPM_backend/src/auth/auth.module.ts` - использует ConfigService
- `SPM_backend/src/auth/auth.service.ts` - использует ConfigService
- `SPM_backend/src/auth/strategies/jwt.strategy.ts` - использует ConfigService
- `SPM_backend/package.json` - добавлена зависимость @nestjs/config

## 🔧 Технические детали

### Сгенерированные секреты:
- **JWT_ACCESS_SECRET**: 128 символов (512 бит)
- **JWT_REFRESH_SECRET**: 128 символов (512 бит)
- Сгенерированы с помощью `crypto.randomBytes(64).toString('hex')`

### Безопасность:
- ✅ Секреты больше не в исходном коде
- ✅ .env файл в .gitignore
- ✅ Добавлены проверки на существование секретов
- ✅ Разные секреты для access и refresh токенов
- ✅ Создан .env.example для других разработчиков

## 🚀 Проверка работоспособности

Приложение успешно:
- ✅ Компилируется без ошибок
- ✅ Запускается без ошибок
- ✅ Все роуты аутентификации доступны
- ✅ JWT стратегия инициализируется корректно

## 📋 Следующие шаги

Рекомендуется исправить остальные критические уязвимости:
1. Добавить валидацию входных данных (DTOs)
2. Добавить rate limiting
3. Защитить от brute-force атак на коды подтверждения
4. Добавить требования к сложности паролей

## ⚠️ Важно для продакшена

1. **Сгенерируйте новые секреты** для продакшена
2. **Используйте переменные окружения** сервера, а не .env файлы
3. **Регулярно меняйте секреты**
4. **Никогда не коммитьте .env файлы**

---

# 🔐 Исправление критической уязвимости: Отсутствие валидации входных данных

## ✅ Что было исправлено

### Проблема
DTOs не содержали никаких валидаторов:
- Можно было отправить пустые пароли
- Невалидные email адреса принимались
- Отсутствовали ограничения на длину строк
- Нет проверки формата кодов подтверждения
- ValidationPipe не был подключен глобально

### Решение
1. **Подключен ValidationPipe** в main.ts с строгими настройками
2. **Добавлена валидация во все DTOs** с подробными сообщениями об ошибках
3. **Усилены требования к паролям** - обязательны буквы, цифры, спецсимволы
4. **Добавлена проверка уникальности username** при регистрации
5. **Создан RefreshTokenDto** для валидации refresh токенов

## 📁 Измененные файлы

### Новые файлы:
- `SPM_backend/src/auth/dto/refresh-token.dto.ts` - валидация refresh токенов

### Измененные файлы:
- `SPM_backend/src/main.ts` - подключен ValidationPipe
- `SPM_backend/src/auth/dto/login.dto.ts` - добавлена валидация email и пароля
- `SPM_backend/src/auth/dto/register.dto.ts` - строгая валидация с требованиями к паролю
- `SPM_backend/src/auth/dto/verify-code.dto.ts` - валидация 6-значного кода
- `SPM_backend/src/auth/auth.controller.ts` - использует RefreshTokenDto
- `SPM_backend/src/auth/auth.service.ts` - проверка уникальности username
- `SPM_backend/src/users/users.service.ts` - добавлен метод findByUsername

## 🔧 Детали валидации

### LoginDto:
- ✅ Email: проверка формата, не пустой, макс 254 символа
- ✅ Пароль: не пустой, мин 8 символов, макс 128 символов

### RegisterDto:
- ✅ Username: 3-30 символов, только буквы/цифры/подчеркивания, уникальный
- ✅ Email: валидный формат, уникальный, макс 254 символа
- ✅ Пароль: мин 8 символов, обязательны: строчные, заглавные, цифры, спецсимволы

### VerifyCodeDto:
- ✅ Email: валидный формат, не пустой
- ✅ Код: ровно 6 цифр, только числа

### RefreshTokenDto:
- ✅ RefreshToken: валидный JWT формат, не пустой

### ValidationPipe настройки:
- ✅ `whitelist: true` - удаляет лишние поля
- ✅ `forbidNonWhitelisted: true` - ошибка при лишних полях
- ✅ `transform: true` - автопреобразование типов
- ✅ Подробные сообщения об ошибках

## 🧪 Тестирование

### Проверено:
- ✅ Невалидные данные отклоняются с подробными ошибками
- ✅ Валидные данные принимаются
- ✅ Уникальность email и username проверяется
- ✅ Коды подтверждения валидируются строго
- ✅ Лишние поля в запросах удаляются

### Примеры ошибок валидации:
```json
{
  "message": [
    "Имя пользователя должно содержать минимум 3 символа",
    "Некорректный формат email",
    "Пароль должен содержать минимум: 1 строчную букву, 1 заглавную букву, 1 цифру и 1 спецсимвол (@$!%*?&)",
    "Пароль должен содержать минимум 8 символов"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## 🛡️ Безопасность

### Что теперь защищено:
- ✅ DoS атаки через длинные строки (ограничения длины)
- ✅ Слабые пароли (строгие требования)
- ✅ Невалидные email (проверка формата)
- ✅ Дублирование пользователей (уникальность)
- ✅ Некорректные коды (только 6 цифр)
- ✅ Инъекции через лишние поля (whitelist)

### Требования к паролю:
- Минимум 8 символов
- Минимум 1 строчная буква (a-z)
- Минимум 1 заглавная буква (A-Z)  
- Минимум 1 цифра (0-9)
- Минимум 1 спецсимвол (@$!%*?&)

## 📋 Следующие шаги

Рекомендуется исправить остальные критические уязвимости:
1. ✅ ~~Hardcoded секреты~~ - ИСПРАВЛЕНО
2. ✅ ~~Отсутствие валидации~~ - ИСПРАВЛЕНО  
3. 🔄 Добавить rate limiting (защита от brute-force)
4. 🔄 Защитить от brute-force атак на коды подтверждения
5. 🔄 Переместить токены в httpOnly cookies
---

# 🔐 Исправление критической уязвимости: Rate Limiting и защита от Brute-Force

## ✅ Что было исправлено

### Проблема
Отсутствовала защита от brute-force атак:
- Нет ограничений на количество запросов
- Можно перебирать коды подтверждения без ограничений
- Нет блокировки после неудачных попыток
- Возможны DoS атаки через массовые запросы

### Решение
1. **Установлен @nestjs/throttler** для rate limiting
2. **Настроен глобальный ThrottlerGuard** с многоуровневой защитой
3. **Добавлены специальные ограничения** для критических endpoints
4. **Создан BruteForceProtectionService** для защиты от перебора кодов
5. **Добавлены поля блокировки** в User entity
6. **Реализована система блокировки** с экспоненциальным backoff

## 📁 Измененные файлы

### Новые файлы:
- `SPM_backend/src/auth/services/brute-force-protection.service.ts` - сервис защиты от brute-force

### Измененные файлы:
- `SPM_backend/src/app.module.ts` - подключен ThrottlerModule и ThrottlerGuard
- `SPM_backend/src/auth/auth.module.ts` - добавлен BruteForceProtectionService
- `SPM_backend/src/auth/auth.controller.ts` - добавлены @Throttle декораторы
- `SPM_backend/src/auth/auth.service.ts` - интеграция с brute-force защитой
- `SPM_backend/src/users/user.entity.ts` - добавлены поля блокировки
- `SPM_backend/package.json` - добавлена зависимость @nestjs/throttler

## 🔧 Настройки Rate Limiting

### Глобальные лимиты:
- **Short**: 3 запроса в секунду
- **Medium**: 20 запросов за 10 секунд  
- **Long**: 100 запросов в минуту

### Специальные лимиты по endpoints:

#### Критические endpoints (строгие лимиты):
- **register**: 5 попыток в минуту
- **login**: 5 попыток в минуту
- **verify-email**: 3 попытки в минуту ⚠️ КРИТИЧНО
- **verify-login**: 3 попытки в минуту ⚠️ КРИТИЧНО

#### Административные endpoints:
- **delete-me**: 2 удаления за 5 минут
- **user/:id** (admin): 10 удалений в минуту
- **refresh**: 10 обновлений в минуту
- **update-profile**: 5 обновлений в минуту

#### Исключения:
- **profile**: без ограничений (только JWT проверка)

## 🛡️ Brute-Force защита

### Защита кодов подтверждения:
- **Максимум попыток**: 3 неверных кода
- **Блокировка**: 15 минут
- **Сброс**: при успешном вводе кода

### Защита входа:
- **Максимум попыток**: 5 неверных паролей
- **Блокировка**: 30 минут
- **Сброс**: при успешном входе

### Новые поля в User entity:
```typescript
failedCodeAttempts: number;        // Счетчик неверных кодов
codeBlockedUntil: Date | null;     // Время окончания блокировки кодов
failedLoginAttempts: number;       // Счетчик неверных паролей
loginBlockedUntil: Date | null;    // Время окончания блокировки входа
```

## 🧪 Тестирование

### Проверено Rate Limiting:
- ✅ Глобальные лимиты работают (429 Too Many Requests)
- ✅ Специальные лимиты для endpoints работают
- ✅ Исключения (@SkipThrottle) работают

### Проверено Brute-Force защита:
- ✅ Блокировка после 3 неверных кодов на 15 минут
- ✅ Блокировка после 5 неверных паролей на 30 минут
- ✅ Подробные сообщения об ошибках с временем блокировки
- ✅ Логирование всех попыток атак

### Примеры ответов:

**Rate Limiting:**
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

**Brute-Force блокировка:**
```json
{
  "message": "Слишком много неверных попыток. Повторите через 15 минут.",
  "error": "Bad Request",
  "statusCode": 400
}
```

## 🔒 Безопасность

### Что теперь защищено:
- ✅ DoS атаки через массовые запросы (rate limiting)
- ✅ Brute-force атаки на коды подтверждения (блокировка)
- ✅ Brute-force атаки на пароли (блокировка)
- ✅ Перебор 6-значных кодов (максимум 3 попытки)
- ✅ Автоматические атаки (временные блокировки)
- ✅ Логирование всех подозрительных активностей

### Логирование безопасности:
- Все неудачные попытки входа
- Все неверные коды подтверждения
- Блокировки пользователей
- Превышения rate limits

## 📊 Мониторинг

### Логи для отслеживания:
```
[WARN] Неверный код от пользователя user@example.com. Попытка 2/3
[ERROR] Пользователь user@example.com заблокирован на 15 минут за превышение попыток ввода кода
[WARN] Попытка ввода кода заблокированным пользователем: user@example.com
```

## 📋 Следующие шаги

Рекомендуется исправить остальные критические уязвимости:
1. ✅ ~~Hardcoded секреты~~ - ИСПРАВЛЕНО
2. ✅ ~~Отсутствие валидации~~ - ИСПРАВЛЕНО  
3. ✅ ~~Rate limiting~~ - ИСПРАВЛЕНО
4. ✅ ~~Brute-force защита~~ - ИСПРАВЛЕНО
5. 🔄 Переместить токены в httpOnly cookies
6. 🔄 Добавить HTTPS принуждение
7. 🔄 Добавить CSP headers

---

# 🔐 Исправление критической уязвимости: Небезопасное хранение токенов

## ✅ Что было исправлено

### Проблема
Токены хранились в localStorage на фронтенде:
- Уязвимы для XSS атак
- Доступны для любого JavaScript кода
- Могут быть украдены вредоносными скриптами
- Нет защиты от межсайтового скриптинга

### Решение
1. **Установлен cookie-parser** для работы с cookies
2. **Создан CookieService** для управления httpOnly cookies
3. **Refresh токены перемещены в httpOnly cookies**
4. **Access токены отправляются в теле ответа** (для Authorization header)
5. **Добавлен endpoint /auth/logout** для очистки cookies
6. **Настроены secure cookies** для продакшена

## 📁 Измененные файлы

### Новые файлы:
- `SPM_backend/src/auth/services/cookie.service.ts` - сервис управления cookies

### Измененные файлы:
- `SPM_backend/src/main.ts` - подключен cookie-parser, обновлен CORS
- `SPM_backend/src/auth/auth.module.ts` - добавлен CookieService
- `SPM_backend/src/auth/auth.controller.ts` - обновлены endpoints для работы с cookies
- `SPM_backend/package.json` - добавлены cookie-parser и @types/cookie-parser

## 🔧 Настройки Cookies

### Refresh Token Cookie:
```typescript
{
  httpOnly: true,        // Недоступен для JavaScript
  secure: true,          // Только HTTPS (в продакшене)
  sameSite: 'strict',    // Защита от CSRF
  maxAge: 7 дней,        // Время жизни
  path: '/'              // Доступен для всех путей
}
```

### Access Token:
- **НЕ хранится в cookie**
- Отправляется в теле ответа
- Клиент использует в Authorization header
- Хранится в памяти приложения (не в localStorage)

## 🔄 Изменения в API

### Endpoints с cookies:

#### POST /auth/verify-email
**Было:**
```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

**Стало:**
```json
{
  "message": "Почта успешно подтверждена!",
  "accessToken": "..."
}
+ Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

#### POST /auth/verify-login
**Было:**
```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

**Стало:**
```json
{
  "message": "Вход выполнен успешно",
  "accessToken": "..."
}
+ Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

#### POST /auth/refresh
**Было:**
```json
// Body: { "refreshToken": "..." }
// Response: { "accessToken": "...", "refreshToken": "..." }
```

**Стало:**
```json
// Body: {} (токен берется из cookie)
// Response: { "message": "Токен обновлен успешно", "accessToken": "..." }
+ Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

#### POST /auth/logout (НОВЫЙ)
```json
// Response: { "message": "Выход выполнен успешно" }
+ Set-Cookie: refreshToken=; Max-Age=0
+ Set-Cookie: accessToken=; Max-Age=0
```

## 🛡️ Безопасность

### Что теперь защищено:
- ✅ XSS атаки не могут украсть refresh token (httpOnly)
- ✅ CSRF атаки заблокированы (sameSite: strict)
- ✅ Man-in-the-middle атаки затруднены (secure в продакшене)
- ✅ Refresh token недоступен для JavaScript
- ✅ Автоматическая очистка при logout

### Уровни защиты:

**httpOnly:**
- Cookie недоступен через `document.cookie`
- Защита от XSS атак
- Только сервер может читать/изменять

**secure:**
- Cookie передается только по HTTPS
- Защита от перехвата в открытых сетях
- Автоматически включается в продакшене

**sameSite: strict:**
- Cookie не отправляется при cross-site запросах
- Защита от CSRF атак
- Максимальный уровень защиты

## 📱 Изменения для фронтенда

### Что нужно изменить:

1. **Удалить сохранение refresh token в localStorage:**
```typescript
// УДАЛИТЬ:
localStorage.setItem('refreshToken', refreshToken);

// Refresh token теперь автоматически в cookie
```

2. **Обновить API клиент:**
```typescript
// Добавить credentials: 'include' для отправки cookies
fetch('/auth/verify-login', {
  method: 'POST',
  credentials: 'include', // ВАЖНО!
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, code })
})
```

3. **Обновить refresh логику:**
```typescript
// БЫЛО:
const refreshToken = localStorage.getItem('refreshToken');
fetch('/auth/refresh', {
  body: JSON.stringify({ refreshToken })
})

// СТАЛО:
fetch('/auth/refresh', {
  method: 'POST',
  credentials: 'include', // Токен автоматически из cookie
  headers: { 'Authorization': `Bearer ${accessToken}` }
})
```

4. **Добавить logout:**
```typescript
async function logout() {
  await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  // Очистить access token из памяти
  setAccessToken(null);
}
```

## 🧪 Тестирование

### Проверка cookies:
```bash
# Регистрация и получение кода
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","username":"testuser"}' \
  -c cookies.txt

# Подтверждение с сохранением cookies
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}' \
  -c cookies.txt -b cookies.txt

# Проверка файла cookies.txt - должен содержать refreshToken
cat cookies.txt
```

### Проверка refresh:
```bash
# Обновление токена (refresh token из cookie)
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer <access_token>" \
  -b cookies.txt -c cookies.txt
```

### Проверка logout:
```bash
# Выход с очисткой cookies
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -b cookies.txt -c cookies.txt

# Проверка - cookies должны быть удалены
cat cookies.txt
```

## 📋 Следующие шаги

Рекомендуется исправить остальные проблемы безопасности:
1. ✅ ~~Hardcoded секреты~~ - ИСПРАВЛЕНО
2. ✅ ~~Отсутствие валидации~~ - ИСПРАВЛЕНО  
3. ✅ ~~Rate limiting~~ - ИСПРАВЛЕНО
4. ✅ ~~Brute-force защита~~ - ИСПРАВЛЕНО
5. ✅ ~~Небезопасное хранение токенов~~ - ИСПРАВЛЕНО
6. 🔄 Обновить фронтенд для работы с cookies
7. 🔄 Добавить HTTPS принуждение
8. 🔄 Добавить CSP headers