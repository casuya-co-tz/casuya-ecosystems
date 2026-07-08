#!/usr/bin/env node
// Installs the Casuya git hooks by pointing core.hooksPath at .githooks.
// Runs automatically via the "prepare" npm script after install.
const { spawnSync } = require('node:child_process');

const root = require('node:path').join(__dirname, '..', '.githooks');
const result = spawnSync('git', ['config', 'core.hooksPath', root], { stdio: 'inherit' });

if (result.status === 0) {
  console.log('Casuya git hooks installed (core.hooksPath -> .githooks).');
} else {
  console.warn('Could not configure git hooks (is this a git repository?). Skipping.');
}
