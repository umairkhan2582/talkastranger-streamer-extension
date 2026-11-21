const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const manifest = require('../manifest.json');
const overlaysData = require('../overlays/overlays-data.js');

test('manifest.json has valid Manifest V3 structure and v1.3.0', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, '1.3.0');
  assert.ok(manifest.action.default_popup);
  assert.ok(manifest.side_panel.default_path);
  assert.ok(manifest.background.service_worker);
});

test('overlays-data has all 30 themes with 3 scenes each and Stripe links', () => {
  assert.equal(overlaysData.themes.length, 30);
  assert.ok(overlaysData.bundleAllAccess);
  assert.equal(overlaysData.bundleAllAccess.price, 99);
  
  overlaysData.themes.forEach(t => {
    assert.ok(t.id);
    assert.ok(t.name);
    assert.equal(t.price, 10);
    assert.ok(t.stripeUrl.startsWith('https://buy.stripe.com/'));
    assert.equal(t.scenes.length, 3);
  });
});

test('manager.html and sidepanel.html reference required components', () => {
  const mgr = fs.readFileSync(path.join(rootDir, 'overlays/manager.html'), 'utf8');
  assert.ok(mgr.includes('OVERLAYS_SUITE_DATA'));
  
  const sp = fs.readFileSync(path.join(rootDir, 'sidepanel/sidepanel.html'), 'utf8');
  assert.ok(sp.includes('quickThemeSelect'));
  assert.ok(sp.includes('quickSceneSelect'));
});
