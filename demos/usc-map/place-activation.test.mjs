import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPlaceActivation } from './place-activation.js'

const tap = (id, time, x = 100, y = 100) => ({ id, time, x, y })

test('one click previews; a nearby second click opens once', () => {
  const activate = createPlaceActivation()
  assert.equal(activate(tap('LAW', 100)), false)
  assert.equal(activate(tap('LAW', 300, 105, 104)), true)
  assert.equal(activate(tap('LAW', 350)), false)
})

test('slow taps, different buildings and widely separated taps do not open an interior', () => {
  const activate = createPlaceActivation()
  assert.equal(activate(tap('LAW', 0)), false)
  assert.equal(activate(tap('LAW', 600)), false)
  assert.equal(activate(tap('THH', 650)), false)
  assert.equal(activate(tap('LAW', 700)), false)
  assert.equal(activate(tap('LAW', 750, 200)), false)
})

test('keyboard or assistive clicks do not accidentally count as a double tap', () => {
  const activate = createPlaceActivation()
  activate(tap('LAW', 0))
  assert.equal(activate({ ...tap('LAW', 10), keyboard: true }), false)
  assert.equal(activate(tap('LAW', 20)), false)
})
