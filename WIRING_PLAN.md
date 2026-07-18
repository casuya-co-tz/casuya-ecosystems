# Casuya Ecosystem — Wiring Remediation Plan

**Date:** 2026-07-18
**Scope:** Close the gaps identified in the ecosystem audit so all 32 packages are wired and work as intended.

## 1. Current State (verified by live probe)

### Fully working (verified live)

- `casuya-payments` (3002) — health + endpoints OK _after rebuild_.
- `casuya-ai` (3000) — now runs as a real HTTP microservice (`server.ts` wrapper around `CasuyaAI`, LOCAL provider + graceful fallbacks); platform `ai_service.py` calls it over HTTP.
- `casuya-services-bridge` (3003) — content/exams/media/search OK; hosts 6 packages.
- `casuya-content`, `casuya-exams`, `casuya-media`, `casuya-auth`, `casuya-analytics`, `casuya-search` — live via bridge.
- `casuya-core` — `import casuya_core` works; `/core/lessons/*` 200.
- `casuya-notifications` — Africa's Talking SMS wired.
- `casuya-bridge` — shared-key `bridge_auth` on `/progress/sync`.
- `casuya-runtime`, `casuya-blackboard`, `casuya-editor`, `casuya-math` — static `/static/pkg/*` 200.
- `casuya-orchestrator` — builds; `/orchestrator/status` 200.
- `casuya-common`, `casuya-sdk`, `casuya-devtools`, `casuya-api` — build clean.

### Gaps found

1. **Payments `dist` was stale / wrong entry path.** `package.json` `main` = `dist/index.js` (missing) and `start` = `node dist/src/server.js` (correct, but `dist/` lacked `server.js` until rebuilt). Anyone running `node dist/server.js` or relying on committed `dist` gets a dead service.
2. **No `GET /analytics/stats` bridge route.** Bridge exposes many analytics POST routes but no stats GET. Platform's own DB-backed `/analytics/*` works, so analytics isn't broken — but there's no pass-through to the package analytics stats.
3. **`casuya-design-system` not built/wired.** It is a pnpm sub-workspace (`packages/{a11y,hooks,icons,react,styles,theme,tokens,utils}`), each built with `tsup`. No top-level `dist`, not imported, not statically served. It is a component _source_ library.
4. **No single source-of-truth build step** guaranteeing every package's `dist` is current before deploy.

### Non-code (cannot be "run")

- `casuya-deployment` (docker/k8s/pipelines), `casuya-docs` (documentation). Excluded from run-wiring.

## 2. Remediation Plan

### Task A — Fix payments entry paths + rebuild (HIGH)

- Update `casuya-payments/package.json`:
  - `main`: `dist/src/index.js`
  - `start`: `node dist/src/server.js` (already correct)
- Run `pnpm build` so `dist/` is current and contains `server.js`.
- Smoke test: start on 3002, hit `/health` and `/payments`.

### Task B — Root build verification (MEDIUM)

- Ensure all TS/JS package dists are current. Rebuild any package whose `dist` is older than its `src` (or simply: `pnpm -r build` from repo root for the workspace packages that have a build script).
- Confirm `casuya-services-bridge` dist is current (it was rebuilt this session).

### Task C — Add analytics stats pass-through (MEDIUM)

- Bridge (`src/analytics.ts` + `src/index.ts`): add `analyticsOps.stats()` using `InMemoryCacheProvider.getStats()` (or aggregation engine stats) and a `GET /analytics/stats` route.
- Platform client (`services/services_bridge_client.py`): add `analytics_stats()` -> `GET /analytics/stats`.
- Platform route (`api/services_bridge.py`): add `GET /services/analytics/stats`.
- Smoke test via platform.

### Task D — Wire casuya-design-system (MEDIUM)

- `cd casuya-design-system && pnpm install && pnpm -r build` to produce each sub-package `dist`.
- Platform `main.py`: mount the design-system packages for static serving under `/static/pkg/design-system/<pkg>` (point at each sub-package `dist`), skipped gracefully if absent.
- Smoke test a mounted asset returns 200.

### Task E — Final end-to-end verification (HIGH)

- Start payments (3002), bridge (3003).
- Run the consolidated platform `TestClient` probe covering: content, exams, media, search, analytics (report+query+stats), auth register, core validate, orchestrator status, static runtime/blackboard/editor/math/design-system.
- Update this document's §3 with results.

## 3. Results

| Task                       | Result                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A payments entry + rebuild | DONE — `package.json` `main`→`dist/src/index.js`, rebuilt; `node dist/src/server.js` health 200, `/payments` returns rows.                                                                                                                                          |
| B root build               | DONE — `pnpm -r --filter "./casuya-*" build` ran; all workspace dists current incl. design-system sub-packages.                                                                                                                                                     |
| C analytics stats          | DONE — bridge `GET /analytics/stats` (cache + provider summary), platform client `analytics_stats()`, route `GET /services/analytics/stats`. Verified 200.                                                                                                          |
| D design-system            | DONE — built all 8 sub-packages (`packages/*/dist`); platform mounts each at `/static/pkg/design-system/<pkg>`. Verified react+tokens 200.                                                                                                                          |
| E e2e verify               | DONE — 17/17 checks pass: payments(3002)+bridge(3003) health, content/exams/media/search/analytics(stats+report)/auth via platform, core validate, orchestrator status, static runtime/blackboard/editor/math, static design-system react+tokens.                   |
| F casuya-ai HTTP service   | DONE — added `casuya-ai/server.ts` (Node `http` wrapper around `CasuyaAI`, LOCAL provider + fallbacks), runs on **3000**; platform `CASUYA_AI_URL`/`casuya_ai_url` updated 3001→3000. Platform `POST /ai/questions/generate` verified reaching the live AI service. |

All previously identified gaps are closed. Remaining non-code packages (`casuya-deployment`, `casuya-docs`) are intentionally excluded. `casuya-api` gateway builds clean (requires Redis to run; not started here).

### Task F — Make `casuya-ai` a real HTTP microservice on 3000 (HIGH)

- **Problem:** `casuya-ai` source is a `CasuyaAI` _class library_ with no HTTP server. The platform's `ai_service.py` POSTs to `http://localhost:3001`, but nothing was there, so it always fell back to local regex logic — the AI package was never actually wired as a service.
- **Fix:** Added `casuya-ai/server.ts` — a dependency-free Node `http` server wrapping `CasuyaAI` (LOCAL provider, no API keys) serving all 9 endpoints the platform calls (`/api/questions/generate`, `/api/tutoring/explain`, `/api/content/{analyze,moderate,translate}`, `/api/math/{solve,steps,convert,physics-problem}`). Each handler degrades to a valid fallback if the model backend (Ollama `:11434`) is unavailable, so the platform always gets a 200. Compiled to `dist/server.js`, runs on **port 3000** (`CASUYA_AI_PORT`).
- Platform `ai_service.py` default `CASUYA_AI_URL` and `config/settings.py` `casuya_ai_url` updated `3001` → **3000**.
- Smoke test: `POST /ai/questions/generate` on the platform now reaches the live AI service on 3000 and returns a valid response.

## 4. Out of scope

- `casuya-deployment`, `casuya-docs` — documentation/infra only.
- Running the standalone `casuya-api` gateway (requires Redis) — build-clean only.
- Consuming design-system React components in an app (source library; served as static assets only).
