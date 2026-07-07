import { useState, useRef, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import './DiceTray.css'

// Which of the 9 grid cells hold a pip, for each face value (1-6).
// Cells are indexed left-to-right, top-to-bottom:
//   0 1 2
//   3 4 5
//   6 7 8
const PIP_LAYOUT = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

/** A single D6 face rendered with pips. */
function Die({ value, rolling }) {
  const litCells = PIP_LAYOUT[value] ?? []
  return (
    <div className={`die ${rolling ? 'rolling' : ''}`} aria-label={`Die showing ${value}`}>
      {Array.from({ length: 9 }, (_, cell) => (
        <span key={cell} className="die-cell">
          {litCells.includes(cell) && <span className="pip" />}
        </span>
      ))}
    </div>
  )
}

/**
 * The dice tray: a wooden-rimmed green felt surface with a single D6
 * you can roll. The last result is persisted to localStorage.
 */
export default function DiceTray() {
  const [value, setValue] = useLocalStorage('40k.lastRoll', 1)
  const [rolling, setRolling] = useState(false)
  const intervalRef = useRef(null)

  // Clean up the scramble interval if we unmount mid-roll.
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const roll = () => {
    if (rolling) return
    setRolling(true)

    // Rapidly flick through random faces to fake a tumble...
    intervalRef.current = setInterval(() => {
      setValue(Math.floor(Math.random() * 6) + 1)
    }, 70)

    // ...then settle on the final result after a short spin.
    setTimeout(() => {
      clearInterval(intervalRef.current)
      setValue(Math.floor(Math.random() * 6) + 1)
      setRolling(false)
    }, 650)
  }

  return (
    <section className="dice-tray-frame">
      <div className="dice-tray-felt">
        <Die value={value} rolling={rolling} />
      </div>

      <button className="btn roll-btn" onClick={roll} disabled={rolling}>
        {rolling ? 'Rolling…' : 'Roll D6'}
      </button>
    </section>
  )
}
