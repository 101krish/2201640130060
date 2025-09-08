# Affordmed Frontend Track

Monorepo with:
- `logging-middleware/`: Reusable logging client for sending events to the Affordmed Logging API.
- `frontend-test-submission/`: React + Vite URL shortener frontend.

## Repository Structure

├─ logging-middleware/ # Reusable logging package (TypeScript)
│ ├─ src/
│ │ └─ index.ts
│ ├─ package.json
│ └─ tsconfig.json
└─ frontend-test-submission/ # URL shortener React app
├─ src/
├─ public/
├─ index.html
├─ package.json
└─ vite.config.ts

## Prerequisites
- Node.js 18+ and npm 9+
- Git

## Frontend (URL Shortener)

### Install
```bash
cd frontend-test-submission
npm install
```

### Development (http://localhost:3000)
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview (serves the built app)
```bash
npx vite preview --port 5174 --host
```

### Notes
- Vite dev server is configured for port 3000 (see `frontend-test-submission/vite.config.ts`).
- If deploying on Vercel, set the Project’s Root Directory to `frontend-test-submission/`.

## Logging Middleware

A tiny client to send logs to the Affordmed logging API.

### Files
- `logging-middleware/src/index.ts` exports `createLogger(...)`.

### Usage
```ts
import { createLogger } from '@affordmed/logging-middleware';

const log = createLogger({
  apiUrl: 'https://logging.affordmed.com', // base URL (no trailing slash required)
  apiKey: 'YOUR_API_KEY',                  // optional
  app: 'frontend',                         // optional tag for source app
});

await log({
  level: 'info',
  message: 'App started',
  context: { userId: '123' },
});
```

This performs:
- POST `${apiUrl}/logs`
- Headers: `Content-Type: application/json`, optional `Authorization: Bearer <apiKey>`

### Build
```bash
cd logging-middleware
npm run build
```

## Scripts (quick reference)
- Frontend
  - `npm run dev`: start Vite dev server (port 3000)
  - `npm run build`: build for production
  - `npm run preview`: preview build (you can also use `npx vite preview`)
- Logging Middleware
  - `npm run build`: type-check and emit `dist/`

## Development Tips
- If port 3000 is busy, change `port` in `frontend-test-submission/vite.config.ts`.
- Tailwind: Ensure `content` in `tailwind.config.ts` includes `./index.html` and `./src/**/*.{ts,tsx}`.

## License
MIT
