# Architecture

The Casuya ecosystem is a collection of focused packages coordinated as a single
pnpm workspace.

## Layers

1. **Foundation** — `casuya-common`, `casuya-core`, `casuya-runtime`, `casuya-bridge`
2. **Services** — `casuya-api`, `casuya-auth`, `casuya-orchestrator`, `casuya-platform`
3. **Domain** — `casuya-content`, `casuya-search`, `casuya-media`, `casuya-exams`, `casuya-payments`
4. **Experience** — `casuya-editor`, `casuya-design-system`, `casuya-sdk`, `casuya-ai`
5. **Cross-cutting** — `casuya-notifications`, `casuya-analytics`, `casuya-devtools`, `casuya-docs`, `casuya-deployment`

## Local topology

```
Developer
   │
   ├── casuya-platform (frontend :3000)
   │        │  HTTP/gRPC
   ▼
casuya-api (gateway :8080)
   ├── casuya-auth
   ├── casuya-orchestrator (worker)
   └── casuya-core / casuya-runtime
            │
            ▼
   PostgreSQL :5432   Redis :6379
```

Shared infrastructure is defined in the root `docker-compose.yml`.
Production-grade orchestration (monitoring, logging, ingress) lives in
`casuya-deployment`.
