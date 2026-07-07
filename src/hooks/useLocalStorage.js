import { useState, useEffect, useRef } from 'react'

// Custom event used to keep every useLocalStorage instance (and any direct
// writer, e.g. the New Game reset) in sync within this tab.
const SYNC_EVENT = '40k-localstorage-sync'

const read = (key, fallback) => {
  try {
    const stored = window.localStorage.getItem(key)
    return stored !== null ? JSON.parse(stored) : fallback
  } catch (err) {
    console.warn(`Could not read localStorage key "${key}":`, err)
    return fallback
  }
}

/**
 * Write a value to localStorage and notify every mounted useLocalStorage
 * hook watching that key. Use this for programmatic writes from outside a
 * component (e.g. resetting several keys at once for a new game).
 */
export function writeLocalStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`Could not write localStorage key "${key}":`, err)
  }
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }))
}

/**
 * A useState-like hook that persists its value to localStorage.
 * All instances sharing a key stay in sync within the tab.
 *
 * @param {string} key          The localStorage key to read/write.
 * @param {*}      initialValue The value to use when nothing is stored yet.
 * @returns [value, setValue]   Same shape as useState.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => read(key, initialValue))

  // Keep the initial value in a ref so the sync listener doesn't need it as
  // a dependency (object/array literals would re-subscribe every render).
  const initialRef = useRef(initialValue)

  // Persist changes. Only write + notify when the stored value actually
  // differs — this also breaks the potential echo loop between instances.
  useEffect(() => {
    try {
      const serialized = JSON.stringify(value)
      if (window.localStorage.getItem(key) !== serialized) {
        window.localStorage.setItem(key, serialized)
        window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }))
      }
    } catch (err) {
      console.warn(`Could not write localStorage key "${key}":`, err)
    }
  }, [key, value])

  // Pick up writes made by other instances of this key (or writeLocalStorage).
  useEffect(() => {
    const onSync = (e) => {
      if (e.detail?.key !== key) return
      setValue((prev) => {
        const stored = window.localStorage.getItem(key)
        if (stored === null) return initialRef.current
        try {
          // Skip the update when we're already in sync to avoid re-renders.
          if (JSON.stringify(prev) === stored) return prev
          return JSON.parse(stored)
        } catch {
          return prev
        }
      })
    }
    window.addEventListener(SYNC_EVENT, onSync)
    return () => window.removeEventListener(SYNC_EVENT, onSync)
  }, [key])

  return [value, setValue]
}
