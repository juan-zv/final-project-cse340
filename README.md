# final-project-cse340

## Tech Stack

- Runtime: Node.js
- Backend framework: Express.js
- Templating engine: EJS
- Module system: ECMAScript Modules (ESM)
- Database: PostgreSQL
- Database client: pg
- Session store: express-session + connect-pg-simple
- Validation: express-validator
- Password hashing: bcrypt
- Development tooling: nodemon, pnpm

## Local Development

1. Create a .env file with:
	- DB_URL (or DATABASE_URL)
	- SESSION_SECRET
	- NODE_ENV=development
2. Install dependencies:
	- pnpm install
3. Start app:
	- pnpm dev

## What The App Uses

- MVC-style structure in src/controllers, src/models, and src/views
- Role-aware authentication and dashboards (User, Employee, Admin)
- EJS-rendered pages for home, auth forms, inventory, reviews, service requests, and admin/employee views
- PostgreSQL-backed persistence for accounts, inventory, reviews, service requests, contact messages, and sessions
- Server-side validation for form input and session-based flash messaging

## Notes

- Source code uses ESM imports/exports only (no CommonJS in app code).
- Database connection accepts either DB_URL or DATABASE_URL.