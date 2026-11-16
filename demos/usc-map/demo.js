if (window.location.port === '3001') {
  document.querySelector('link[href^="demo.css"]').href = 'official.css'
  import('./official.js')
} else {
  import('./ios.js')
}
