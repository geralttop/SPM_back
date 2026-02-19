# Примеры использования системы жалоб

## Сценарии использования

### 1. Пользователь жалуется на спам-точку

```bash
# Пользователь создает жалобу на точку
curl -X POST http://localhost:3000/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "point",
    "reason": "spam",
    "description": "Эта точка содержит рекламу казино",
    "pointId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### 2. Пользователь жалуется на неподходящий комментарий

```bash
curl -X POST http://localhost:3000/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "comment",
    "reason": "inappropriate",
    "description": "Комментарий содержит нецензурную лексику",
    "commentId": 123
  }'
```

### 3. Пользователь жалуется на другого пользователя

```bash
curl -X POST http://localhost:3000/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user",
    "reason": "harassment",
    "description": "Пользователь отправляет оскорбительные сообщения",
    "reportedUserId": 456
  }'
```

## Админские действия

### 1. Просмотр всех жалоб

```bash
curl -X GET "http://localhost:3000/admin/reports?_start=0&_end=20&status=pending" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 2. Просмотр конкретной жалобы

```bash
curl -X GET http://localhost:3000/admin/reports/1 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 3. Удаление спам-точки по жалобе

```bash
curl -X POST http://localhost:3000/admin/reports/1/resolve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "adminNotes": "Точка действительно содержит спам, удалена"
  }'
```

### 4. Блокировка пользователя по жалобе

```bash
curl -X POST http://localhost:3000/admin/reports/2/resolve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "block",
    "adminNotes": "Пользователь заблокирован за домогательства"
  }'
```

### 5. Отклонение жалобы

```bash
curl -X POST http://localhost:3000/admin/reports/3/resolve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "dismiss",
    "adminNotes": "Жалоба необоснованна"
  }'
```

### 6. Ручная блокировка пользователя

```bash
curl -X POST http://localhost:3000/admin/users/456/block \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Множественные нарушения правил сервиса"
  }'
```

### 7. Разблокировка пользователя

```bash
curl -X POST http://localhost:3000/admin/users/456/unblock \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 8. Просмотр заблокированных пользователей

```bash
curl -X GET http://localhost:3000/admin/users/blocked \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Интеграция с фронтендом

### React компонент для создания жалобы

```jsx
import React, { useState } from 'react';

const ReportModal = ({ type, targetId, onClose }) => {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const reportData = {
      type,
      reason,
      description,
    };

    // Добавляем соответствующий ID в зависимости от типа
    if (type === 'point') reportData.pointId = targetId;
    if (type === 'comment') reportData.commentId = targetId;
    if (type === 'user') reportData.reportedUserId = targetId;

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        alert('Жалоба отправлена');
        onClose();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.message}`);
      }
    } catch (error) {
      alert('Ошибка отправки жалобы');
    }
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <h3>Пожаловаться на {type === 'point' ? 'точку' : type === 'comment' ? 'комментарий' : 'пользователя'}</h3>
        
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="spam">Спам</option>
          <option value="inappropriate">Неподходящий контент</option>
          <option value="harassment">Домогательства</option>
          <option value="fake">Фейковая информация</option>
          <option value="other">Другое</option>
        </select>

        <textarea
          placeholder="Опишите проблему (необязательно)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit">Отправить жалобу</button>
        <button type="button" onClick={onClose}>Отмена</button>
      </form>
    </div>
  );
};
```

## Возможные ошибки

### 400 Bad Request
- Пользователь пытается пожаловаться сам на себя
- Пользователь уже подавал жалобу на этот объект
- Объект жалобы не найден
- Неверные данные в запросе

### 403 Forbidden
- Пользователь заблокирован
- Недостаточно прав для выполнения действия

### 404 Not Found
- Жалоба не найдена
- Пользователь не найден

### 401 Unauthorized
- Отсутствует или недействительный JWT токен