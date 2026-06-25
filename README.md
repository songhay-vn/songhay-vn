# Songhay.vn News Portal (Bun + Next.js + Prisma + PostgreSQL)

Production-ready Vietnamese news portal inspired by Kenh14 / Ngoisao / Tuvi with:

- Homepage structure: header, hero, most-read sidebar, BMI widget, category blocks, ads, footer
- CMS admin: create posts, assign categories, upload thumbnails, manage featured/trending, edit SEO fields
- SEO: metadata, OpenGraph, Schema.org NewsArticle, robots, sitemap
- Clean slugs: /song-hay/post-title, /meo-hay/post-title
- Performance: Next Image optimization + lazy loading + ISR-ready data pages

## Tech Stack

- Next.js App Router
- Bun package manager/runtime
- shadcn UI components
- Prisma ORM
- PostgreSQL

## Folder Structure

```text
app/
	admin/page.tsx                    # CMS dashboard
	api/comments/route.ts             # Comment submission endpoint
	[category]/page.tsx               # Category listing
	[category]/[slug]/page.tsx        # Article details
	layout.tsx                        # Global metadata + OG
	page.tsx                          # Homepage
	robots.ts                         # robots.txt
	sitemap.ts                        # sitemap.xml
components/
	news/
		bmi-widget.tsx
		comment-form.tsx
		most-read.tsx
		post-card.tsx
		section-heading.tsx
		site-footer.tsx
		site-header.tsx
		social-share.tsx
	ui/
		button.tsx
lib/
	bmi.ts
	categories.ts
	prisma.ts
	queries.ts
	slug.ts
prisma/
	schema.prisma
public/
	placeholder-news.svg
	uploads/
types/
	next-shim.d.ts
```

## Environment Variables

Create .env from .env.example:

```bash
cp .env.example .env
```

Required:

- DATABASE_URL: PostgreSQL connection string
- NEXT_PUBLIC_SITE_URL: Public site domain, ex https://songhay.vn

## Installation (Bun)

```bash
bun install
bunx prisma generate
bun run db:push
bun run dev
```

Open:

- Homepage: http://localhost:3000
- Admin CMS: http://localhost:3000/admin

## CMS Features

Admin page supports:

- Create/update categories
- Create post with category
- Upload thumbnail image (stored in public/uploads)
- Set featured/trending flags
- Edit SEO title + SEO description + OG image
- Optional video embed URL

Note: For production, use object storage (S3/R2/Blob) instead of local uploads.

## SEO Features Implemented

- Meta title + description
- OpenGraph per page and per article
- Schema.org NewsArticle JSON-LD in article page
- robots.txt via app/robots.ts
- Dynamic sitemap.xml via app/sitemap.ts

## URL Structure

- /song-hay/post-title
- /song-khoe/post-title
- /meo-hay/post-title
- /doi-song/post-title
- /goc-stress/post-title
- /tu-vi/post-title
- /video/post-title

## Performance Notes

- Uses next/image for optimized image delivery
- Lazy loading for non-critical images
- ISR-ready pages using revalidate in route modules

## Deployment Guide

### Vercel

1. Push code to Git repository.
2. Import project on Vercel.
3. Set Environment Variables:
	 - DATABASE_URL
	 - NEXT_PUBLIC_SITE_URL
4. Build Command:

```bash
bunx prisma generate && bun run build
```

5. Start Command:

```bash
bun run start
```

### VPS (Ubuntu + PM2 + Nginx)

1. Install Bun and Node-compatible build tools.
2. Clone repo and configure .env.
3. Run:

```bash
bun install
bunx prisma generate
bun run db:push
bun run build
```

4. Start with PM2:

```bash
pm2 start "bun run start" --name songhay-vn
pm2 save
```

5. Configure Nginx reverse proxy to localhost:3000 and enable HTTPS.

## Scripts

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run typecheck
bun run db:generate
bun run db:push
bun run db:migrate
```

## CMS RBAC Workflow Test Guide

See docs/cms-rbac-workflow-readme.md for role-action matrix, workflow edge cases, and test commands.
