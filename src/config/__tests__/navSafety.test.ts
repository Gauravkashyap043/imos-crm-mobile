import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertNoStubModules } from '../navSafety.ts';
import { NAV_MODULES } from '../roles.ts';

test('NAV_MODULES has no ModuleRecords stub screens', () => {
  const result = assertNoStubModules(NAV_MODULES);
  assert.equal(result.ok, true, result.ok ? '' : result.screens.join(','));
});
