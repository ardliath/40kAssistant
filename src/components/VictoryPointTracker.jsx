import { useLocalStorage } from '../hooks/useLocalStorage'

/**
 * Tracks Victory Points. Cannot go below zero.
 * State is persisted to localStorage.
 */
export default function VictoryPointTracker() {
  const [points, setPoints] = useLocalStorage('40k.victoryPoints', 0)

  const increment = () => setPoints((p) => p + 1)
  const decrement = () => setPoints((p) => Math.max(0, p - 1))

  return (
    <section className="tracker vp-tracker">
      <h2>Victory Points</h2>

      <div className="counter">
        <button
          className="btn btn-round"
          onClick={decrement}
          disabled={points <= 0}
          aria-label="Decrease victory points"
        >
          −
        </button>
        <span className="value" aria-live="polite">
          {points}
        </span>
        <button
          className="btn btn-round"
          onClick={increment}
          aria-label="Increase victory points"
        >
          +
        </button>
      </div>
    </section>
  )
}
