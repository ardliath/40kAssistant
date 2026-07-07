import { useState, useEffect } from 'react'

/**
 * A useState-like hook that persists its value to localStorage.
 *
 * @param {string} key          The localStorage key to read/write.
 * @param {*}      initialValue The value to use when nothing is stored yet.
 * @returns [value, setValue]   Same shape as useState.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch (err) {
      console.warn(`Could not read localStorage key "${key}":`, err)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.warn(`Could not write localStorage key "${key}":`, err)
    }
  }, [key, value])

  return [value, setValue]
}
