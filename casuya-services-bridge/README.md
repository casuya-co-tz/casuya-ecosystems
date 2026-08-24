# casuya-services-bridge

**Identity**: The Unified Services Bridge — a single HTTP microservice that hosts and exposes
multiple Casuya packages (content, exams, media, search, auth, analytics) behind one port.

## Mission

Aggregate independent Casuya capabilities into one coherent HTTP service so the platform and
other consumers only need a single endpoint (`casuya-services-bridge`, port 3003) instead of
running each package as its own process.

## Features

- `GET /content/*`, `GET /exams/*`, `GET /media/*`, `GET /search/*`
- Auth register/login via `casuya-auth`
- Analytics report + query + `GET /analytics/stats` (cache + provider summary)
- Dependency-free Node `http` server

## Integration

Built with `tsc` to `dist/src`. The platform's `services_bridge_client.py` calls it over HTTP.
