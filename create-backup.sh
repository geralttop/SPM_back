#!/bin/bash


GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SPM Database Backup Tool             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

CONTAINER_NAME="spm_db"
DB_USER="admin"
DB_NAME="geo_map_app"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
LATEST_LINK="${BACKUP_DIR}/latest.sql"

echo -e "${YELLOW}📁 Создание папки для backup...${NC}"
mkdir -p "$BACKUP_DIR"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен или не найден в PATH${NC}"
    echo "Установите Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${YELLOW}🔍 Проверка контейнера базы данных...${NC}"
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${YELLOW}⚠️  Контейнер $CONTAINER_NAME не запущен${NC}"
    echo -e "${YELLOW}🚀 Запуск контейнера...${NC}"
    
    if docker-compose up -d db; then
        echo -e "${GREEN}✅ Контейнер запущен${NC}"
        echo -e "${YELLOW}⏳ Ожидание готовности БД (5 секунд)...${NC}"
        sleep 5
    else
        echo -e "${RED}❌ Не удалось запустить контейнер${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Контейнер запущен${NC}"
fi

echo -e "${YELLOW}💾 Создание backup...${NC}"
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
    if [ -s "$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        LINES=$(wc -l < "$BACKUP_FILE")
        
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║   ✅ Backup создан успешно!            ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${BLUE}📁 Файл:${NC}    $BACKUP_FILE"
        echo -e "${BLUE}📊 Размер:${NC}  $SIZE"
        echo -e "${BLUE}📝 Строк:${NC}   $LINES"
        echo -e "${BLUE}🕐 Время:${NC}   $(date '+%Y-%m-%d %H:%M:%S')"
        
        ln -sf "$(basename $BACKUP_FILE)" "$LATEST_LINK"
        echo -e "${BLUE}🔗 Ссылка:${NC}  $LATEST_LINK -> $(basename $BACKUP_FILE)"
        
        echo ""
        echo -e "${GREEN}✨ Готово! Теперь можно применять миграцию:${NC}"
        echo -e "${YELLOW}   npm run migration:run${NC}"
        echo ""
        echo -e "${BLUE}💡 Для восстановления используйте:${NC}"
        echo -e "${YELLOW}   docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE${NC}"
        echo ""
        
        exit 0
    else
        echo -e "${RED}❌ Backup файл пустой!${NC}"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    echo -e "${RED}❌ Ошибка при создании backup!${NC}"
    echo "Проверьте:"
    echo "  1. Запущен ли контейнер: docker ps | grep $CONTAINER_NAME"
    echo "  2. Доступна ли БД: docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c 'SELECT 1;'"
    exit 1
fi
