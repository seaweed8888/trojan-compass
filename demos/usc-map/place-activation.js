// Use click events for mouse, touch and pen, without depending on mobile dblclick.
// The name appears immediately; only two nearby, consecutive taps enter a place.
export function createPlaceActivation({ interval = 400, distance = 24 } = {}) {
  let previous = null
  return ({ id, time, x, y, keyboard = false }) => {
    if (keyboard) { previous = null; return false }
    const double = previous && previous.id === id && time >= previous.time &&
      time - previous.time <= interval && Math.hypot(x - previous.x, y - previous.y) <= distance
    previous = double ? null : { id, time, x, y }
    return !!double
  }
}
