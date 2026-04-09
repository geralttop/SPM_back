FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .
RUN npm run build

RUN mkdir -p /app/uploads/avatars && chmod -R 755 /app/uploads

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
