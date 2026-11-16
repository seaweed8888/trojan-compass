export function campusLink(query: URLSearchParams, bundled = false) {
  if (bundled) return '/campus/index.html';
  return query.get('campusPort') === '3101'
    ? 'http://localhost:3101/'
    : 'http://localhost:3001/';
}
