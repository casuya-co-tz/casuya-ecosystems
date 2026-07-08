# Conventions

Every `casuya-*` repository follows a baseline structure:

```
casuya-<name>/
├── README.md
├── LICENSE
├── .gitignore
├── package.json        (or pyproject.toml for Python services)
├── tsconfig.json       (TypeScript packages)
├── src/
├── tests/
└── docs/
```

## Shared configuration

Extend the workspace bases instead of redefining rules:

- TypeScript: `"extends": "../tsconfig.base.json"`
- ESLint: `"extends": "../../.eslintrc.base.json"`

## Workflow

```bash
pnpm bootstrap   # install + create .env
pnpm dev         # start infra + watch all packages
pnpm build       # build everything
pnpm test        # run all suites
pnpm doctor      # diagnose local environment
pnpm verify      # structure + build + test gate
```

## Commit / release

Releases are tracked with [Changesets](https://github.com/changesets/changesets).
Add a changeset via `pnpm changeset` before merging user-facing changes.

## Architectural governance

`pnpm validate:arch` (powered by `casuya-devtools`) enforces:

- Internal dependencies must use the `workspace:*` protocol.
- No dependencies on non-existent `casuya-*` packages.
- No circular dependencies between packages.
- Runtime dependencies must be on the approved allowlist
  (`scripts/approved-deps.txt`).

Add a new approved dependency by appending it to `scripts/approved-deps.txt`
(one per line; glob patterns like `@casuya/*` are supported) and committing with
a changeset. Run with `ARCH_STRICT=1 pnpm validate:arch` to treat unapproved
dependencies as hard errors instead of warnings.

The check runs automatically in CI (`architecture` job) and in the pre-commit
hook.

## API contracts

Every package that exposes an HTTP/WebSocket API declares a
`ServiceContract` at `contracts/contract.json` in its package root. The shape
follows the `ServiceContract` interface in `casuya-orchestrator/contracts`:

```json
{
  "name": "casuya-api",
  "version": "1.0.0",
  "endpoints": [
    { "method": "GET", "path": "/health" },
    { "method": "POST", "path": "/v1/lessons", "requestSchema": { }, "responseSchema": { } }
  ],
  "events": [
    { "type": "lesson.published", "version": 1, "schema": { } }
  ]
}
```

`pnpm validate:arch` validates every contract: required `name`/`version`, a valid
`endpoints` array (methods restricted to GET/POST/PUT/DELETE/PATCH), and no
duplicate service names or duplicate `method + path` pairs across the workspace.
Contracts are the source of truth for the orchestrator's service catalog and for
cross-service integration tests.
