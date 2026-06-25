# Project: Songhay.vn News Portal

## Project Overview
Songhay.vn is a production-ready Vietnamese news portal inspired by major news outlets like Kenh14 and Ngoisao. It features a comprehensive CMS for article management, a robust editorial workflow, and a strong focus on SEO optimization.

### Main Technologies
- **Framework:** Next.js 16 (App Router)
- **Runtime & Package Manager:** Bun
- **Database:** Prisma ORM with PostgreSQL
- **UI Components:** shadcn/ui, Tailwind CSS v4, Lucide React
- **Authentication:** Custom session-based auth with granular RBAC
- **Testing:** `bun:test`

## Core Architecture & Concepts

### 1. Editorial Workflow
The project implements a multi-stage editorial process for content:
`DRAFT` → `PENDING_REVIEW` → `PENDING_PUBLISH` → `PUBLISHED`
- **Roles:** CONTRIBUTOR, REPORTER_TRANSLATOR, TEAM_LEAD, MANAGING_EDITOR, EDITOR_IN_CHIEF, ADMIN.
- **Permissions:** Granular actions (e.g., `approve-pending-review`, `publish-pending-publish`) are managed in `lib/permissions.ts`.

### 2. SEO Governance
SEO is a first-class citizen. Every article supports:
- Automatic and manual SEO titles/descriptions.
- OpenGraph image generation and management.
- Schema.org `NewsArticle` JSON-LD.
- Canonical URL management.
- Dynamic `sitemap.xml` and `robots.txt`.

### 3. Media Management
Supports image and video assets with visibility controls (PRIVATE/SHARED) and specialized cropping features (`react-easy-crop`).

### 4. Code Intelligence & Automation
- **GitNexus:** Integrated for impact analysis and code navigation. See `CLAUDE.md` for tool usage.
- **GSD (Get Shit Done):** A custom framework for autonomous tasks and workflow management located in `.github/get-shit-done`.

## Building and Running

### Prerequisites
- Bun installed
- PostgreSQL database

### Key Commands
- `bun install`: Install dependencies.
- `bun run dev`: Start the development server (with Turbopack).
- `bun run build`: Build for production.
- `bun run start`: Start production server.
- `bun run lint`: Run ESLint.
- `bun run typecheck`: Run TypeScript compiler check.

### Database Management
- `bun run db:generate`: Generate Prisma client.
- `bun run db:push`: Sync schema to database (development).
- `bun run db:migrate`: Run Prisma migrations.

## Testing
The project uses `bun:test` for unit and integration testing.
- `bun test`: Run all tests in the `tests/` directory.
- Test files follow the `*.test.ts` naming convention.

## Development Conventions

### File Structure
- `app/`: Next.js App Router pages and API routes.
- `components/`: React components, with `ui/` containing shadcn primitives.
- `lib/`: Core logic, utilities, and server-only functions.
- `prisma/`: Database schema and migrations.
- `types/`: Shared TypeScript definitions.

### Coding Style
- **TypeScript:** Strict typing is preferred. Use `types/` for shared interfaces.
- **Components:** Favor composition and functional components. Use shadcn/ui for consistent styling.
- **Data Fetching:** Use Server Components and Prisma directly where possible.
- **Permissions:** Always verify user roles using `lib/auth.ts` or `lib/permissions.ts` before sensitive operations.

### SEO
- Use `lib/seo.ts` and `lib/post-seo.ts` for any SEO-related logic to maintain consistency.

## Environment Variables
Required variables (refer to `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string.
- `NEXT_PUBLIC_SITE_URL`: The public URL of the site.
