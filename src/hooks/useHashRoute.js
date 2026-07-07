import { useState, useEffect } from 'react'

/**
 * Tiny hash-based router: returns the current route from the URL hash
 * (e.g. "#/rosters" -> "/rosters", no hash -> "/"). Hash routing works on
 * GitHub Pages without any server configuration.
 */
export function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
