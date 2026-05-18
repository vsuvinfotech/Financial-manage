# Store Financial Management Portal

Phase 1 production-ready SaaS starter for retail store financial tracking. This is not a POS system; it focuses on revenue, expenses, purchases, reports, daily closing, and profit/loss.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, Shadcn-style UI, React Hook Form, Zod, TanStack Query, Recharts
- Backend: Node.js, Express.js, TypeScript, Prisma ORM
- Database: PostgreSQL
- Auth: JWT access/refresh tokens, bcrypt password hashing, RBAC

## Structure

```txt
apps/
  api/     Express REST API, Prisma schema, modules
  web/     Next.js dashboard application
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure API environment:

```bash
cp apps/api/.env.example apps/api/.env
```

3. Start PostgreSQL and update `DATABASE_URL`.

4. Run Prisma:

```bash
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
```

5. Start both apps:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`; API runs on `http://localhost:4000`.

You can also start them separately:

```bash
npm run dev:web
npm run dev:api
```

## API Documentation

All API routes are prefixed by `/api/v1`.

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`
- `GET /users/roles`
- `GET /dashboard/summary`
- `GET /dashboard/charts/revenue-expense`
- `GET /dashboard/charts/payment-methods`
- CRUD: `/revenues`, `/expenses`, `/purchases`
- Reports: `/reports/daily`, `/reports/monthly`, `/reports/profit-loss`, `/reports/payment-summary`
- Daily closing: `/daily-closing`, `/daily-closing/:date`

## Roles And Permissions

The portal uses role-based access with three permission actions: `view`, `read`, and `write`.

- `SUPERADMIN`: full system access, role management, and user management.
- `ADMIN`: store administration, users below admin level, reports, daily closing, and entries.
- `MANAGER`: financial operations, reports, and daily closing.
- `EMPLOYEE`: day-to-day revenue, expense, and purchase entry.

Run migrations after pulling role changes:

```bash
npm run prisma:migrate -w apps/api
npm run prisma:generate -w apps/api
npm run prisma:seed -w apps/api
```

## Deployment Notes

- Deploy `apps/api` to a Node host with PostgreSQL access.
- Deploy `apps/web` to Vercel or any Next.js host.
- Set `NEXT_PUBLIC_API_URL` in the frontend.
- Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in the API.
- Run migrations during release with `prisma migrate deploy`.
