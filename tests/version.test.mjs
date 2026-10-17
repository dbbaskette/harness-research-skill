import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, parseVersion } from '../scripts/lib/version.mjs';

test('runtime compatibility follows prerelease precedence without treating alpha as stable', () => {
  const ordered = ['0.9.5', '1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.2', '1.0.0-alpha.10', '1.0.0-beta', '1.0.0', '1.1.0', '2.0.0'];
  for (let i = 0; i < ordered.length; i++) {
    assert.equal(compareVersions(ordered[i], ordered[i]), 0);
    for (let j = i + 1; j < ordered.length; j++) {
      assert.equal(compareVersions(ordered[i], ordered[j]), -1);
      assert.equal(compareVersions(ordered[j], ordered[i]), 1);
    }
  }
  assert.equal(compareVersions('1.0.0-alpha.1+build.12', '1.0.0-alpha.1'), 0);
  assert.equal(compareVersions('1.0.0-alpha.99999999999999999999', '1.0.0-alpha.99999999999999999998'), 1);
});

test('malformed versions cannot bypass the runtime compatibility boundary', () => {
  for (const value of [null, 1, '', 'latest', '1.0', 'v1.0.0', '01.0.0', '1.0.0-alpha.01', '1.0.0-', '1.0.0+../escape', '9007199254740992.0.0']) {
    assert.throws(() => parseVersion(value), /Invalid guidance\/runtime version/);
  }
});
