// Validate native configuration without printing keys or contacting Google.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');

function config(type) {
  const result = spawnSync(process.execPath, [cli, 'config', '--type', type, '--json'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  // Raw CLI output can contain credentials; do not include it in failures.
  assert.equal(result.status, 0, `Expo ${type} configuration failed (output withheld).`);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`Expo ${type} configuration did not return valid JSON (output withheld).`);
  }
}

const native = config('introspect');
const publicConfig = config('public');
const android = native._internal.modResults.android.manifest.manifest;
const application = android.application[0];
const keys = (application['meta-data'] ?? []).filter(
  (entry) => entry.$['android:name'] === 'com.google.android.geo.API_KEY',
);
assert.equal(native.android.package, 'com.mohdanas786.eride', 'Unexpected Android application ID.');
assert.equal(keys.length, 1, 'Expected exactly one Android Maps API key in the native manifest.');
const key = keys[0].$['android:value'];
assert.ok(typeof key === 'string' && /^AIza[\w-]{35}$/.test(key), 'Configure a Google API key in .env.local or EAS.');
assert.ok(!JSON.stringify(publicConfig).includes(key), 'The native Maps key must not appear in public Expo config.');
assert.equal(publicConfig.extra.androidGoogleMaps, true, 'Map availability flag is missing.');
const permissions = (android['uses-permission'] ?? []).map((entry) => entry.$['android:name']);
assert.ok(permissions.includes('android.permission.ACCESS_FINE_LOCATION'), 'Fine location permission is missing.');
assert.ok(permissions.includes('android.permission.ACCESS_COARSE_LOCATION'), 'Coarse location permission is missing.');
assert.ok(!permissions.includes('android.permission.ACCESS_BACKGROUND_LOCATION'), 'Background location is not needed.');
console.log('PASS: Android package, native Maps key injection, public-config isolation and foreground permissions.');
console.log('Google Cloud restrictions, signing SHA-1 and rendered map tiles still require manual verification.');
