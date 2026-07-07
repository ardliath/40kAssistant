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

// Available die colours. `die` is the body colour, `pip` the dot colour
// chosen to stay legible against it. White is the default.
const DICE_COLORS = [
  { id: 'white', label: 'White', die: '#f4f1ea', pip: '#1a1a1a' },
  { id: 'red', label: 'Red', die: '#b02a2a', pip: '#ffffff' },
  { id: 'blue', label: 'Blue', die: '#2a4bb0', pip: '#ffffff' },
  { id: 'green', label: 'Green', die: '#2a8a4a', pip: '#ffffff' },
  { id: 'yellow', label: 'Yellow', die: '#e8c53a', pip: '#1a1a1a' },
  { id: 'purple', label: 'Purple', die: '#6a2ab0', pip: '#ffffff' },
  { id: 'black', label: 'Black', die: '#1c1c1c', pip: '#f0f0f0' },
]

const colorById = (id) =>
  DICE_COLORS.find((c) => c.id === id) ?? DICE_COLORS[0]

const randomFace = () => Math.floor(Math.random() * 6) + 1

/** A single D6 face rendered with pips, in the given colour. */
function Die({ value, colorId, rolling }) {
  const color = colorById(colorId)
  const litCells = PIP_LAYOUT[value] ?? []
  return (
    <div
      className={`die ${rolling ? 'rolling' : ''}`}
      style={{ '--die-bg': color.die, '--pip-color': color.pip }}
      aria-label={`${color.label} die showing ${value}`}
    >
      {Array.from({ length: 9 }, (_, cell) => (
        <span key={cell} className="die-cell">
          {litCells.includes(cell) && <span className="pip" />}
        </span>
      ))}
    </div>
  )
}

/**
 * The dice tray: a wooden-rimmed green felt surface holding any number of
 * D6s. Add dice in the colour of your choice and roll them all at once.
 * The set of dice is persisted to localStorage.
 */
export default function DiceTray() {
  const [dice, setDice] = useLocalStorage('40k.dice', [
    { id: 'die-1', value: 1, colorId: 'white' },
  ])
  const [selectedColor, setSelectedColor] = useLocalStorage(
    '40k.diceColor',
    'white',
  )
  const [rolling, setRolling] = useState(false)
  const intervalRef = useRef(null)

  // Clean up the scramble interval if we unmount mid-roll.
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const addDie = () => {
    setDice((current) => [
      ...current,
      {
        id: `die-${Date.now()}-${current.length}`,
        value: randomFace(),
        colorId: selectedColor,
      },
    ])
  }

  const clearDice = () => {
    if (rolling) return
    setDice([])
  }

  const rollAll = () => {
    if (rolling || dice.length === 0) return
    setRolling(true)

    // Rapidly flick every die through random faces to fake a tumble...
    intervalRef.current = setInterval(() => {
      setDice((current) => current.map((d) => ({ ...d, value: randomFace() })))
    }, 70)

    // ...then settle on the final results after a short spin.
    setTimeout(() => {
      clearInterval(intervalRef.current)
      setDice((current) => current.map((d) => ({ ...d, value: randomFace() })))
      setRolling(false)
    }, 650)
  }

  return (
    <section className="dice-tray-frame">
      <div className="dice-tray-felt">
        {dice.length === 0 ? (
          <p className="tray-empty">Add a die to begin</p>
        ) : (
          <div className="dice-grid">
            {dice.map((d) => (
              <Die
                key={d.id}
                value={d.value}
                colorId={d.colorId}
                rolling={rolling}
              />
            ))}
          </div>
        )}
      </div>

      <div className="tray-controls">
        <div
          className="color-swatches"
          role="radiogroup"
          aria-label="New die colour"
        >
          {DICE_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`swatch ${selectedColor === c.id ? 'selected' : ''}`}
              style={{ background: c.die }}
              onClick={() => setSelectedColor(c.id)}
              aria-label={c.label}
              aria-pressed={selectedColor === c.id}
              title={c.label}
            />
          ))}
        </div>

        <div className="tray-buttons">
          <button className="tray-btn add-btn" onClick={addDie} disabled={rolling}>
            + Add D6
          </button>
          <button
            className="tray-btn roll-btn"
            onClick={rollAll}
            disabled={rolling || dice.length === 0}
          >
            {rolling ? 'Rolling…' : 'Roll'}
          </button>
          <button
            className="tray-btn clear-btn"
            onClick={clearDice}
            disabled={rolling || dice.length === 0}
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  )
}
