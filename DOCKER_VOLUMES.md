# Docker Volumes для сохранения данных

## Проблема
При пересборке Docker контейнера все файлы внутри контейнера удаляются, включая загруженные аватарки.

## Решение
Используем Docker volumes для постоянного хранения данных.

## Настроенные volumes

### 1. postgres_data
Хранит данные PostgreSQL базы данных.
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

### 2. uploads_data
Хранит загруженные файлы (аватарки).
```yaml
volumes:
  - uploads_data:/app/uploads
```

## Команды для управления

### Просмотр volumes
```bash
docker volume ls
```

### Информация о volume
```bash
docker volume inspect spm_backend_uploads_data
```

### Резервное копирование uploads
```bash
# Создать backup
docker run --rm -v spm_backend_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Восстановить из backup
docker run --rm -v spm_backend_uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

### Очистка (ОСТОРОЖНО!)
```bash
# Удалить все неиспользуемые volumes
docker volume prune

# Удалить конкретный volume
docker volume rm spm_backend_uploads_data
```

## Пересборка контейнера

Теперь при пересборке данные сохраняются:

```bash
# Остановить контейнеры
docker-compose down

# Пересобрать образ
docker-compose build

# Запустить заново
docker-compose up -d
```

Файлы в `/app/uploads` останутся на месте благодаря volume!

## Проверка

После пересборки проверьте, что файлы на месте:
```bash
docker exec spm_app ls -la /app/uploads/avatars
```
