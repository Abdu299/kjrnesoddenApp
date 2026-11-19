const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const policy = load('../src/services/appUpdatePolicy.ts');
const iosUrl = 'https://apps.apple.com/no/app/kjornesodden/id123456789';
const active = () => ({ schemaVersion: 1, revision: 1,
  ios: { enabled: true, minimumVersion: '1.0.2', storeUrl: iosUrl },
  android: { enabled: false, minimumVersion: '', storeUrl: '' } });

test('version comparison is numeric and only older releases require an update', () => {
  assert.equal(policy.compareAppVersions('1.0.9', '1.0.10'), -1);
  assert.equal(policy.compareAppVersions('1.10.0', '1.9.99'), 1);
  assert.equal(policy.compareAppVersions('2.0.0', '1.99.99'), 1);
  assert.equal(policy.compareAppVersions('1.0.2', '1.0.2'), 0);
  const config = policy.parseAppUpdatePolicy(active());
  assert.equal(policy.requiredAppUpdate(config, 'ios', '1.0.1').storeUrl, iosUrl);
  for (const version of ['1.0.2', '1.0.3', '2.0.0', 'unknown']) assert.equal(policy.requiredAppUpdate(config, 'ios', version), null);
  assert.equal(policy.requiredAppUpdate(config, 'android', '1.0.1'), null);
  assert.equal(policy.requiredAppUpdate(policy.defaultAppUpdatePolicy, 'ios', '1.0.1'), null);
});
test('enabled requirements need a real version and a direct link to the correct store', () => {
  for (const invalid of ['', '1.0', '01.0.2', '1.0.2-beta', 'NaN', '1.0.2.3']) {
    const config = active(); config.ios.minimumVersion = invalid;
    assert.throws(() => policy.parseAppUpdatePolicy(config));
  }
  for (const invalid of ['', 'javascript:alert(1)', 'https://apps.apple.com.evil.example/app/id123', 'https://example.com/app/id123']) {
    const config = active(); config.ios.storeUrl = invalid;
    assert.throws(() => policy.parseAppUpdatePolicy(config));
  }
  const config = active();
  config.android = { enabled: true, minimumVersion: '1.0.3', storeUrl: 'https://play.google.com/store/apps/details?id=com.kjornesodden.app' };
  assert.equal(policy.parseAppUpdatePolicy(config).android.enabled, true);
  config.android.storeUrl = 'https://play.google.com/store/apps/details?id=com.other.app';
  assert.throws(() => policy.parseAppUpdatePolicy(config));
});
test('the installed native version wins over an OTA manifest; Expo Go, development and web bypass the gate', () => {
  const application = { nativeApplicationVersion: '1.0.1' };
  const constants = { executionEnvironment: 'standalone', expoConfig: { version: '99.0.0' } };
  const platform = { OS: 'ios' };
  const native = (dev = false) => load('../src/services/appVersion.ts', {
    'expo-application': application,
    'expo-constants': { default: constants, __esModule: true, ExecutionEnvironment: { StoreClient: 'storeClient' } },
    'react-native': { Platform: platform }, './appUpdatePolicy': policy,
  }, { __DEV__: dev });
  assert.equal(native().getInstalledRelease().version, '1.0.1');
  assert.equal(native(true).getInstalledRelease(), null);
  constants.executionEnvironment = 'storeClient'; assert.equal(native().getInstalledRelease(), null);
  constants.executionEnvironment = 'standalone'; platform.OS = 'web'; assert.equal(native().getInstalledRelease(), null);
  platform.OS = 'android'; application.nativeApplicationVersion = null; assert.equal(native().getInstalledRelease(), null);
});

function setup() {
  const store = new Map([['users/admin', { role: 'admin' }]]);
  const state = { uid: 'admin', store, writes: 0, offline: false, listener: null, onError: null };
  const ref = (...args) => ({ path: args.filter((arg) => typeof arg === 'string').join('/') });
  const snap = (reference) => ({ exists: () => store.has(reference.path), data: () => store.get(reference.path) });
  const service = load('../src/services/appUpdatePolicyService.ts', {
    './firebase': { db: {}, auth: { get currentUser() { return state.uid ? { uid: state.uid } : null; } } },
    './appUpdatePolicy': policy,
    'firebase/firestore': {
      doc: ref, serverTimestamp: () => 123, getDoc: async (reference) => snap(reference),
      getDocFromServer: async (reference) => { if (state.offline) throw new Error('offline'); return snap(reference); },
      onSnapshot: (_ref, _options, next, error) => { state.listener = next; state.onError = error; return () => {}; },
      runTransaction: async (_db, callback) => {
        const writes = [];
        await callback({ get: async (reference) => snap(reference), set: (reference, value) => writes.push([reference.path, value]) });
        for (const [key, value] of writes) store.set(key, value);
        state.writes++;
      },
    },
  });
  return { ...service, state };
}
test('public startup defaults to disabled before first save and does not replace failed server reads with fake requirements', async () => {
  const app = setup();
  assert.equal((await app.getAppUpdatePolicyFromServer()).ios.enabled, false);
  app.state.offline = true;
  await assert.rejects(app.getAppUpdatePolicyFromServer(), /offline/);
});
test('admin can activate and roll back requirements; concurrent edits are rejected', async () => {
  const app = setup();
  await app.saveAppUpdatePolicy(active(), 0);
  let stored = app.state.store.get('settings/appUpdates');
  assert.equal(stored.revision, 1); assert.equal(stored.updatedBy, 'admin');
  await assert.rejects(app.saveAppUpdatePolicy(active(), 0), /annen admin/);
  await app.saveAppUpdatePolicy({ ...stored, ios: { ...stored.ios, enabled: false } }, 1);
  stored = app.state.store.get('settings/appUpdates');
  assert.equal(stored.revision, 2); assert.equal(stored.ios.enabled, false);
  assert.equal(app.state.writes, 2);
});
test('customers and anonymous users cannot save app requirements', async () => {
  const app = setup(); app.state.uid = null;
  await assert.rejects(app.saveAppUpdatePolicy(active(), 0), /admin/);
  app.state.uid = 'customer'; app.state.store.set('users/customer', { role: 'customer' });
  await assert.rejects(app.saveAppUpdatePolicy(active(), 0), /admintilgang/);
  assert.equal(app.state.writes, 0);
});
test('a stale cached requirement is ignored and invalid remote config reports an error', () => {
  const app = setup(), received = [], errors = [];
  app.subscribeToAppUpdatePolicy((config) => received.push(config), (error) => errors.push(error));
  app.state.listener({ exists: () => true, data: active, metadata: { fromCache: true } });
  assert.equal(received.length, 0);
  app.state.listener({ exists: () => true, data: active, metadata: { fromCache: false } });
  assert.equal(received.length, 1);
  app.state.listener({ exists: () => true, data: () => ({ broken: true }), metadata: { fromCache: false } });
  assert.equal(errors.length, 1); assert.equal(received.length, 1);
});
