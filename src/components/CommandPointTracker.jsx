import { useLocalStorage } from '../hooks/useLocalStorage'

/**
 * Tracks Command Points. Cannot go below zero.
 * State is persisted to localStorage.
 */
export default function CommandPointTracker() {
  const [points, setPoints] = useLocalStorage('40k.commandPoints', 0)

  const increment = () => setPoints((p) => p + 1)
  const decrement = () => setPoints((p) => Math.max(0, p - 1))

  return (
    <section className="tracker cp-tracker">
      <h2>Command Points</h2>

      <div className="counter">
        <button
          className="btn btn-round"
          onClick={decrement}
          disabled={points <= 0}
          aria-label="Decrease command points"
        >
          −
        </button>
        <span className="value" aria-live="polite">
          {points}
        </span>
        <button
          className="btn btn-round"
          onClick={increment}
          aria-label="Increase command points"
        >
          +
        </button>
      </div>
    </section>
  )
}
