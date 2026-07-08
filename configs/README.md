# Shared configuration presets

This directory holds environment presets and baseline configs that individual
repositories can copy or extend. They are referenced by `docker-compose.yml` and
the root scripts.

## Files

- `env.common` — variables shared across all services
- `env.dev` — development overrides

Copy the relevant values into the workspace root `.env` (see `.env.example`).
