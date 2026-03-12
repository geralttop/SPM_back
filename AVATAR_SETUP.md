# Настройка загрузки аватарок

## Создание папки для загрузок

Перед запуском приложения необходимо создать папку для хранения аватарок:

```bash
mkdir -p uploads/avatars
```

## Права доступа

Убедитесь, что у приложения есть права на запись в папку uploads:

```bash
chmod 755 uploads
chmod 755 uploads/avatars
```

## Миграция базы данных

Для добавления поля avatar в таблицу users выполните миграцию:

```bash
npm run migration:run
```

## API Endpoints

### Загрузка аватарки
```
POST /auth/upload-avatar
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- avatar: файл изображения (макс. 5MB)
```

### Удаление аватарки
```
DELETE /auth/delete-avatar
Authorization: Bearer <token>
```

### Получение аватарки
```
GET /uploads/avatars/<filename>
```

## Ограничения

- Максимальный размер файла: 5MB
- Поддерживаемые форматы: JPG, JPEG, PNG, GIF, WEBP
- Старая аватарка автоматически удаляется при загрузке новой
