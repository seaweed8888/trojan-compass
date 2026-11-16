import test from 'node:test';
import assert from 'node:assert/strict';
import { campusLink } from '../src/features/map/campus-link';

test('interiors return to the originating campus without exposing the old generated scene', () => {
  assert.equal(campusLink(new URLSearchParams()), 'http://localhost:3001/');
  assert.equal(campusLink(new URLSearchParams('campusPort=3101')), 'http://localhost:3101/');
  assert.equal(campusLink(new URLSearchParams('campusPort=9999')), 'http://localhost:3001/');
  assert.equal(campusLink(new URLSearchParams(), true), '/campus/index.html');
});
