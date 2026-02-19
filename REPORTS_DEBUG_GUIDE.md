# Отладка системы жалоб

## Функциональность системы

Система жалоб позволяет:
- Пользователям подавать жалобы на точки, комментарии и других пользователей
- Администраторам обрабатывать жалобы с двумя действиями:
  - **Заблокировать пользователя** - блокирует автора контента или пользователя, на которого пожаловались
  - **Отклонить жалобу** - отмечает жалобу как необоснованную

## Исправленные проблемы

### 1. Ошибка "Internal server error" при обработке жалоб

**Проблемы:**
- Не загружались связанные объекты (point.author, comment.author)
- Захардкоженный ID админа в AdminController
- Отсутствие обработки ошибок

**Исправления:**
- ✅ Добавлены все необходимые relations в `findOne` и `findAll`
- ✅ Исправлен AdminController для получения ID админа из JWT
- ✅ Добавлена подробная обработка ошибок с логированием
- ✅ Добавлены проверки на существование объектов
- ✅ Убрана функциональность удаления объектов (оставлена только блокировка)

### 2. Обновленные файлы:
- `src/reports/reports.service.ts` - улучшена загрузка связей и обработка ошибок, убрано удаление
- `src/admin/admin.controller.ts` - исправлено получение ID админа, убрано действие delete
- `spm_front/src/features/admin/resources/reports.tsx` - убрана кнопка удаления

## Как отладить проблемы

### 1. Проверка логов сервера
Запустите сервер и следите за консолью:
```bash
npm run start:dev
```

При обработке жалоб вы увидите логи:
```
Resolving report 1 with action: delete
Report data: { type: 'point', hasPoint: true, hasComment: false }
Deleting point with id: abc-123
Report 1 resolved successfully
```

### 2. Проверка данных в базе
Убедитесь, что жалобы содержат связанные объекты:
```sql
-- Проверить жалобы с точками
SELECT r.id, r.type, r.status, p.id as point_id, p.name 
FROM reports r 
LEFT JOIN points p ON r.pointId = p.id 
WHERE r.type = 'point';

-- Проверить жалобы с комментариями  
SELECT r.id, r.type, r.status, c.id as comment_id, c.content
FROM reports r 
LEFT JOIN comments c ON r.commentId = c.id 
WHERE r.type = 'comment';
```

### 3. Тестирование API
Используйте тестовый скрипт:
```bash
node test-reports-api.js
```

Или тестируйте вручную:
```bash
# Получить список жалоб
curl -X GET http://localhost:3000/admin/reports \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Заблокировать пользователя по жалобе
curl -X POST http://localhost:3000/admin/reports/1/resolve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "block", "adminNotes": "Нарушение правил"}'

# Отклонить жалобу
curl -X POST http://localhost:3000/admin/reports/1/resolve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "dismiss", "adminNotes": "Жалоба необоснованна"}'
```

## Возможные ошибки и решения

### "Internal server error"
- **Причина**: Отсутствуют связанные объекты или неправильный ID админа
- **Решение**: Проверьте логи сервера, убедитесь что жалоба существует и содержит нужные связи

### "Point/Comment not found"
- **Причина**: Объект жалобы уже был удален или не существует
- **Решение**: Это нормально, система обрабатывает такие случаи. Можно заблокировать пользователя или отклонить жалобу

### "User not found for blocking"
- **Причина**: Пользователь был удален из системы
- **Решение**: Это нормально, система логирует такие случаи

### "Unauthorized"
- **Причина**: Неправильный или истекший JWT токен
- **Решение**: Обновите токен или войдите заново

## Мониторинг системы

### Полезные запросы для мониторинга:
```sql
-- Количество жалоб по статусам
SELECT status, COUNT(*) FROM reports GROUP BY status;

-- Жалобы ожидающие рассмотрения
SELECT COUNT(*) FROM reports WHERE status = 'pending';

-- Самые частые причины жалоб
SELECT reason, COUNT(*) FROM reports GROUP BY reason ORDER BY COUNT(*) DESC;

-- Заблокированные пользователи
SELECT COUNT(*) FROM users WHERE isBlocked = true;
```

### Логи для отслеживания:
- `Resolving report X with action: Y` - начало обработки (Y = block или dismiss)
- `Blocking user with id: Z` - блокировка пользователя
- `Report X resolved successfully` - успешное завершение

## Производительность

### Оптимизация запросов:
- Используются индексы по status, type, createdAt
- Загружаются только необходимые связи
- Пагинация для больших списков

### Рекомендации:
- Регулярно очищайте старые решенные жалобы
- Мониторьте количество ожидающих жалоб
- Настройте уведомления для админов при новых жалобах

Система теперь должна работать стабильно с подробным логированием всех операций!