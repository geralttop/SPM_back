# Настройка системы жалоб

## Что было добавлено

1. **Новые файлы:**
   - `src/reports/` - модуль системы жалоб
   - `src/auth/guards/blocked-user.guard.ts` - guard для проверки заблокированных пользователей
   - `src/users/dto/block-user.dto.ts` - DTO для блокировки пользователей
   - Миграции для создания таблиц

2. **Обновленные файлы:**
   - `src/app.module.ts` - добавлен ReportsModule
   - `src/admin/admin.controller.ts` - добавлены методы для работы с жалобами
   - `src/admin/admin.module.ts` - добавлен ReportsModule
   - `src/users/user.entity.ts` - добавлены поля блокировки
   - `src/users/users.service.ts` - добавлены методы блокировки
   - `src/auth/auth.module.ts` - добавлен TypeORM для User entity

## Запуск

1. **Установите зависимости** (если еще не установлены):
   ```bash
   cd SPM_backend
   npm install
   ```

2. **Запустите миграции:**
   ```bash
   npm run migration:run
   ```

3. **Запустите сервер:**
   ```bash
   npm run start:dev
   ```

## Тестирование

### 1. Создание жалобы на точку

```bash
# Сначала получите JWT токен через логин
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Используйте полученный токен для создания жалобы
curl -X POST http://localhost:3000/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "point",
    "reason": "spam",
    "description": "Тестовая жалоба на точку",
    "pointId": "EXISTING_POINT_ID"
  }'
```

### 2. Просмотр жалоб (админ)

```bash
# Войдите как админ
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin_password"}'

# Просмотрите жалобы
curl -X GET http://localhost:3000/admin/reports \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 3. Обработка жалобы

```bash
# Удалить объект жалобы
curl -X POST http://localhost:3000/admin/reports/1/resolve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "adminNotes": "Объект удален по жалобе"
  }'
```

## API Endpoints

### Пользовательские
- `POST /reports` - создать жалобу

### Админские
- `GET /admin/reports` - список жалоб
- `GET /admin/reports/:id` - конкретная жалоба
- `PUT /admin/reports/:id` - обновить жалобу
- `POST /admin/reports/:id/resolve` - обработать жалобу
- `DELETE /admin/reports/:id` - удалить жалобу
- `POST /admin/users/:id/block` - заблокировать пользователя
- `POST /admin/users/:id/unblock` - разблокировать пользователя
- `GET /admin/users/blocked` - список заблокированных

## Структура БД

### Таблица reports
- Хранит все жалобы
- Связана с users, points, comments
- Поддерживает статусы и причины жалоб

### Обновления в таблице users
- `isBlocked` - флаг блокировки
- `blockedAt` - время блокировки
- `blockReason` - причина блокировки

## Безопасность

1. **Авторизация:** Все endpoints требуют JWT токен
2. **Роли:** Админские функции доступны только администраторам
3. **Валидация:** Проверка существования объектов жалоб
4. **Защита от дублей:** Нельзя подать повторную жалобу
5. **Блокировка:** Заблокированные пользователи не могут действовать

## Возможные улучшения

1. **Уведомления:** Email/push уведомления о жалобах
2. **Автомодерация:** Автоматическая обработка по ключевым словам
3. **Статистика:** Дашборд с аналитикой жалоб
4. **Апелляции:** Система обжалования блокировок
5. **Временные блокировки:** Блокировки на определенный срок