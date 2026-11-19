const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

function setup() {
  const store = new Map([
    ['users/admin', { role: 'admin' }],
    ['restaurants/grill', { name: 'Fagerstrand Grill', loginName: 'Fagerstrand Grill', active: true }],
    ['products/pizza', { restaurantId: 'grill', price: 305 }],
  ]);
  const state = { uid: 'admin', store, accounts: new Map(), signOuts: 0, deletions: 0,
    creations: 0, failed: false, beforeCommit: null };
  const ref = (...args) => ({ path: args.filter((arg) => typeof arg === 'string').join('/') });
  const snap = (reference) => ({ exists: () => store.has(reference.path), data: () => store.get(reference.path) });
  const service = load('../src/services/restaurantLoginService.ts', {
    './firebase': { db: {}, firebaseConfig: {}, auth: { get currentUser() { return state.uid ? { uid: state.uid } : null; } } },
    'firebase/app': { initializeApp: () => ({}), deleteApp: async () => { state.deletions++; } },
    'firebase/auth': {
      inMemoryPersistence: 'memory', initializeAuth: (_app, options) => { assert.equal(options.persistence, 'memory'); return {}; },
      createUserWithEmailAndPassword: async (_auth, email, code) => {
        if (state.accounts.has(email)) throw Object.assign(new Error('exists'), { code: 'auth/email-already-in-use' });
        const account = { user: { uid: 'new-restaurant' }, code };
        state.accounts.set(email, account); state.creations++; return account;
      },
      signInWithEmailAndPassword: async (_auth, email, code) => {
        const account = state.accounts.get(email);
        if (!account || account.code !== code) throw new Error('wrong password');
        return account;
      },
      signOut: async () => { state.signOuts++; },
    },
    'firebase/firestore': {
      doc: ref, getDoc: async (reference) => snap(reference), serverTimestamp: () => 123,
      runTransaction: async (_db, callback) => {
        if (state.beforeCommit) state.beforeCommit();
        const writes = [];
        const result = await callback({ get: async (reference) => snap(reference),
          set: (reference, data) => writes.push([reference.path, data]),
          update: (reference, data) => writes.push([reference.path, { ...store.get(reference.path), ...data }]),
        });
        if (state.failed) throw Object.assign(new Error('offline'), { code: 'unavailable' });
        for (const [key, data] of writes) store.set(key, data);
        return result;
      },
    },
  });
  return { ...service, state };
}

test('admin attaches a login to the existing restaurant and keeps the menu, admin session and password private', async () => {
  const app = setup();
  const menu = app.state.store.get('products/pizza');
  const result = await app.createRestaurantLogin('grill', 'test-code');
  assert.equal(result.loginName, 'Fagerstrand Grill');
  assert.equal(app.state.uid, 'admin');
  assert.equal(app.state.store.get('restaurants/grill').authUid, 'new-restaurant');
  assert.equal(app.state.store.get('users/new-restaurant').restaurantId, 'grill');
  assert.equal(app.state.store.get('users/new-restaurant').role, 'restaurant');
  assert.equal(app.state.store.get('products/pizza'), menu);
  assert.equal([...app.state.store.keys()].filter((key) => key.startsWith('restaurants/')).length, 1);
  assert.equal(JSON.stringify([...app.state.store]).includes('test-code'), false);
  assert.equal(app.state.signOuts, 1); assert.equal(app.state.deletions, 1);
});
test('anonymous users and customers cannot create restaurant credentials', async () => {
  const app = setup(); app.state.uid = null;
  await assert.rejects(app.createRestaurantLogin('grill', 'test-code'), /admin/);
  app.state.uid = 'customer'; app.state.store.set('users/customer', { role: 'customer' });
  await assert.rejects(app.createRestaurantLogin('grill', 'test-code'), /admintilgang/);
  assert.equal(app.state.creations, 0);
});
test('missing restaurants, short codes and configured accounts are rejected before creating Auth users', async () => {
  const app = setup();
  await assert.rejects(app.createRestaurantLogin('grill', 'short'), /minst 6/);
  await assert.rejects(app.createRestaurantLogin('missing', 'test-code'), /finnes ikke/);
  app.state.store.get('restaurants/grill').authUid = 'existing';
  await assert.rejects(app.createRestaurantLogin('grill', 'test-code'), /allerede/);
  assert.equal(app.state.creations, 0);
});
test('failed Firestore linking is atomic and retrying with the same code resumes the Auth account', async () => {
  const app = setup(); app.state.failed = true;
  await assert.rejects(app.createRestaurantLogin('grill', 'test-code'), /samme kode/);
  assert.equal(app.state.store.get('restaurants/grill').authUid, undefined);
  assert.equal(app.state.store.has('users/new-restaurant'), false);
  app.state.failed = false;
  await assert.rejects(app.createRestaurantLogin('grill', 'other-code'), /samme kode/);
  await app.createRestaurantLogin('grill', 'test-code');
  assert.equal(app.state.creations, 1);
  assert.equal(app.state.store.get('users/new-restaurant').restaurantId, 'grill');
  assert.equal(app.state.deletions, 3);
});
test('an existing role or another restaurant login is never overwritten', async () => {
  const app = setup();
  const existing = { role: 'customer', name: 'Existing customer' };
  app.state.store.set('users/new-restaurant', existing);
  await assert.rejects(app.createRestaurantLogin('grill', 'test-code'), /allerede knyttet/);
  assert.equal(app.state.store.get('users/new-restaurant'), existing);
  assert.equal(app.state.store.get('restaurants/grill').authUid, undefined);
});
test('concurrent account assignment and revoked admin rights abort the link', async () => {
  const app = setup();
  app.state.beforeCommit = () => { app.state.store.get('restaurants/grill').authUid = 'someone-else'; };
  await assert.rejects(app.createRestaurantLogin('grill', 'test-code'), /allerede/);
  assert.equal(app.state.store.get('restaurants/grill').authUid, 'someone-else');
  assert.equal(app.state.store.has('users/new-restaurant'), false);
  const revoked = setup();
  revoked.state.beforeCommit = () => { revoked.state.store.set('users/admin', { role: 'customer' }); };
  await assert.rejects(revoked.createRestaurantLogin('grill', 'test-code'), /admin/);
  assert.equal(revoked.state.store.has('users/new-restaurant'), false);
});
