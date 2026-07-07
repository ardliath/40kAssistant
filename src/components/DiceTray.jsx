import { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { DICE_COLORS, colorById } from '../diceColors'
import { buildShareUrl } from '../share/shareLinks'
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

const randomFace = () => Math.floor(Math.random() * 6) + 1

/** A single clickable D6 face rendered with pips, in the given colour. */
function Die({ value, colorId, rolling, selected, disabled, onClick }) {
  const color = colorById(colorId)
  const litCells = PIP_LAYOUT[value] ?? []
  return (
    <button
      type="button"
      className={`die ${rolling ? 'rolling' : ''} ${selected ? 'selected' : ''}`}
      style={{ '--die-bg': color.die, '--pip-color': color.pip }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${color.label} die showing ${value}${selected ? ', selected' : ''}`}
    >
      {Array.from({ length: 9 }, (_, cell) => (
        <span key={cell} className="die-cell">
          {litCells.includes(cell) && <span className="pip" />}
        </span>
      ))}
    </button>
  )
}

/**
 * The dice tray: a wooden-rimmed green felt surface holding any number of
 * D6s. Add dice in the colour of your choice, click dice to select them,
 * and roll/clear either the whole tray or just your selection.
 * The dice themselves are owned by the parent (GamePage), which persists
 * them to localStorage — that lets other components load dice into the tray.
 */
export default function DiceTray({ dice, setDice }) {
  const [selectedColor, setSelectedColor] = useLocalStorage(
    '40k.diceColor',
    'white',
  )
  // Ids of currently selected dice (transient UI state, not persisted).
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  // If dice are replaced from outside (e.g. a unit throw loaded into the
  // tray), drop any selection ids that no longer exist.
  useEffect(() => {
    setSelectedIds((prev) => {
      const live = new Set(dice.map((d) => d.id))
      const next = new Set([...prev].filter((id) => live.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [dice])
  // Ids of dice mid-roll; while non-empty a roll animation is in progress.
  const [rollingIds, setRollingIds] = useState(() => new Set())
  const rolling = rollingIds.size > 0
  const intervalRef = useRef(null)

  // Share panel state.
  const [shareUrl, setShareUrl] = useState(null) // null = panel closed
  const [copied, setCopied] = useState(false)

  // Show a one-time note if this session was opened from a share link.
  const [importNote, setImportNote] = useState(
    () => window.sessionStorage.getItem('40k.sharedImport') === '1',
  )
  useEffect(() => {
    if (importNote) window.sessionStorage.removeItem('40k.sharedImport')
  }, [importNote])

  // Clean up the scramble interval if we unmount mid-roll.
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const openShare = () => {
    setShareUrl(buildShareUrl())
    setCopied(false)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked (e.g. insecure context) — the link is still
      // visible and selectable in the field for a manual copy.
    }
  }

  const toggleSelect = (id) => {
    if (rolling) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const chooseColor = (id) => {
    setSelectedColor(id)
    // If any dice are selected, recolour them to the chosen colour too.
    if (selectedIds.size > 0) {
      setDice((current) =>
        current.map((d) =>
          selectedIds.has(d.id) ? { ...d, colorId: id } : d,
        ),
      )
    }
  }

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
    if (rolling || dice.length === 0) return
    if (selectedIds.size > 0) {
      // Remove only the selected dice.
      setDice((current) => current.filter((d) => !selectedIds.has(d.id)))
      setSelectedIds(new Set())
    } else {
      // Nothing selected: clear the whole tray.
      setDice([])
    }
  }

  const rollDice = () => {
    if (rolling || dice.length === 0) return

    // Roll the selection if there is one, otherwise roll every die.
    const targetIds =
      selectedIds.size > 0
        ? new Set(dice.filter((d) => selectedIds.has(d.id)).map((d) => d.id))
        : new Set(dice.map((d) => d.id))
    if (targetIds.size === 0) return

    setRollingIds(targetIds)

    // Rapidly flick the targeted dice through random faces to fake a tumble...
    intervalRef.current = setInterval(() => {
      setDice((current) =>
        current.map((d) =>
          targetIds.has(d.id) ? { ...d, value: randomFace() } : d,
        ),
      )
    }, 70)

    // ...then settle on the final results after a short spin.
    setTimeout(() => {
      clearInterval(intervalRef.current)
      setDice((current) =>
        current.map((d) =>
          targetIds.has(d.id) ? { ...d, value: randomFace() } : d,
        ),
      )
      setRollingIds(new Set())
    }, 650)
  }

  const hasSelection = selectedIds.size > 0

  return (
    <section className="dice-tray-frame">
      {importNote && (
        <div className="import-note" role="status">
          <span>Loaded a shared tray.</span>
          <button
            type="button"
            className="import-note-dismiss"
            onClick={() => setImportNote(false)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div className="dice-tray-felt">
        {dice.length === 0 ? (
          <p className="tray-empty">Add a die to begin</p>
        ) : (
          <div className={`dice-grid ${dice.length > 8 ? 'compact' : ''}`}>
            {dice.map((d) => (
              <Die
                key={d.id}
                value={d.value}
                colorId={d.colorId}
                rolling={rollingIds.has(d.id)}
                selected={selectedIds.has(d.id)}
                disabled={rolling}
                onClick={() => toggleSelect(d.id)}
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
              onClick={() => chooseColor(c.id)}
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
            onClick={rollDice}
            disabled={rolling || dice.length === 0}
          >
            {rolling ? 'Rolling…' : hasSelection ? 'Roll Selected' : 'Roll All'}
          </button>
          <button
            className="tray-btn clear-btn"
            onClick={clearDice}
            disabled={rolling || dice.length === 0}
          >
            {hasSelection ? 'Clear Selected' : 'Clear All'}
          </button>
          <button
            className="tray-btn share-btn"
            onClick={openShare}
            disabled={rolling || dice.length === 0}
          >
            Share
          </button>
        </div>

        {hasSelection && (
          <p className="selection-hint">
            {selectedIds.size} selected — click a die to toggle
          </p>
        )}

        {shareUrl && (
          <div className="share-panel">
            <p className="share-title">Share this tray</p>
            <div className="share-row">
              <input
                className="share-url"
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                aria-label="Shareable link"
              />
              <button className="tray-btn add-btn" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="share-qr">
              <QRCodeSVG value={shareUrl} size={180} bgColor="#f4f1ea" fgColor="#1a1a1a" />
            </div>
            <button
              className="tray-btn clear-btn"
              onClick={() => setShareUrl(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
