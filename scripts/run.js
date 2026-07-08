#!/usr/bin/env node
// Cross-platform script dispatcher.
// Usage: node scripts/run.js <name>   -> runs scripts/<name>.ps1 (Windows) or scripts/<name>.sh (elsewhere)
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const name = process.argv[2];
if (!name) {
  console.error('Usage: node scripts/run.js <script-name>');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
let shell;
let shellArg;
if (isWindows) {
  // Prefer PowerShell 7 (pwsh); fall back to Windows PowerShell (powershell).
  shell = 'pwsh';
  try {
    require('node:child_process').execSync('pwsh -NoProfile -Command "exit 0"', { stdio: 'ignore' });
  } catch {
    shell = 'powershell';
  }
  shellArg = '-File';
} else {
  shell = 'bash';
  shellArg = scriptPath;
}
const ext = isWindows ? 'ps1' : 'sh';
const scriptPath = join(__dirname, `${name}.${ext}`);
const args = isWindows ? [shellArg, scriptPath] : [scriptPath];

// Ensure the npm global bin (where pnpm lives) is on PATH for the spawned shell,
// since a non-profile subprocess may not inherit it.
if (isWindows) {
  try {
    const { execSync } = require('node:child_process');
    const npmPrefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim();
    const binDir = npmPrefix; // npm global bin on Windows is the prefix itself
    const path = process.env.PATH || '';
    if (binDir && !path.split(';').includes(binDir)) {
      process.env.PATH = `${binDir};${path}`;
    }
  } catch {
    /* ignore — pnpm may already be on PATH */
  }
}

const result = spawnSync(shell, args, { stdio: 'inherit', shell: false });
process.exit(result.status ?? 1);
