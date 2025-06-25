# Nexus Order Management Backend

This directory contains the backend code for the Nexus Order Management system.

## Tech Stack
- Node.js + Express.js
- TypeScript
- PostgreSQL (via Prisma ORM)
- JWT for authentication
- bcrypt for password hashing
- Joi or Zod for validation
- dotenv for environment variables
- nodemailer for email (password reset)
- express-rate-limit for rate limiting
- helmet, cors for security

## Folder Structure
```
backend/
  src/
    controllers/
    middlewares/
    models/         (or prisma/ for Prisma)
    routes/
    services/
    utils/
    config/
    types/
    app.ts
    server.ts
  .env
  package.json
  tsconfig.json
  README.md
```

## Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your environment variables.
3. Run the development server:
   ```sh
   npm run dev
   ```
4. Run database migrations (if using Prisma):
   ```sh
   npx prisma migrate dev
   ```

## Scripts
- `npm run dev` — Start server in development mode
- `npm run build` — Build TypeScript
- `npm start` — Start server in production

## Docker & Deployment

1. Copy `.env.example` to `.env` and fill in your secrets.
2. Build and run with Docker Compose:
   ```sh
   docker-compose up --build
   ```
3. The backend will be available at http://localhost:4000
4. The database will be available at localhost:5432 (see docker-compose.yml for credentials)

## Environment Variables
See `.env.example` for all required environment variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- `FRONTEND_URL`

---

For detailed API documentation, see [API.md](API.md) (to be created). 