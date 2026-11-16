import assert from 'node:assert/strict'
import { test } from 'node:test'
import heights from './building-heights.json' with { type: 'json' }
import places from './locations.json' with { type: 'json' }
import { onCleanCampus } from './clean-map.js'

const buildings = heights.buildings

test('every displayed footprint has a finite height and documented uncertainty', () => {
  for (const place of places.filter(p => p.paths?.length && onCleanCampus(p))) {
    const height = buildings[place.id]
    assert.ok(height, place.name)
    assert.ok(Number.isFinite(height.meters) && height.meters >= 0 && height.meters <= 100, place.name)
    assert.equal(typeof height.estimated, 'boolean', place.name)
    assert.ok(height.source, place.name)
    if (height.source === 'osm-height') assert.ok(height.osmWayId, place.name)
  }
})

test('tower and Village proportions differ while outdoor ground remains flat', () => {
  const webb = places.find(p => p.code === 'WTO')
  const village = places.find(p => p.code === 'MRC')
  assert.ok(buildings[webb.id].meters > 40)
  assert.ok(buildings[village.id].meters >= 15 && buildings[village.id].meters <= 22)
  assert.ok(buildings[webb.id].meters > buildings[village.id].meters * 2)
  for (const name of ['Parking Lot SSRI', 'Baseball Stadium (Under Construction)', 'Uytengsu Aquatics Center (UAC)']) {
    const place = places.find(p => p.name === name)
    assert.equal(buildings[place.id].meters, 0, name)
  }
  // A mapped 51m bell tower covers <1% of this directory footprint. Its height
  // must not turn the entire surrounding academic building into a tower.
  const dmc = places.find(p => p.code === 'DMC')
  assert.ok(buildings[dmc.id].meters < 25)
})
