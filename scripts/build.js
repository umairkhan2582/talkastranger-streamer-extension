const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const manifest = require('../manifest.json');

console.log(`Building TalkAStranger Streamer Companion v${manifest.version}...`);

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const zipName = `talkastranger-streamer-companion-v${manifest.version}.zip`;
const zipPath = path.join(distDir, zipName);

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Create distribution ZIP
execSync(`zip -r "${zipPath}" manifest.json background.js popup sidepanel capture content icons overlays -x "*.DS_Store"`, {
  cwd: rootDir,
  stdio: 'inherit'
});

const stat = fs.statSync(zipPath);
console.log(`Build complete! Created ${zipPath} (${Math.round(stat.size / 1024)} KB)`);
