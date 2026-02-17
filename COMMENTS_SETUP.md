# Настройка комментариев

## Описание
Добавлена функциональность комментариев к точкам (points).

## Что было добавлено

### Backend

1. **Сущность Comment** (`src/points/entities/comment.entity.ts`)
   - Таблица `comments` с полями: id, content, createdAt, updatedAt, authorId, pointId
   - Связи с User и PointEntity

2. **DTO для комментариев**
   - `CreateCommentDto` - создание комментария
   - `UpdateCommentDto` - обновление комментария

3. **Сервис CommentsService** (`src/points/comments.service.ts`)
   - `create()` - создание комментария
   - `findByPoint()` - получение всех комментариев точки
   - `update()` - обновление комментария (только автор)
   - `remove()` - удаление комментария (только автор)

4. **Контроллер CommentsController** (`src/points/comments.controller.ts`)
   - `POST /points/:pointId/comments` - создать комментарий
   - `GET /points/:pointId/comments` - получить комментарии точки
   - `PATCH /points/:pointId/comments/:id` - обновить комментарий
   - `DELETE /points/:pointId/comments/:id` - удалить комментарий

5. **Миграция** (`src/migrations/1708100000000-CreateCommentsTable.ts`)

### Frontend

1. **API клиент** (`src/shared/api/comments.ts`)
   - Методы для работы с комментариями

2. **Компонент Comments** (`src/widgets/Comments/`)
   - Отображение списка комментариев
   - Форма добавления комментария
   - Редактирование и удаление своих комментариев
   - Поддержка i18n (ru, be, en)

3. **Интеграция в PointCard**
   - Кнопка "Показать/Скрыть комментарии"
   - Раскрывающаяся секция с комментариями

4. **Переводы**
   - Добавлены переводы для всех языков в секцию `comments`

## Установка

### 1. Запустить миграцию

```bash
cd SPM_backend
npm run migration:run
```

### 2. Перезапустить backend

```bash
npm run start:dev
```

### 3. Перезапустить frontend

```bash
cd ../spm_front
npm run dev
```

## Использование

1. Откройте любую страницу с точками (Feed, Profile, User profile)
2. Под каждой точкой появится кнопка "Показать комментарии"
3. Нажмите на кнопку, чтобы увидеть комментарии и форму добавления
4. Напишите комментарий и нажмите "Отправить"
5. Свои комментарии можно редактировать и удалять

## API Endpoints

### Получить комментарии точки
```
GET /points/:pointId/comments
Authorization: Bearer <token>
```

### Создать комментарий
```
POST /points/:pointId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Текст комментария"
}
```

### Обновить комментарий
```
PATCH /points/:pointId/comments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Обновленный текст"
}
```

### Удалить комментарий
```
DELETE /points/:pointId/comments/:id
Authorization: Bearer <token>
```

## Безопасность

- Все endpoints требуют авторизации (JWT)
- Редактировать и удалять можно только свои комментарии
- Максимальная длина комментария: 1000 символов
- При удалении точки все её комментарии удаляются автоматически (CASCADE)
