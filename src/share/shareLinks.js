// ---------------------------------------------------------------------------
// Share links
//
// Encodes app state into a short, URL-safe query string so a tray (and, in
// future, other things) can be shared by link or QR code. Everything is
// client-side — the state travels entirely inside the URL.
//
// URL shape:   <base>?v=1&d=<dice>
//   v = format version (bump only when an existing segment's format changes)
//   d = dice segment (one base64url char per die: colourIndex*6 + (value-1))
//
// TO ADD A NEW SHAREABLE THING later (e.g. victory points, turn number):
//   1. Write an `encode()` that reads its localStorage key -> a string (or
//      null if there's nothing to share).
//   2. Write an `importToStorage(str, version)` that parses the string back
//      into that same localStorage key.
//   3. Add `{ key, encode, importToStorage }` to the SEGMENTS array below,
//      with a NEW unique key. Existing links keep working untouched.
// ---------------------------------------------------------------------------
import { DICE_COLOR_IDS } from '../diceColors'

export const SHARE_VERSION = 1

// 64 URL-safe characters (base64url) — no percent-encoding needed in a URL.
const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

// Safety cap so a crafted link can't spawn an absurd number of dice.
const MAX_DICE = 200

const clean = () => window.location.origin + import.meta.env.BASE_URL

// ---- Dice segment ----------------------------------------------------------
function encodeDice() {
  let dice
  try {
    dice = JSON.parse(window.localStorage.getItem('40k.dice'))
  } catch {
    return null
  }
  if (!Array.isArray(dice) || dice.length === 0) return null

  return dice
    .slice(0, MAX_DICE)
    .map((d) => {
      const c = DICE_COLOR_IDS.indexOf(d.colorId)
      const v = Number(d.value)
      // Fall back to white / 1 for anything unexpected rather than dropping it.
      const ci = c >= 0 ? c : 0
      const vi = v >= 1 && v <= 6 ? v - 1 : 0
      return ALPHABET[ci * 6 + vi]
    })
    .join('')
}

function importDice(str) {
  const maxIndex = DICE_COLOR_IDS.length * 6 - 1
  const dice = [...String(str).slice(0, MAX_DICE)]
    .map((ch, i) => {
      const n = ALPHABET.indexOf(ch)
      if (n < 0 || n > maxIndex) return null // ignore junk characters
      return {
        id: `die-shared-${Date.now()}-${i}`,
        colorId: DICE_COLOR_IDS[Math.floor(n / 6)],
        value: (n % 6) + 1,
      }
    })
    .filter(Boolean)

  // Replace the current tray with the shared one.
  window.localStorage.setItem('40k.dice', JSON.stringify(dice))
}

// ---- Segment registry ------------------------------------------------------
const SEGMENTS = [
  { key: 'd', encode: encodeDice, importToStorage: importDice },
  // Future example:
  // { key: 'g', encode: encodeGameState, importToStorage: importGameState },
]

/**
 * Build a shareable URL from the current persisted state.
 * @returns {string} an absolute URL including the app's base path.
 */
export function buildShareUrl() {
  const params = new URLSearchParams()
  params.set('v', String(SHARE_VERSION))
  for (const seg of SEGMENTS) {
    const encoded = seg.encode()
    if (encoded) params.set(seg.key, encoded)
  }
  return `${clean()}?${params.toString()}`
}

/**
 * If the current URL carries shared state, write it into localStorage and
 * strip the params. Call this ONCE before React renders so components pick
 * up the imported values through their normal localStorage reads.
 * @returns {boolean} whether anything was imported.
 */
export function importSharedState() {
  const params = new URLSearchParams(window.location.search)
  if (!params.has('v')) return false

  const version = Number(params.get('v'))
  // Refuse formats newer than we understand rather than misreading them.
  if (!Number.isFinite(version) || version > SHARE_VERSION) return false

  let imported = false
  for (const seg of SEGMENTS) {
    if (params.has(seg.key)) {
      seg.importToStorage(params.get(seg.key), version)
      imported = true
    }
  }

  if (imported) {
    // Flag it so the UI can acknowledge the import, then clean the URL so a
    // refresh doesn't re-import and the address bar looks tidy.
    window.sessionStorage.setItem('40k.sharedImport', '1')
    window.history.replaceState({}, '', clean())
  }
  return imported
}
