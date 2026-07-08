# Casuya Ecosystem

Monorepo workspace coordinating the **Casuya** interactive-learning ecosystem. It unifies backend services, shared libraries, frontend platform, design system, and infrastructure under a single pnpm workspace.

## Stack

- **Package manager:** [pnpm](https://pnpm.io) (`pnpm@9.15.9`)
- **Language:** TypeScript (Node.js >= 20) with Python services where applicable
- **Runtime infra:** Docker Compose (PostgreSQL, Redis, API, frontend, worker)
- **Release management:** Changesets
- **Shared tooling:** EditorConfig, Prettier, ESLint (root-config based)

## Workspace conventions

Every `casuya-*` package is expected to provide:

- `README.md` — package purpose and usage
- `LICENSE` — MIT
- `.gitignore` — standard Node/Python ignores
- `package.json` (or `pyproject.toml` for Python services) with `build`, `test`, and where applicable `lint` / `typecheck` scripts

### Shared configuration

| File | Purpose |
| --- | --- |
| `.editorconfig` | Universal editor/IDE formatting (LF, 2-space, UTF-8) |
| `.prettierrc.json` | Canonical Prettier style (single quotes, 100 print width) |
| `.eslintrc.base.json` | Shareable ESLint base — extend via `"extends": "../../.eslintrc.base.json"` |
| `tsconfig.base.json` | Shared TypeScript compiler options — extend via `"extends": "../tsconfig.base.json"` |
| `.github/workflows/ci.yml` | CI: install, build, typecheck, lint, test, and a file-consistency gate |

New packages should extend the shared bases rather than redefining rules, so the
ecosystem stays consistent as it grows.

## Repository layout

```
casuya-ecosystem/
├── package.json          # Root workspace scripts and metadata
├── pnpm-workspace.yaml   # Workspace package globs and shared catalog
├── docker-compose.yml    # Shared local infrastructure
├── .env.example          # Template environment variables
├── README.md             # This file
└── casuya-*/             # Packages (services, libraries, apps)
```

## Getting started

```bash
# 1. Bootstrap (install node + python deps, create .env, run doctor)
pnpm bootstrap

# 2. Start local services (Docker-free):
#    - postgres + redis via Docker
#    - platform frontend (:5173) + backend (:8000) as local processes
#    - orchestrator dashboard (:4010)
pnpm start

# 3. Open the dev dashboard
#    http://localhost:4010  (service health)
#    http://localhost:5173  (platform UI)
#    http://localhost:8000  (platform API, /health)

# 4. Stop everything
pnpm stop
```

> The API gateway (`casuya-api`) runs on `:8080` with a `/health` endpoint and
> registers its `contracts/contract.json`. Full containerized deployment (every
> service as a Docker image) lives in `casuya-deployment/docker-compose.yml`.

## Common scripts

| Command | Description |
| --- | --- |
| `pnpm install` | Install workspace dependencies |
| `pnpm build` | Build every package |
| `pnpm dev` | Run all packages in parallel watch mode |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all test suites |
| `pnpm bootstrap` | Install deps, create `.env`, run `doctor` |
| `pnpm dev` / `pnpm start` | Start infra + run all packages |
| `pnpm stop` | Stop local infrastructure |
| `pnpm build` / `pnpm clean` | Build / clean all packages |
| `pnpm migrate` / `pnpm seed` | Run migrations / seed data |
| `pnpm verify` | Structure + build + test gate |
| `pnpm doctor` | Diagnose toolchain, services, env, disk |
| `pnpm validate:arch` | Enforce workspace deps, cycles, layout |
| `pnpm dashboard` | Open local dev dashboard on `:4010` |
| `pnpm create-service <name>` | Scaffold a new `casuya-*` repo |
| `pnpm infra:up` | Start shared Docker infrastructure |
| `pnpm infra:down` | Stop shared Docker infrastructure |
| `pnpm changeset` | Add a changeset for release tracking |
| `pnpm release` | Build and publish packages via Changesets |

Scripts are cross-platform: `node scripts/run.js` dispatches to `.ps1` (Windows)
or `.sh` (Linux/macOS). A pre-commit hook (`.githooks/pre-commit`, installed via
the `prepare` script) runs formatting, `pnpm verify`, and `pnpm validate:arch`.

## Infrastructure

The root `docker-compose.yml` provisions the shared services used across packages:

- **postgres** – primary database (port `5432`)
- **redis** – cache / queue broker (port `6379`)
- **api** – gateway service (port `8080`)
- **frontend** – platform UI (port `3000`)
- **worker** – background job processor

Per-environment orchestration (monitoring, logging, ingress, scaling) lives in [`casuya-deployment`](./casuya-deployment).

## License

MIT
