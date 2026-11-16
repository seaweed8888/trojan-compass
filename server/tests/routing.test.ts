import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BUILDINGS } from '../src/infrastructure/datasets/prototype/campus.js'
import { accessibleEntrancePlace, entrancePlace, getBuildingPlaces, getLevels, getLayout, findPlace } from '../src/infrastructure/datasets/prototype/floorplan.js'
import { computeRoute } from '../src/modules/routing/prototype/routing.js'
import { missingPrototypeService } from './support/prototype-coverage.js'

test('prototype routes respect authored connector coverage and elevator mode excludes stairs', () => {
  for (const building of BUILDINGS) {
    const places = getBuildingPlaces(building.code)
    for (const floor of getLevels(building.code)) {
      const room = places.find(p => p.floor === floor && p.kind === 'room')
      assert.ok(room, `${building.code} floor ${floor} has a room`)
      for (const mode of ['fastest', 'stairs', 'elevator'] as const) {
        const from = mode === 'elevator' ? accessibleEntrancePlace(building.code) : entrancePlace(building.code)
        const route = computeRoute(from, room, mode)
        if (missingPrototypeService(building.code, floor, mode)) {
          assert.equal(route, null, `${building.code} floor ${floor}: ${mode} is not modeled`)
          continue
        }
        assert.ok(route, `${building.code} floor ${floor}: ${mode}`)
        assert.ok(route.steps.length > 0)
        assert.ok(Number.isFinite(route.meters))
        if (mode === 'elevator') {
          assert.equal(route.usesStairs, false)
          const entry = getLayout(building.code, from.floor).entrances.find(e => e.id === from.node)!
          assert.equal(route.entranceSteps, !entry.stepFree)
        }
      }
    }
  }
  assert.equal(findPlace('INVALID-ROOM'), undefined)
})

test('cross-building demo route includes an outdoor leg', () => {
  const from = entrancePlace('LAW')
  const to = entrancePlace('THH')
  const route = computeRoute(from, to, 'elevator')
  assert.ok(route)
  assert.ok(route.legs.some(leg => leg.kind === 'outdoor'))
  assert.equal(route.usesStairs, false)
})

test('routes to the same place have an arrival step and a point on the correct floor', () => {
  for (const place of getBuildingPlaces('LAW')) {
    const route = computeRoute(place, place, 'fastest')!
    assert.ok(route)
    assert.equal(route.steps.length, 1)
    assert.equal(route.steps[0]?.icon, 'arrive')
    assert.equal(route.steps[0]?.building, place.building)
    assert.equal(route.steps[0]?.floor, place.floor)
    assert.equal(route.legs[0]?.kind, 'indoor')
    assert.equal(route.meters, 0)
    assert.equal(route.seconds, 0)
  }
  const room = findPlace('LAW-101')!
  const invalid = { ...room, node: 'missing' }
  assert.equal(computeRoute(invalid, invalid, 'fastest'), null)
})
