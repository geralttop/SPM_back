# Dev-образ NestJS приложения (prod не используется)
FROM node:24-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходники и собираем
COPY . .
RUN npm run build

# Приложение слушает порт из переменной PORT (в docker-compose задаётся 3000)
EXPOSE 3000

# Dev: запуск скомпилированного приложения (Nest кладёт вывод в dist/src/)
CMD ["node", "dist/src/main.js"]
