#!/usr/bin/env node

/**
 * Script to update GitHub repository metadata via GitHub API
 * Usage: node scripts/update-github-metadata.js
 *
 * Requires GITHUB_TOKEN environment variable with repo permissions
 */

/* eslint-disable no-undef */
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'casuya-co-tz';
const REPO = 'casuya-search';

const metadata = {
  name: 'casuya-search',
  description:
    'Educational content search and discovery system for the Casuya platform. Full-text search, ranking algorithms, autocomplete, filtering, recommendations, caching, and analytics.',
  homepage: 'https://casuya.co.tz',
  topics: [
    'search',
    'education',
    'full-text-search',
    'lunr',
    'typescript',
    'ranking',
    'recommendations',
    'autocomplete',
    'caching',
    'analytics',
    'educational-content',
  ],
  has_wiki: false,
  has_projects: true,
  has_issues: true,
  has_downloads: true,
};

function updateGitHubMetadata() {
  if (!GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const data = JSON.stringify({
    description: metadata.description,
    homepage: metadata.homepage,
    topics: metadata.topics,
    has_wiki: metadata.has_wiki,
    has_projects: metadata.has_projects,
    has_issues: metadata.has_issues,
    has_downloads: metadata.has_downloads,
  });

  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: `/repos/${OWNER}/${REPO}`,
    method: 'PATCH',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'casuya-search-metadata-updater',
    },
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✓ GitHub repository metadata updated successfully');
        console.log(JSON.parse(body).full_name);
      } else {
        console.error('✗ Failed to update metadata:', res.statusCode);
        console.error(body);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Error updating metadata:', error.message);
    process.exit(1);
  });

  req.write(data);
  req.end();
}

if (require.main === module) {
  updateGitHubMetadata();
}

module.exports = { metadata, updateGitHubMetadata };
