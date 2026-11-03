# Сборка для Amvera (настройки — amvera.yml)
# 1) собираем игру (vite → папка dist)
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2) запускаем сервер: только нужные для работы пакеты + собранная игра
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=80 \
    ORDA_DB=/data/orda.db
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 80
CMD ["npm", "start"]
