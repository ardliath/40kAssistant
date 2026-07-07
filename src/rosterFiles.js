// ---------------------------------------------------------------------------
// Roster export / import as JSON files. Entirely client-side: export builds
// a Blob and triggers a download; import reads the chosen file locally.
//
// File shape (versioned for future changes):
//   { app: '40kAssistant', kind: 'roster', version: 1, roster: {...} }
// Import is lenient: a bare roster object ({ name, units: [...] }) is also
// accepted, so hand-written or edited files work too.
// ---------------------------------------------------------------------------
import { uid } from './uid'
import { DICE_COLOR_IDS } from './diceColors'

export const ROSTER_FILE_VERSION = 1

const safeFileName = (name) =>
  (String(name || 'roster')
    .trim()
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'roster') + '.40k-roster.json'

/** Download a roster as a JSON file. */
export function downloadRoster(roster) {
  const payload = {
    app: '40kAssistant',
    kind: 'roster',
    version: ROSTER_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    roster,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeFileName(roster.name)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const cleanCount = (n) => Math.max(0, Math.min(99, Math.trunc(Number(n) || 0)))
const cleanColor = (c) => (DICE_COLOR_IDS.includes(c) ? c : 'white')

/**
 * Parse the text of an uploaded roster file into a roster ready to add.
 * Validates the structure and regenerates every id (so importing the same
 * file twice, or alongside the original, can't collide), remapping the
 * per-model dice specs to the new model ids.
 * @throws {Error} with a user-readable message if the file isn't a roster.
 */
export function parseRosterFile(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  // Accept the wrapped format or a bare roster object.
  const raw = data?.kind === 'roster' ? data.roster : data
  if (
    typeof data?.version === 'number' &&
    data.version > ROSTER_FILE_VERSION
  ) {
    throw new Error(
      'That roster file was made by a newer version of the app.',
    )
  }
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.units)) {
    throw new Error('That file does not look like a roster.')
  }

  return {
    id: uid(),
    name:
      typeof raw.name === 'string' && raw.name.trim()
        ? raw.name.trim()
        : 'Imported roster',
    units: raw.units.map((u) => {
      const idMap = new Map()
      const models = (Array.isArray(u?.models) ? u.models : []).map((m) => {
        const newId = uid()
        if (m?.id != null) idMap.set(m.id, newId)
        return {
          id: newId,
          name: String(m?.name ?? 'Model'),
          dead: Boolean(m?.dead),
        }
      })
      const throws = (Array.isArray(u?.throws) ? u.throws : []).map((t) => {
        const dice = {}
        if (t?.dice && typeof t.dice === 'object') {
          for (const [oldId, spec] of Object.entries(t.dice)) {
            const newId = idMap.get(oldId)
            if (newId && spec && typeof spec === 'object') {
              dice[newId] = {
                count: cleanCount(spec.count),
                colorId: cleanColor(spec.colorId),
              }
            }
          }
        }
        return { id: uid(), name: String(t?.name ?? 'Throw'), dice }
      })
      return { id: uid(), name: String(u?.name ?? 'Unit'), models, throws }
    }),
  }
}
