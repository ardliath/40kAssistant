import { writeLocalStorage } from './hooks/useLocalStorage'

/**
 * Reset the table for a new game:
 *  - battle round back to 1, your turn
 *  - victory points and command points to 0
 *  - every model in every roster revived
 *
 * Rosters themselves (units, models, throws) are kept — they're your army,
 * not the game state. The dice tray is also left alone.
 */
export function startNewGame() {
  writeLocalStorage('40k.turn', 1)
  writeLocalStorage('40k.turn.isOpponent', false)
  writeLocalStorage('40k.victoryPoints', 0)
  writeLocalStorage('40k.commandPoints', 0)

  // Revive everyone.
  let rosters
  try {
    rosters = JSON.parse(window.localStorage.getItem('40k.rosters'))
  } catch {
    rosters = null
  }
  if (Array.isArray(rosters)) {
    writeLocalStorage(
      '40k.rosters',
      rosters.map((r) => ({
        ...r,
        units: (r.units ?? []).map((u) => ({
          ...u,
          models: (u.models ?? []).map((m) => ({ ...m, dead: false })),
        })),
      })),
    )
  }
}
