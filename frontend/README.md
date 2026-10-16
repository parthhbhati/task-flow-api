# TaskFlow frontend

## Setup

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and configure `VITE_API_BASE_URL`. For the default local API configuration:

```env
VITE_API_BASE_URL=http://localhost:7000/api/v1
```

The API's `CORS_ORIGIN` must allow the frontend origin, which defaults to `http://localhost:5173`.

## Run

```bash
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```
