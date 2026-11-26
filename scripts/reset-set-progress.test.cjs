const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadService(progress, daily, options = {}) {
  const deleted = [];
  const batches = [];
  const reads = [];
  const fixtures = { progress, daily };
  const firestore = {
    collection: (_, ...parts) => parts.join('/'),
    getDocs: async ref => {
      reads.push(ref);
      if (options.readError) throw new Error('permission-denied');
      const name = ref.split('/').at(-1);
      return { docs: Object.entries(fixtures[name]).map(([id, data]) => ({
        id, ref: ref + '/' + id, data: () => data,
      })) };
    },
    writeBatch: () => {
      const refs = [];
      return {
        delete: ref => refs.push(ref),
        commit: async () => {
          if (options.commitError) throw new Error('permission-denied');
          batches.push(refs);
          deleted.push(...refs);
        },
      };
    },
  };
  const countries = [{ code: 'DE' }, { code: 'FR' }];
  const source = fs.readFileSync(path.join(__dirname, '../services/progressService.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const localRequire = name => {
    if (name === 'firebase/firestore') return firestore;
    if (name === '../firebase/config') return { db: {} };
    if (name === '../data/countries') return { countries };
    throw new Error('Unexpected dependency: ' + name);
  };
  vm.runInThisContext('(function(require,module,exports){' + compiled + '\n})')(localRequire, module, module.exports);
  return { reset: module.exports.resetSetProgress, deleted, batches, reads };
}

const progress = {
  countries_DE: { setId: 'countries', cardId: 'DE' },
  flags_DE: { setId: 'flags', cardId: 'DE' },
  capitals_FR: { setId: 'capitals', cardId: 'FR' },
  DE: { card: {} },
  FR: { setId: 'flags', cardId: 'FR' },
  unknown: { card: {} },
};
const daily = {
  'countries_2026-11-26': { setId: 'countries' },
  'flags_2026-11-26': { setId: 'flags' },
  'capitals_2026-11-26': { setId: 'capitals' },
  '2026-10-01': { newCardsStarted: 5 },
  '2026-10-02': { setId: 'flags', newCardsStarted: 1 },
  unknown: { newCardsStarted: 1 },
};

test('country reset deletes only that set and its recognized legacy records', async () => {
  const mock = loadService(progress, daily);
  await mock.reset('owner', 'countries');
  assert.deepEqual(mock.deleted.sort(), [
    'users/owner/progress/countries_DE',
    'users/owner/progress/DE',
    'users/owner/daily/countries_2026-11-26',
    'users/owner/daily/2026-10-01',
  ].sort());
  assert.deepEqual(mock.reads.sort(), ['users/owner/progress', 'users/owner/daily'].sort());
});

test('another set does not delete legacy country data or other sets', async () => {
  const mock = loadService(progress, daily);
  await mock.reset('owner', 'flags');
  assert.deepEqual(mock.deleted.sort(), [
    'users/owner/progress/flags_DE',
    'users/owner/progress/FR',
    'users/owner/daily/flags_2026-11-26',
    'users/owner/daily/2026-10-02',
  ].sort());
});

test('missing or unknown sets never cause a full-account reset', async () => {
  const mock = loadService(progress, daily);
  await assert.rejects(mock.reset('owner', ''));
  await assert.rejects(mock.reset('', 'countries'));
  assert.equal(mock.reads.length, 0);
  await mock.reset('owner', 'not-a-set');
  assert.equal(mock.deleted.length, 0);
  assert.equal(mock.batches.length, 0);
});

test('large histories use bounded batches and preserve unrelated documents', async () => {
  const many = Object.fromEntries(Array.from({ length: 1000 }, (_, index) => [
    'countries_day_' + index, { setId: 'countries' },
  ]));
  const mock = loadService(progress, { ...daily, ...many });
  await mock.reset('owner', 'countries');
  assert.equal(mock.deleted.length, 1004);
  assert.deepEqual(mock.batches.map(batch => batch.length), [450, 450, 104]);
  assert.equal(mock.deleted.some(ref => ref.includes('flags') || ref.includes('capitals')), false);
});

test('query and commit failures are reported without deleting other data', async () => {
  for (const options of [{ readError: true }, { commitError: true }]) {
    const mock = loadService(progress, daily, options);
    await assert.rejects(mock.reset('owner', 'countries'), /permission-denied/);
    assert.equal(mock.deleted.length, 0);
  }
});
