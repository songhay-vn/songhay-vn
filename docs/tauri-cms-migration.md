# Songhay CMS — Tauri 2.0 Desktop App Migration Plan

**Plan: Approach A — Standalone Desktop App + Dedicated REST API Backend**

---

## 1. Overview

Migrate the Songhay CMS from a Next.js-served `/admin` web route into a native desktop application built with Tauri 2.0 (WebView frontend + Rust shell) backed by a dedicated REST API layer added to the existing Next.js VPS deployment. The public website (`songhay.vn`) continues to run unchanged.

```
┌──────────────────────────────────┐          ┌───────────────────────────────────────┐
│      Tauri Desktop App            │          │         VPS: songhay.vn               │
│  (React 19 + Vite + Tailwind v4  │  HTTPS   │                                       │
│   + shadcn/ui + Tiptap editor)   │────JWT──►│  Next.js (public site, unchanged)     │
│                                   │          │  + /api/v1/cms/* (new REST layer)     │
│  Windows / macOS / Linux          │          │  + PostgreSQL (unchanged)             │
│  ~12 MB installer                 │          │  + Cloudinary (unchanged)             │
│  Auto-updates via GitHub Releases │          │                                       │
└──────────────────────────────────┘          └───────────────────────────────────────┘
```

---

## 2. Monorepo Structure

The project will adopt a monorepo layout to share types, permission logic, and utilities between the web (Next.js) and the desktop app:

```
songhay-vn/
├── app/                        # (existing) Next.js public website
├── components/                 # (existing) Shared React components
├── lib/                        # (existing) Shared logic
│   ├── permissions.ts          # ✅ Reuse as-is in desktop app
│   └── session.ts              # Replaced by JWT in desktop app
├── prisma/                     # (existing) Database schema
│
├── packages/
│   └── cms-desktop/            # 🆕 Tauri 2.0 desktop app
│       ├── src-tauri/          # Rust shell (Tauri core)
│       │   ├── Cargo.toml
│       │   ├── tauri.conf.json
│       │   └── src/
│       │       └── main.rs
│       ├── src/                # React frontend
│       │   ├── api/            # API client layer (replaces Server Actions)
│       │   ├── components/     # Admin components (copied + adapted)
│       │   ├── pages/          # App views / routes (React Router)
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
│
└── app/api/v1/                 # 🆕 REST API routes added to Next.js
    └── cms/
        ├── auth/
        ├── posts/
        ├── workflow/
        ├── media/
        ├── categories/
        ├── settings/
        └── ...
```

---

## 3. Phase 1: REST API Backend

This is the **critical foundation** — converting all `"use server"` Server Actions into proper HTTP endpoints.

### 3.1 Authentication API

Replace cookie-based sessions with JWT (JSON Web Token). The current `lib/session.ts` HMAC token logic can be reused with minor adaptation.

```
POST /api/v1/cms/auth/login
  Body: { email, password }
  Returns: { accessToken, refreshToken, user: { id, name, role } }

POST /api/v1/cms/auth/refresh
  Body: { refreshToken }
  Returns: { accessToken }

POST /api/v1/cms/auth/logout
  Header: Authorization: Bearer <token>
  Clears server-side refresh token allowlist
```

**JWT Strategy:**
- **Access token**: Short-lived (15 minutes), signed with `AUTH_SECRET`, contains `{ userId, role, exp }`.
- **Refresh token**: Long-lived (7 days), stored in PostgreSQL `RefreshToken` table keyed by `userId`.
- The desktop app stores tokens in Tauri's **secure OS credential store** via `@tauri-apps/plugin-store` (encrypted on disk).

### 3.2 Authentication Middleware (Server-side)

Create a shared middleware helper that replaces `requireCmsUser()` / `requireEditorInChiefUser()`:

```typescript
// app/api/v1/cms/_middleware.ts
export async function requireApiAuth(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.replace("Bearer ", "")
  const session = decodeJwt(token)
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 })
  hydratePermissionsFromDb(await loadRolePermissions())
  return session
}
```

This reuses the existing `lib/permissions.ts` (including `EDITOR_IN_CHIEF` top-priority logic) without any changes.

### 3.3 Posts API

Map all current Server Actions in `app/admin/actions/posts.ts` to REST endpoints:

| Server Action | REST Endpoint | Method |
|---|---|---|
| `createPost` | `/api/v1/cms/posts` | `POST` |
| `updatePost` | `/api/v1/cms/posts/:id` | `PATCH` |
| `movePostToTrash` | `/api/v1/cms/posts/:id/trash` | `POST` |
| `restorePostFromTrash` | `/api/v1/cms/posts/:id/restore` | `POST` |
| `deletePostPermanently` | `/api/v1/cms/posts/:id` | `DELETE` |
| `bulkTrashPosts` | `/api/v1/cms/posts/bulk-trash` | `POST` |
| `bulkUpdateStatus` | `/api/v1/cms/posts/bulk-status` | `POST` |
| `updatePostFlags` | `/api/v1/cms/posts/:id/flags` | `PATCH` |
| `assignFeaturedSlot` | `/api/v1/cms/posts/:id/featured` | `PUT` |
| `clearFeaturedSlot` | `/api/v1/cms/posts/featured/:slot` | `DELETE` |
| `restorePostVersion` | `/api/v1/cms/posts/:id/versions/:logId` | `POST` |
| `autosaveDraftAction` | `/api/v1/cms/posts/:id/autosave` | `PATCH` |

### 3.4 Workflow API

Map from `app/admin/actions/workflow.ts`:

| Server Action | REST Endpoint | Method |
|---|---|---|
| `submitPostToPendingReview` | `/api/v1/cms/posts/:id/submit-review` | `POST` |
| `approvePendingPost` | `/api/v1/cms/posts/:id/approve` | `POST` |
| `rejectPendingPost` | `/api/v1/cms/posts/:id/reject` | `POST` |
| `promotePostToPendingPublish` | `/api/v1/cms/posts/:id/promote` | `POST` |
| `returnPostToPendingReview` | `/api/v1/cms/posts/:id/return-review` | `POST` |
| `returnPostToPendingPublish` | `/api/v1/cms/posts/:id/return-publish` | `POST` |
| `returnPostToDraft` | `/api/v1/cms/posts/:id/return-draft` | `POST` |

### 3.5 Media API

| Action | Endpoint | Method |
|---|---|---|
| Upload image | `/api/v1/cms/media/upload` | `POST` (multipart form) |
| List media | `/api/v1/cms/media` | `GET` |
| Delete media | `/api/v1/cms/media/:id` | `DELETE` |
| Crop/transform | `/api/v1/cms/media/:id/crop` | `POST` |

Cloudinary upload keys **must not** be exposed in the desktop app bundle. The desktop app calls `/api/v1/cms/media/upload` which proxies through the VPS to Cloudinary using server-side credentials.

### 3.6 Settings & Admin APIs

| Action | Endpoint | Method |
|---|---|---|
| Get users | `/api/v1/cms/settings/users` | `GET` |
| Create user | `/api/v1/cms/settings/users` | `POST` |
| Update user role | `/api/v1/cms/settings/users/:id/role` | `PATCH` |
| Delete user | `/api/v1/cms/settings/users/:id` | `DELETE` |
| Reset password | `/api/v1/cms/settings/users/:id/password` | `POST` |
| Get permissions | `/api/v1/cms/settings/permissions` | `GET` |
| Update permissions | `/api/v1/cms/settings/permissions/:role` | `PUT` |
| Get categories | `/api/v1/cms/categories` | `GET` |
| Create category | `/api/v1/cms/categories` | `POST` |
| Update category | `/api/v1/cms/categories/:id` | `PATCH` |
| Delete category | `/api/v1/cms/categories/:id` | `DELETE` |
| Get redirects | `/api/v1/cms/redirects` | `GET` |
| Create redirect | `/api/v1/cms/redirects` | `POST` |
| Delete redirect | `/api/v1/cms/redirects/:id` | `DELETE` |
| Get pen names | `/api/v1/cms/pen-names` | `GET` |
| Create pen name | `/api/v1/cms/pen-names` | `POST` |
| Update pen name | `/api/v1/cms/pen-names/:id` | `PATCH` |
| Delete pen name | `/api/v1/cms/pen-names/:id` | `DELETE` |
| Get comments | `/api/v1/cms/comments` | `GET` |
| Moderate comment | `/api/v1/cms/comments/:id` | `PATCH` |

### 3.7 API Response Format

Consistent across all endpoints:

```typescript
// Success
{ success: true, data: T, meta?: { page, perPage, total } }

// Error
{ success: false, error: string, code?: string }
```

---

## 4. Phase 2: Tauri App Setup

### 4.1 Prerequisites

- [Rust toolchain](https://rustup.rs/) 1.77+
- Tauri CLI v2: `cargo install tauri-cli`
- Bun (already used in this project)

### 4.2 Initialization

```bash
cd packages/cms-desktop
bun create vite@latest . -- --template react-ts
bun add -D @tauri-apps/cli@2
bun tauri init
```

`tauri.conf.json` key settings:
```json
{
  "productName": "Songhay CMS",
  "identifier": "vn.songhay.cms",
  "version": "1.0.0",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173"
  },
  "bundle": {
    "active": true,
    "icon": ["icons/icon.png"],
    "targets": "all"
  },
  "plugins": {
    "updater": {
      "pubkey": "<YOUR_UPDATER_PUBLIC_KEY>",
      "endpoints": [
        "https://github.com/yourepo/songhay-vn/releases/latest/download/latest.json"
      ]
    }
  }
}
```

### 4.3 Tech Stack Inside the App

| Concern | Technology |
|---|---|
| UI Framework | React 19 |
| Bundler | Vite |
| Styling | Tailwind CSS v4 (same config as website) |
| UI Components | shadcn/ui (same component library) |
| Rich Text Editor | Tiptap (same as current CMS) |
| Routing | React Router v7 |
| State Management | Zustand (auth/session store, draft store) |
| HTTP Client | `ky` (lightweight fetch wrapper) with auto JWT refresh |
| Secure Storage | `@tauri-apps/plugin-store` (encrypted credential store) |
| Auto-Updates | `@tauri-apps/plugin-updater` |
| File System | `@tauri-apps/plugin-fs` (for local draft temp files) |
| Notifications | `@tauri-apps/plugin-notification` |

### 4.4 API Client Layer

Create a typed API client that replaces Server Actions:

```typescript
// packages/cms-desktop/src/api/client.ts
import ky from "ky"
import { useAuthStore } from "@/stores/auth"

const API_BASE = import.meta.env.VITE_API_BASE_URL // e.g. https://songhay.vn

export const api = ky.create({
  prefixUrl: `${API_BASE}/api/v1/cms`,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken
        if (token) request.headers.set("Authorization", `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status === 401) {
          const refreshed = await useAuthStore.getState().refresh()
          if (refreshed) return ky(request) // retry once
        }
      },
    ],
  },
})

// Typed helpers
export const postsApi = {
  list: (params?: PostsListParams) => api.get("posts", { searchParams: params }).json<PostsListResponse>(),
  create: (body: CreatePostBody) => api.post("posts", { json: body }).json<Post>(),
  update: (id: string, body: Partial<Post>) => api.patch(`posts/${id}`, { json: body }).json<Post>(),
  trash: (id: string) => api.post(`posts/${id}/trash`).json(),
  // ...etc
}
```

### 4.5 Auth Store

```typescript
// packages/cms-desktop/src/stores/auth.ts
import { create } from "zustand"
import { Store } from "@tauri-apps/plugin-store"

const secureStore = new Store(".credentials.dat")

interface AuthState {
  user: SessionUser | null
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  refresh: () => Promise<boolean>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  login: async (email, password) => {
    const { data } = await ky.post(`${API_BASE}/api/v1/cms/auth/login`, {
      json: { email, password },
    }).json<LoginResponse>()
    await secureStore.set("refreshToken", data.refreshToken)
    await secureStore.save()
    set({ user: data.user, accessToken: data.accessToken })
  },
  refresh: async () => {
    const refreshToken = await secureStore.get("refreshToken")
    if (!refreshToken) return false
    try {
      const { data } = await ky.post(`${API_BASE}/api/v1/cms/auth/refresh`, {
        json: { refreshToken },
      }).json<RefreshResponse>()
      set({ accessToken: data.accessToken })
      return true
    } catch {
      return false
    }
  },
  logout: async () => {
    await secureStore.delete("refreshToken")
    await secureStore.save()
    set({ user: null, accessToken: null })
  },
}))
```

### 4.6 Offline Draft Persistence

When a reporter is writing and loses connection, drafts are saved locally:

```typescript
// packages/cms-desktop/src/stores/draft.ts
import { BaseDirectory, writeTextFile, readTextFile } from "@tauri-apps/plugin-fs"

export async function saveDraftLocally(postId: string, content: string) {
  await writeTextFile(`drafts/${postId}.json`, content, {
    baseDir: BaseDirectory.AppData,
  })
}

export async function loadLocalDraft(postId: string): Promise<string | null> {
  try {
    return await readTextFile(`drafts/${postId}.json`, {
      baseDir: BaseDirectory.AppData,
    })
  } catch {
    return null
  }
}
```

The editor component checks for a local draft on mount and offers to restore it before pulling from the server.

### 4.7 Component Migration

Existing admin components from `components/admin/` can be **copied into** `packages/cms-desktop/src/components/` with minimal changes:

| Change Required | Reason |
|---|---|
| Replace `action={serverAction}` form props with `onSubmit={handleSubmit}` calling `api.*()` | Server Actions don't exist in the desktop app |
| Replace `redirect("/admin?toast=...")` with `navigate()` + toast notification | No Next.js router |
| Replace `revalidatePath()` with local state invalidation (React Query) | No Next.js cache |
| Keep all `lib/permissions.ts` logic | Works identically in Vite/Bun context |
| Replace `import { cookies } from "next/headers"` | Not needed; auth is JWT from store |

Use **React Query** (`@tanstack/react-query`) for server state management to handle caching, refetching, optimistic updates, and loading states:

```typescript
// Example: posts list with React Query
const { data: posts, isLoading } = useQuery({
  queryKey: ["posts", filters],
  queryFn: () => postsApi.list(filters),
})

const trashMutation = useMutation({
  mutationFn: (id: string) => postsApi.trash(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
})
```

---

## 5. Phase 3: Auto-Updates & CI/CD

### 5.1 GitHub Actions Workflow

Create `.github/workflows/desktop-release.yml`:

```yaml
name: Release Desktop App

on:
  push:
    tags:
      - "cms-v*"   # e.g., cms-v1.2.0

jobs:
  release:
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: x86_64-pc-windows-msvc
          - os: macos-latest
            target: aarch64-apple-darwin   # M-series
          - os: macos-latest
            target: x86_64-apple-darwin    # Intel

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install frontend deps
        run: bun install
        working-directory: packages/cms-desktop

      - name: Build and release
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
          VITE_API_BASE_URL: https://songhay.vn
        with:
          projectPath: packages/cms-desktop
          tagName: ${{ github.ref_name }}
          releaseName: "Songhay CMS ${{ github.ref_name }}"
          releaseBody: "See CHANGELOG for details."
          includeUpdaterJson: true   # generates latest.json for auto-updater
```

### 5.2 Updater Flow in the App

```typescript
// packages/cms-desktop/src/App.tsx
import { check } from "@tauri-apps/plugin-updater"
import { relaunch } from "@tauri-apps/plugin-process"

async function checkForUpdates() {
  const update = await check()
  if (update?.available) {
    const confirmed = await confirm(
      `Version ${update.version} is available. Update now?`
    )
    if (confirmed) {
      await update.downloadAndInstall()
      await relaunch()
    }
  }
}

// Check on app launch and every 4 hours
useEffect(() => {
  checkForUpdates()
  const interval = setInterval(checkForUpdates, 4 * 60 * 60 * 1000)
  return () => clearInterval(interval)
}, [])
```

### 5.3 Code Signing

| Platform | Method |
|---|---|
| **Windows** | Tauri uses NSIS/WiX with a self-signed certificate (or EV cert for trusted installs without SmartScreen) |
| **macOS** | Requires Apple Developer account for notarization. Add `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_PASSWORD` secrets |
| **Linux** | `.deb` and `.AppImage` — no signing required |

---

## 6. Phase 4: Database Schema Changes

### 6.1 Add RefreshToken Table

```prisma
// prisma/schema.prisma — additions
model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

```bash
bun run db:migrate   # apply migration on VPS
```

---

## 7. Phase 5: Deprecate Web Admin Route

Once the desktop app is stable and all editors have migrated:

1. **Block `/admin` at Caddy level** (respond with 404 or 302 to a "download the app" landing page).
2. **Remove `app/admin/` directory** from the Next.js source (reduces build time and bundle size).
3. **Remove `app/api/v1/cms/auth/` refresh token DB rows** that are older than 7 days (add a cron or TTL index).
4. Keep `app/api/v1/cms/*` routes forever — the desktop app depends on them.

---

## 8. Security Considerations

| Risk | Mitigation |
|---|---|
| JWT stolen from disk | Stored in OS credential store (encrypted), access tokens are short-lived (15 min) |
| API endpoint exposed publicly | Rate limit `/api/v1/cms/*` at Caddy; all endpoints require valid JWT |
| Cloudinary keys in app bundle | Media uploads proxy through VPS — keys never leave the server |
| XSS via rich text (Tiptap) | Tiptap's built-in sanitization; DOMPurify on render |
| Man-in-the-middle | HTTPS enforced by Caddy; app hardcodes `https://songhay.vn` |
| Compromised desktop binary | Tauri auto-updater requires valid signature; `tauri.conf.json` pins the public key |

---

## 9. Migration Rollout Strategy

| Step | Action | Risk Level |
|---|---|---|
| **1** | Build REST API layer on VPS (additive, no deletions) | 🟢 None |
| **2** | Build Tauri app, connect to API layer | 🟢 None — website unaffected |
| **3** | Internal beta: EDITOR_IN_CHIEF tests desktop app alongside `/admin` | 🟡 Low |
| **4** | Deploy to all editors; keep `/admin` read-only as fallback | 🟡 Low |
| **5** | Monitor for 2–4 weeks; fix reported issues | 🟡 Low |
| **6** | Remove `/admin` web route; block at Caddy | 🔴 Irreversible — do final backup first |

---

## 10. Effort Estimate

| Phase | Estimated Effort |
|---|---|
| Phase 1: REST API layer | 3–4 weeks |
| Phase 2: Tauri app + component migration | 4–6 weeks |
| Phase 3: CI/CD + auto-updates + signing | 1 week |
| Phase 4: Schema migration | 1 day |
| Phase 5: Testing + rollout | 2–3 weeks |
| **Total** | **~10–14 weeks** |

---

## 11. Open Questions Before Starting

1. **Is macOS support required?** macOS code signing requires an Apple Developer Program subscription ($99/year). If editors only use Windows, skip macOS initially.
2. **Offline mode scope**: Should reporters be able to create *new* posts offline, or only continue editing already-fetched drafts?
3. **Versioning strategy**: Should the desktop app version be independent from the website's deploy version? Recommend yes — use `cms-v*` tags separately.
4. **API rate limiting**: Caddy or a middleware layer should rate-limit `/api/v1/cms/*` to prevent abuse if the endpoint is ever discovered publicly.

