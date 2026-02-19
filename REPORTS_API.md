# API системы жалоб

## Обзор

Система жалоб позволяет пользователям жаловаться на:
- Точки на карте
- Комментарии к точкам
- Других пользователей

Администраторы могут обрабатывать жалобы через админ-панель.

## Endpoints

### Пользовательские endpoints

#### POST /reports
Создать жалобу

**Требует авторизации**: Да

**Body:**
```json
{
  "type": "point" | "comment" | "user",
  "reason": "spam" | "inappropriate" | "harassment" | "fake" | "other",
  "description": "Описание жалобы (опционально)",
  "pointId": "uuid точки (если type = 'point')",
  "commentId": 123, // ID комментария (если type = 'comment')
  "reportedUserId": 456 // ID пользователя (если type = 'user')
}
```

**Ответ:**
```json
{
  "id": 1,
  "type": "point",
  "reason": "spam",
  "description": "Спам точка",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "reporterId": 123
}
```

### Админские endpoints

#### GET /admin/reports
Получить список жалоб

**Требует роль**: admin

**Query параметры:**
- `_start` - начальный индекс (по умолчанию 0)
- `_end` - конечный индекс (по умолчанию 10)
- `_sort` - поле для сортировки (по умолчанию createdAt)
- `_order` - порядок сортировки ASC/DESC (по умолчанию DESC)
- `status` - фильтр по статусу (pending, reviewed, resolved, dismissed)

#### GET /admin/reports/:id
Получить конкретную жалобу

#### PUT /admin/reports/:id
Обновить жалобу

**Body:**
```json
{
  "status": "reviewed" | "resolved" | "dismissed",
  "adminNotes": "Заметки администратора"
}
```

#### POST /admin/reports/:id/resolve
Обработать жалобу с действием

**Body:**
```json
{
  "action": "delete" | "block" | "dismiss",
  "adminNotes": "Заметки администратора"
}
```

**Действия:**
- `delete` - удалить объект жалобы (точку/комментарий)
- `block` - заблокировать пользователя
- `dismiss` - отклонить жалобу

#### DELETE /admin/reports/:id
Удалить жалобу

### Блокировка пользователей

#### POST /admin/users/:id/block
Заблокировать пользователя

**Body:**
```json
{
  "reason": "Причина блокировки"
}
```

#### POST /admin/users/:id/unblock
Разблокировать пользователя

#### GET /admin/users/blocked
Получить список заблокированных пользователей

## Типы данных

### ReportType
- `point` - жалоба на точку
- `comment` - жалоба на комментарий  
- `user` - жалоба на пользователя

### ReportReason
- `spam` - спам
- `inappropriate` - неподходящий контент
- `harassment` - домогательства
- `fake` - фейковая информация
- `other` - другое

### ReportStatus
- `pending` - ожидает рассмотрения
- `reviewed` - рассмотрена
- `resolved` - решена
- `dismissed` - отклонена

## Валидация

1. При создании жалобы проверяется существование объекта жалобы
2. Пользователь не может пожаловаться сам на себя
3. Пользователь не может подать повторную жалобу на тот же объект
4. Заблокированные пользователи не могут выполнять действия в системе

## База данных

### Таблица reports
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  type ENUM('point', 'comment', 'user') NOT NULL,
  reason ENUM('spam', 'inappropriate', 'harassment', 'fake', 'other') NOT NULL,
  description TEXT,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  point_id UUID REFERENCES points(id) ON DELETE CASCADE,
  comment_id INT REFERENCES comments(id) ON DELETE CASCADE,
  reported_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  reviewed_by_id INT REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT
);
```

### Дополнительные поля в таблице users
```sql
ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN blocked_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN block_reason TEXT NULL;
```