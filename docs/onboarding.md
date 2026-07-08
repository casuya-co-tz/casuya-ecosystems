# Onboarding

Welcome to the Casuya ecosystem.

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- Docker + Docker Compose
- Git

## Quick start

```bash
git clone <workspace>
cd casuya-ecosystem
pnpm bootstrap      # installs deps and creates .env
pnpm dev            # starts infra and runs packages
```

Then open http://localhost:3000.

## Diagnosing issues

Run `pnpm doctor` to verify toolchain, services, and environment variables.

## Where to start

Begin with the foundation packages: `casuya-common`, `casuya-core`,
`casuya-runtime`, `casuya-bridge`, then `casuya-api` and `casuya-platform`.
