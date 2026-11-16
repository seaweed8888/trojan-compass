// Mobile presentation reuses the saved directory, filters, map assets and actions.
// Moving the original nodes preserves their event handlers and current values.
export function setupMobileCampus({ search, categories, panel, resetMap, showResults, buildings, notify }) {
  const media = matchMedia('(max-width: 767px)')
  const header = document.createElement('header')
  header.className = 'campus-mobile-header'
  const brand = document.createElement('a')
  brand.href = '#map'
  brand.setAttribute('aria-label', 'Trojan Compass campus map')
  brand.innerHTML = '<img src="./assets/usc_monogram_white_210x76.png" alt="USC"><span class="campus-brand-divider" aria-hidden="true"></span><span class="campus-brand-name">Trojan <span>Compass</span></span>'
  brand.onclick = e => { e.preventDefault(); resetMap(); close() }
  const campuses = document.createElement('nav')
  campuses.setAttribute('aria-label', 'Campus')
  const upc = button('UPC', () => { resetMap(); close() })
  upc.setAttribute('aria-label', 'University Park Campus')
  upc.setAttribute('aria-current', 'location')
  const hsc = button('HSC', () => document.querySelector('[data-cy="top-bar-btn-1"]').click())
  hsc.setAttribute('aria-label', 'Health Sciences Campus')
  campuses.append(upc, hsc)
  campuses.className = 'campus-switcher'
  header.append(brand)

  const dock = document.createElement('div')
  dock.className = 'campus-mobile-dock'
  const sheet = document.createElement('section')
  sheet.className = 'campus-mobile-sheet'
  sheet.id = 'campus-mobile-sheet'
  sheet.hidden = true
  const grip = button('', () => close())
  grip.className = 'campus-sheet-grip'
  grip.setAttribute('aria-label', 'Collapse panel')
  grip.innerHTML = '<span></span>'
  let swipe = null
  let suppressGripClick = false
  grip.onpointerdown = e => {
    swipe = { id: e.pointerId, y: e.clientY, time: e.timeStamp, distance: 0 }
    grip.setPointerCapture(e.pointerId)
  }
  grip.onpointermove = e => {
    if (!swipe || swipe.id !== e.pointerId) return
    swipe.distance = Math.max(0, e.clientY - swipe.y)
    if (swipe.distance < 4) return
    sheet.classList.add('is-dragging')
    sheet.style.transform = `translateY(${Math.min(swipe.distance, sheet.clientHeight)}px)`
  }
  function finishSwipe(e, cancelled = false) {
    if (!swipe || swipe.id !== e.pointerId) return
    const { distance, time } = swipe
    swipe = null
    sheet.classList.remove('is-dragging')
    sheet.style.transform = ''
    suppressGripClick = distance > 4
    if (!cancelled && (distance > 50 || (distance > 18 && distance / Math.max(1, e.timeStamp - time) > .5))) close(false)
  }
  grip.onpointerup = e => finishSwipe(e)
  grip.onpointercancel = e => finishSwipe(e, true)
  grip.onclick = () => { if (!suppressGripClick) close(); suppressGripClick = false }
  const content = document.createElement('div')
  content.className = 'campus-sheet-content'
  sheet.append(grip, content)
  const input = search.querySelector('input')
  const results = search.querySelector('.demo-results')
  input.placeholder = 'Search Trojan Compass'
  const bar = document.createElement('div')
  bar.className = 'campus-search-bar'
  const lens = document.createElement('span')
  lens.className = 'campus-search-lens'
  lens.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>'
  bar.append(lens)
  const searchTray = document.createElement('div')
  searchTray.className = 'campus-search-tray'
  searchTray.append(bar)
  dock.append(sheet, searchTray)
  document.body.append(header, dock)
  const homes = new Map([input, results, categories, panel].map(node => {
    const marker = document.createComment('Original campus control position')
    node.before(marker)
    return [node, marker]
  }))
  let active = null
  let returnFocus = null

  function restore() {
    for (const [node, marker] of homes) {
      if (node !== input || !media.matches) marker.after(node)
    }
    if (media.matches && input.parentElement !== bar) bar.append(input)
    panel.hidden = true
  }
  function close(restoreFocus = true) {
    restore()
    sheet.hidden = true
    sheet.style.transform = ''
    sheet.classList.remove('is-dragging')
    swipe = null
    active = null
    input.blur()
    if (restoreFocus) returnFocus?.focus({ preventScroll: true })
    returnFocus = null
    resizeMap()
  }
  function open(id, title, preserveResults = false) {
    if (!media.matches) return
    restore()
    content.replaceChildren()
    active = id
    returnFocus = brand
    sheet.dataset.tool = id
    sheet.setAttribute('aria-label', title ?? ({search:'Search campus locations',options:'Map options',filters:'Campus filters',campus:'Choose campus',more:'More map tools'}[id] ?? 'Map information'))
    sheet.hidden = false
    if (id === 'search') {
      content.append(results)
      if (!preserveResults && !input.value.trim()) showResults(buildings.filter(b => /\((LAW|THH|TCC|VKC)\)/.test(b.name)).slice(0, 4))
    } else if (id === 'options') {
      const actions = document.createElement('div')
      actions.className = 'campus-option-actions'
      actions.append(button('Filters', () => open('filters')), button('Campus', () => open('campus')), button('More', () => open('more')))
      content.append(actions)
    } else if (id === 'filters') {
      const controls = []
      const sync = () => controls.forEach(({ source, target }) => target.setAttribute('aria-checked', source.getAttribute('aria-checked')))
      const clear = button('Clear filters', () => { document.querySelector('#clear').click(); sync() })
      clear.className = 'campus-clear-filters'
      const list = document.createElement('div')
      list.className = 'campus-filter-list'
      const rows = [...categories.querySelectorAll('.category')]
      const rank = row => row.id.includes('buildings') ? 0 : row.id.includes('parking') ? 1 : 2
      rows.sort((a, b) => rank(a) - rank(b))
      for (const original of rows) {
        const name = original.querySelector('.name')
        const source = original.querySelector('[role="checkbox"]')
        const row = document.createElement('div')
        row.className = 'campus-filter-row'
        const browse = button('', () => {
          if (name.getAttribute('role') === 'button') name.click()
          else notify('This category is available on the official USC map.')
        })
        browse.className = 'campus-filter-name'
        browse.setAttribute('aria-label', `Browse ${name.textContent.trim()}`)
        const icon = original.querySelector('img')?.cloneNode(true)
        if (icon) { icon.removeAttribute('class'); browse.append(icon) }
        browse.append(Object.assign(document.createElement('span'), {textContent: name.textContent.trim()}))
        const toggle = button('', () => { source.click(); sync() })
        toggle.className = 'campus-filter-switch'
        toggle.setAttribute('role', 'switch')
        toggle.setAttribute('aria-label', `Show ${name.textContent.trim()}`)
        toggle.innerHTML = '<span></span>'
        controls.push({source, target:toggle})
        row.append(browse, toggle)
        list.append(row)
      }
      sync()
      content.append(clear, list)
    } else if (id === 'campus') {
      const recenter = button('Recenter map', () => { resetMap(); close(); notify('Map centered on University Park Campus.') })
      recenter.className = 'campus-recenter'
      content.append(campuses, recenter)
    } else if (id === 'more') {
      const actions = document.createElement('div')
      actions.className = 'campus-more-actions'
      actions.append(
        button('My location', () => document.querySelector('#location-services').click()),
        button('Campus tours', () => document.querySelector('#sidebar-tab-tours').click()),
        button('Street View', () => notify('Street View is available on the official USC map.')),
        button('Map gestures', () => notify('Drag to move. Pinch to zoom. Tap a building for its name; double-tap to explore. Swipe a panel down to close.')),
      )
      const credits = document.querySelector('#atlas3d').cloneNode(true)
      credits.removeAttribute('id')
      credits.className = 'campus-mobile-credits'
      credits.querySelector('.cookie-preferences-link').onclick = () => document.querySelector('#atlas3d .cookie-preferences-link').click()
      content.append(actions, credits)
    } else {
      content.append(panel)
      panel.hidden = false
      panel.dataset.mobileTitle = ['share'].includes(id) ? 'hidden' : 'visible'
    }
    if (id !== 'search') { input.blur(); grip.focus({ preventScroll: true }) }
    resizeMap()
  }
  function resizeMap() {
    document.body.style.setProperty('--campus-dock-height', `${dock.getBoundingClientRect().height}px`)
  }
  new ResizeObserver(resizeMap).observe(dock)
  function syncKeyboard() {
    const viewport = window.visualViewport
    const inset = media.matches && viewport && viewport.scale === 1
      ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop) : 0
    document.body.style.setProperty('--campus-keyboard-offset', `${inset}px`)
  }
  window.visualViewport?.addEventListener('resize', syncKeyboard)
  window.visualViewport?.addEventListener('scroll', syncKeyboard)
  syncKeyboard()
  // Capture before map selection: close the current sheet without swallowing the tap.
  document.addEventListener('pointerdown', e => {
    if (media.matches && active && !dock.contains(e.target)) close(false)
  }, true)
  document.addEventListener('campus:panel-close', () => {
    if (media.matches && active) close()
  })
  document.addEventListener('campus:panel-open', e => {
    if (media.matches) open(e.detail.title === 'Share this map' ? 'share' : 'info', e.detail.title)
  })
  document.addEventListener('campus:results', () => {
    if (media.matches && active === 'filters') {
      input.value = ''
      open('search', undefined, true)
    }
  })
  document.addEventListener('keydown', e => { if (media.matches && e.key === 'Escape' && active) close() })
  for (const [id, action] of [
    ['search-link', () => { open('search'); input.focus() }],
    ['locations-and-tours-link', () => open('filters')],
    ['map-link', () => { close(); document.querySelector('#map').focus() }],
    ['tool-bar-link', () => input.focus()],
  ]) document.getElementById(id)?.addEventListener('click', e => {
    if (media.matches) { e.preventDefault(); action() }
  })
  function adapt() {
    close()
    document.body.classList.toggle('mobile-campus', media.matches)
    document.body.classList.remove('demo-sidebar-open')
    const sidebar = document.querySelector('#sidebar')
    sidebar.inert = true
    sidebar.setAttribute('aria-hidden', 'true')
    categories.hidden = !!input.value.trim()
    resizeMap()
  }
  input.addEventListener('focus', () => { if (media.matches && active !== 'search') open('search') })
  input.addEventListener('click', () => { if (media.matches && active !== 'search') open('search') })
  input.addEventListener('input', () => { if (media.matches && active !== 'search') open('search', undefined, true) })
  media.addEventListener('change', adapt)
  adapt()
}

function button(label, action) {
  const element = document.createElement('button')
  element.type = 'button'
  element.textContent = label
  element.onclick = action
  return element
}
