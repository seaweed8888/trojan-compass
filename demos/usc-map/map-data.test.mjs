import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { buildingCode, compassUrl, mapPoint, SUPPORTED_CODES } from './map-data.js'
import { onCleanCampus } from './clean-map.js'

const places = JSON.parse(await readFile(new URL('./locations.json', import.meta.url)))

test('campus crop keeps main campus and Village while excluding surrounding locations', () => {
  for (const name of ['Musick Law Building (LAW)', 'Cowlings Residential College (CRC)', 'McMorrow Residential College (MRC)']) {
    const place = places.find(p => p.name === name)
    assert.ok(place, name)
    assert.ok(onCleanCampus(place), name)
  }
  for (const name of [/USC Hotel/, /Cardinal Gardens/]) {
    const place = places.find(p => name.test(p.name))
    assert.ok(place, String(name))
    assert.equal(onCleanCampus(place), false, place.name)
  }
  assert.equal(onCleanCampus({lat:34.061, lng:-118.205}), false, 'Health Sciences is outside the displayed campus')
})

test('official building records link to every supported interior, with no false fallback', () => {
  for (const code of SUPPORTED_CODES) {
    assert.ok(places.some(place => buildingCode(place) === code), `${code} has an official map location`)
    const url = new URL(compassUrl(code))
    assert.equal(url.port, '3000')
    assert.equal(url.searchParams.get('building'), code)
    assert.equal(url.searchParams.get('floor'), '1')
  }
  assert.equal(buildingCode({ name: 'Bovard Administration Building (ADM)', code: 'ADM' }), null)
  assert.equal(compassUrl('ADM'), null)
  assert.equal(buildingCode({ name: 'Medicine Crow Center (DMC)', code: 'DMC' }), 'VKC')
})

test('map projection aligns with saved Taper Hall marker', () => {
  const [x, y] = mapPoint(34.022186, -118.284485)
  assert.ok(Math.abs(x - 7) < 1)
  assert.ok(Math.abs(y - 35) < 1)
  assert.deepEqual(mapPoint(34.022798, -118.284647), [0, 0])
})

test('only LAW and Medicine Crow offer campus floor-plan entry', () => {
  assert.deepEqual([...SUPPORTED_CODES].sort(), ['LAW', 'VKC'])
  for (const code of ['DML', 'LVL', 'THH', 'TCC', 'SGM', 'SAL', 'KAP', 'ADM']) {
    assert.equal(buildingCode({ name: `Building (${code})`, code }), null)
    assert.equal(compassUrl(code), null)
  }
  assert.equal(buildingCode({ name: 'Musick Law Building (LAW)' }), 'LAW')
  assert.equal(buildingCode({ name: 'Medicine Crow Center (DMC)' }), 'VKC')
  assert.equal(buildingCode({ name: 'Von KleinSmid Center (VKC)' }), 'VKC')
})

test('campus previews preserve their return port and native iOS stays bundled', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'location')
  try {
    for (const port of ['3001', '3101']) {
      Object.defineProperty(globalThis, 'location', { configurable: true, value: { protocol: 'http:', port } })
      const url = new URL(compassUrl('LAW'))
      assert.equal(url.port, '3000')
      assert.equal(url.searchParams.get('campusPort'), port)
    }
    Object.defineProperty(globalThis, 'location', { configurable: true, value: { protocol: 'compass-web:' } })
    assert.equal(compassUrl('LAW'), '/interior/index.html?building=LAW&floor=1')
  } finally {
    if (previous) Object.defineProperty(globalThis, 'location', previous)
    else delete globalThis.location
  }
})
