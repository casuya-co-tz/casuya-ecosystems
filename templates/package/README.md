# Package template

Use this template as the starting point for a new `casuya-*` package so it
conforms to the workspace conventions.

## Structure to create

```
casuya-<name>/
├── README.md
├── LICENSE
├── .gitignore
├── package.json
├── tsconfig.json        # extends ../tsconfig.base.json
├── src/
│   └── index.ts
├── tests/
│   └── index.test.ts
└── docs/
    └── README.md
```

## Minimal package.json

```json
{
  "name": "casuya-<name>",
  "version": "0.1.0",
  "private": true,
  "license": "MIT",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/ --ext .ts",
    "test": "vitest run"
  }
}
```

## tsconfig.json

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

Copy this folder, rename to `casuya-<name>`, and run `pnpm install`.
