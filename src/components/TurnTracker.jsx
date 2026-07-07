import { useLocalStorage } from '../hooks/useLocalStorage'

const MIN_TURN = 1
const MAX_TURN = 6

/**
 * Tracks the battle round (1-6) and whose turn it currently is.
 * State is persisted to localStorage.
 */
export default function TurnTracker() {
  const [turn, setTurn] = useLocalStorage('40k.turn', MIN_TURN)
  // false = your turn, true = opponent's turn
  const [isOpponentTurn, setIsOpponentTurn] = useLocalStorage(
    '40k.turn.isOpponent',
    false,
  )

  const increment = () => setTurn((t) => Math.min(MAX_TURN, t + 1))
  const decrement = () => setTurn((t) => Math.max(MIN_TURN, t - 1))
  const toggleActivePlayer = () => setIsOpponentTurn((v) => !v)

  return (
    <section className={`tracker turn-tracker ${isOpponentTurn ? 'opponent' : 'you'}`}>
      <h2>Battle Round</h2>

      <div className="counter">
        <button
          className="btn btn-round"
          onClick={decrement}
          disabled={turn <= MIN_TURN}
          aria-label="Decrease turn"
        >
          −
        </button>
        <span className="value" aria-live="polite">
          {turn}
        </span>
        <button
          className="btn btn-round"
          onClick={increment}
          disabled={turn >= MAX_TURN}
          aria-label="Increase turn"
        >
          +
        </button>
      </div>

      <div className="turn-indicator">
        <span className={`indicator-dot ${isOpponentTurn ? 'opponent' : 'you'}`} />
        <span className="indicator-label">
          {isOpponentTurn ? "Opponent's Turn" : 'Your Turn'}
        </span>
      </div>

      <button className="btn btn-wide" onClick={toggleActivePlayer}>
        Pass Turn
      </button>
    </section>
  )
}
