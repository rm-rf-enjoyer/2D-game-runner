# Wavepunk Runner

## Требования

- Node.js 24+
- Docker и Docker Compose (для PostgreSQL и интеграционных тестов backend)

## Клиент

```bash
npm ci
cp .env.example .env
npm start
```

Публичный `VITE_API_BASE_URL` задаёт адрес backend и попадает в клиентский бандл, поэтому секретов там нет.

## Backend

```bash
cd backend
npm ci
cp .env.example .env
docker compose up -d postgres
npm run db:migrate
npm run dev
```

Все серверные ключи и параметры подключения хранятся в `backend/.env`: `DATABASE_URL`, `PORT`, `LOG_LEVEL`, `CORS_ORIGIN`, `RATE_LIMIT_*`, `SYNC_BATCH_LIMIT`. Для полного локального запуска: `docker compose up --build`.

## Проверки

Клиент:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

Backend:

```bash
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run test:integration
```

Интеграционные тесты backend поднимают PostgreSQL через Testcontainers и требуют запущенного Docker.
