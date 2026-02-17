# Руководство по миграциям

## Запуск миграций

### Применить все новые миграции
```bash
npm run migration:run
```

### Откатить последнюю миграцию
```bash
npm run migration:revert
```

### Показать статус миграций
```bash
npm run migration:show
```

## Создание новой миграции

### Автоматическая генерация (на основе изменений в entities)
```bash
npm run migration:generate -- src/migrations/MigrationName
```

### Создание пустой миграции
```bash
npm run migration:create -- src/migrations/MigrationName
```

## Текущие миграции

1. `1708000000000-AddAuthorIdToEntities.ts` - добавление authorId к сущностям
2. `1708100000000-CreateCommentsTable.ts` - создание таблицы комментариев

## Важно

- Всегда делайте бэкап базы данных перед применением миграций
- Проверяйте миграции в dev окружении перед применением в production
- Миграции выполняются в порядке их timestamp (первые цифры в имени файла)
