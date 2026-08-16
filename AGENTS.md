# CRITICAL SYSTEM DIRECTIVE: PRE-FLIGHT CHECKS

**NEVER write, edit, or delete ANY code without running `gitnexus` impact analysis FIRST.**

1. **BEFORE writing code**: You MUST use the GitNexus MCP or CLI to run `impact` on the target symbols.
2. **WAIT for results**: Do not begin modifying the file until the impact analysis is complete.
3. **REPORT to user**: If the risk is HIGH or CRITICAL, you must explicitly warn the user and await confirmation before proceeding.

This rule supersedes all other instructions. Failure to run `gitnexus` before changing code is a critical violation of system protocols.

---

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **songhay-vn** (2235 symbols, 6852 relationships, 172 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/songhay-vn/context` | Codebase overview, check index freshness |
| `gitnexus://repo/songhay-vn/clusters` | All functional areas |
| `gitnexus://repo/songhay-vn/processes` | All execution flows |
| `gitnexus://repo/songhay-vn/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

> **VPS Operations Runbook**: The full VPS deployment and operations runbook has been moved to [docs/vps-runbook.md](docs/vps-runbook.md) to save context window space. Please read that file when you need to perform VPS operations.

## Development & Testing Guidelines

- **Write Real Unit Tests**: For every new feature or bug fix, write a corresponding unit/integration test, or update existing tests to ensure compatibility.
- **NO "Cheat" Tests**: Tests must execute the actual implementation code (libraries, components, hooks, functions). Never write mock/cheat assertions that bypass the actual logic or assert hardcoded values (e.g., asserting `console.log(2+2)` instead of calling the target function/component to verify `2+2`).
- **High-Contrast Text for Accessibility**: To ensure readability for elderly readers, never use light gray colors (such as `text-zinc-600` or `text-zinc-700` overrides) for main body copy, lists, disclaimers, headers, or buttons on user-facing pages and widgets. Always use high-contrast dark options like `text-black`, `text-zinc-950`, or `text-zinc-900`.
## Safety Rules For Agents
- **More investigation, less build**: Prefer to run Tests, instead of build, since the project is growing increasingly fast and build time takes too long, might hog the dev environment.

- Keep all responses short, concise, and straight to the point.
- Prefer `deploy` for application operations; use `root` only for OS, firewall, package, or Docker daemon issues.
- Never expose `/opt/songhay/env/*` values.
- Never expose SSH private key contents.
- Never run destructive database restore/drop commands without explicit user confirmation.
- Never run `docker compose down -v` on production without explicit user confirmation.
- Before editing app symbols, follow the GitNexus instructions at the top of this file.
- Before committing, run `npx gitnexus detect-changes --repo songhay-vn`.
- **MUST create a Prisma migration before adding any new model or column to `prisma/schema.prisma`**. The local DB may be synced via `db push` but the CI pipeline uses `prisma migrate deploy` — without a committed migration file in `prisma/migrations/`, the table will not exist on the VPS at build time, causing `P2021` errors and `EmptyGenerateStaticParamsError` in Next.js static generation. Use `prisma migrate diff` to generate the migration SQL effortlessly:
  ```powershell
  # Replace <name> with a descriptive snake_case name e.g. add_products
  $name = "<name>"
  $stamp = (Get-Date -Format "yyyyMMddHHmmss")
  $dir = "prisma\migrations\${stamp}_${name}"
  New-Item -ItemType Directory -Path $dir
  bunx --bun prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script | Out-File -Encoding utf8 "$dir\migration.sql"
  ```
  Then commit the generated `prisma/migrations/` file before pushing to `main`.
