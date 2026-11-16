import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findRoom } from '../../server/src/infrastructure/datasets/prototype/floorplan';
import { BUILDINGS } from '../../server/src/infrastructure/datasets/prototype/campus';
import { searchLocationCodes } from '../../server/src/modules/search/prototype/location-search';
import {
  accessibleEntrancePlace,
  findPlace,
} from '../../server/src/infrastructure/datasets/prototype/floorplan';
import { isStepFreePlace } from '../../server/src/modules/routing/prototype/routing';

test('room codes accept spaces, hyphens, compact text, and lowercase', () => {
  for (const query of ['LAW 101', 'law-101', 'LAW101', '  law   101  ']) {
    const room = findRoom(query);
    assert.equal(room?.id, 'LAW-101');
    assert.equal(room?.building, 'LAW');
    assert.equal(room?.floor, 1);
  }
  assert.equal(findRoom('THH 201')?.building, 'THH');
  assert.equal(findRoom('THH 201')?.floor, 2);
});

test('named rooms use the same case-insensitive lookup and autocomplete as numbered rooms', () => {
  for (const query of ['LAW-2-Lincoln', 'law 2-lincoln', 'LAW2LINCOLN']) {
    assert.equal(findRoom(query)?.id, 'LAW-2-Lincoln');
  }
  assert.ok(searchLocationCodes('lincoln').some((option) => option.value === 'LAW 2-Lincoln'));
});

test('invalid and partial codes never select a different room', () => {
  for (const query of ['', 'LAW', 'LAW 10', 'LAW 99999', 'XYZ 101', 'LAW ENT']) {
    assert.equal(findRoom(query), undefined, query);
  }
});

test('autocomplete matches building names and partial room codes with common separators', () => {
  assert.ok(searchLocationCodes('law').some((option) => option.value === 'LAW'));
  assert.ok(searchLocationCodes('Doheny').some((option) => option.value === 'DML'));
  assert.deepEqual(
    searchLocationCodes('l')
      .slice(0, 2)
      .map((option) => option.value),
    ['LVL', 'LAW']
  );
  for (const query of ['law 10', 'LAW-10', 'law10', ' LAW  10 ']) {
    assert.ok(
      searchLocationCodes(query).some((option) => option.value === 'LAW 101'),
      query
    );
  }
  for (const query of ['', '  ', 'XYZ 101', 'LAW 99999'])
    assert.deepEqual(searchLocationCodes(query), []);
  assert.ok(searchLocationCodes('law').length <= 8);
});

test('every suggested code resolves to an available building or room', () => {
  for (const building of BUILDINGS) {
    const options = searchLocationCodes(building.code, Infinity);
    assert.ok(options.length > 1);
    for (const option of options) {
      assert.ok(
        BUILDINGS.some((item) => item.code === option.value) || findRoom(option.value),
        option.value
      );
    }
  }
});

test('outside is offered only when current-location suggestions enable it', () => {
  for (const query of ['', 'out', 'OUTSIDE', 'outside the building']) {
    assert.equal(searchLocationCodes(query, 8, true)[0]?.value, 'Outside the building');
    assert.ok(
      !searchLocationCodes(query).some((option) => option.value === 'Outside the building')
    );
  }
  assert.ok(searchLocationCodes('LAW 10', 8, true).some((option) => option.value === 'LAW 101'));
  assert.deepEqual(searchLocationCodes('XYZ', 8, true), []);
  assert.deepEqual(searchLocationCodes('', 0, true), []);
});

test('accessibility suggestions have step-free entrances and routes without stairs', () => {
  assert.equal(isStepFreePlace(findPlace('LAW-ENT')!), false, 'the north entrance has steps');
  assert.equal(isStepFreePlace(accessibleEntrancePlace('LAW')), true, 'the east ramp is step-free');
  assert.equal(
    isStepFreePlace(findRoom('LAW 301')!),
    true,
    'upper floors are reachable by elevator'
  );
  const room = findRoom('LAW 101')!;
  assert.equal(isStepFreePlace({ ...room, node: 'unreachable' }), false);
  for (const building of BUILDINGS) {
    const options = searchLocationCodes(building.code, Infinity, false, true);
    if (building.code === 'LAW') assert.ok(options.length);
    else assert.equal(options.length, 0, 'Inferred reconstruction geometry must not imply step-free access');
    for (const option of options) {
      const place = findRoom(option.value) ?? accessibleEntrancePlace(building.code);
      assert.ok(isStepFreePlace(place), option.value);
    }
  }
  assert.equal(searchLocationCodes('outside', 8, true, true)[0]?.value, 'Outside the building');
});
