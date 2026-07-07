import { useState, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { colorById } from '../diceColors'
import { uid } from '../uid'
import './UnitThrowPanel.css'

const randomFace = () => Math.floor(Math.random() * 6) + 1

/**
 * Game-time panel: pick a roster, unit and throw; untick any models that
 * aren't eligible this time (out of range, can't see, etc. — defaults to
 * eligible); toggle dead models as they're killed (persisted back to the
 * roster); then load the resulting dice into the tray.
 */
export default function UnitThrowPanel({ onLoadDice }) {
  const [rosters, setRosters] = useLocalStorage('40k.rosters', [])
  const [rosterId, setRosterId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [throwId, setThrowId] = useState('')
  // Transient: model ids unticked for THIS throw. Resets whenever the unit
  // changes — eligibility is re-chosen every time, defaulting to eligible.
  const [ineligibleIds, setIneligibleIds] = useState(() => new Set())

  const roster = rosters.find((r) => r.id === rosterId)
  const unit = roster?.units.find((u) => u.id === unitId)
  const chosenThrow = unit?.throws.find((t) => t.id === throwId)

  // Reset downstream picks when upstream selection changes.
  useEffect(() => {
    setUnitId('')
  }, [rosterId])
  useEffect(() => {
    setThrowId('')
    setIneligibleIds(new Set())
  }, [unitId])

  const toggleEligible = (modelId) =>
    setIneligibleIds((prev) => {
      const next = new Set(prev)
      if (next.has(modelId)) next.delete(modelId)
      else next.add(modelId)
      return next
    })

  // Toggling dead persists back into the roster itself.
  const setDead = (modelId, dead) =>
    setRosters((rs) =>
      rs.map((r) =>
        r.id !== rosterId
          ? r
          : {
              ...r,
              units: r.units.map((u) =>
                u.id !== unitId
                  ? u
                  : {
                      ...u,
                      models: u.models.map((m) =>
                        m.id === modelId ? { ...m, dead } : m,
                      ),
                    },
              ),
            },
      ),
    )

  const specFor = (modelId) => chosenThrow?.dice[modelId]

  const contributors = (unit?.models ?? []).filter((m) => {
    const spec = specFor(m.id)
    return !m.dead && !ineligibleIds.has(m.id) && spec && spec.count > 0
  })

  const totalDice = contributors.reduce(
    (sum, m) => sum + specFor(m.id).count,
    0,
  )

  const loadDice = () => {
    if (totalDice === 0) return
    const dice = contributors.flatMap((m) => {
      const spec = specFor(m.id)
      return Array.from({ length: spec.count }, () => ({
        id: `die-${uid()}`,
        value: randomFace(),
        colorId: spec.colorId,
      }))
    })
    onLoadDice(dice)
  }

  if (rosters.length === 0) {
    return (
      <section className="throw-panel">
        <h2>Unit Throws</h2>
        <p className="throw-empty">
          Set up units and throws on the <a href="#/rosters">Rosters</a> page,
          then load their dice into the tray from here.
        </p>
      </section>
    )
  }

  return (
    <section className="throw-panel">
      <h2>Unit Throws</h2>

      <div className="throw-selects">
        <select
          value={rosterId}
          onChange={(e) => setRosterId(e.target.value)}
          aria-label="Roster"
        >
          <option value="">Roster…</option>
          {rosters.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          disabled={!roster}
          aria-label="Unit"
        >
          <option value="">Unit…</option>
          {roster?.units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <select
          value={throwId}
          onChange={(e) => setThrowId(e.target.value)}
          disabled={!unit}
          aria-label="Throw"
        >
          <option value="">Throw…</option>
          {unit?.throws.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {unit && chosenThrow && (
        <>
          <ul className="throw-models">
            {unit.models.map((m) => {
              const spec = specFor(m.id)
              const diceLabel =
                spec && spec.count > 0
                  ? `${spec.count} × ${colorById(spec.colorId).label}`
                  : 'no dice'
              return (
                <li key={m.id} className={m.dead ? 'model-dead' : ''}>
                  {m.dead ? (
                    <span className="dead-label">☠</span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={!ineligibleIds.has(m.id)}
                      onChange={() => toggleEligible(m.id)}
                      aria-label={`${m.name} eligible`}
                      title="Eligible for this throw"
                    />
                  )}
                  <span className="model-name">{m.name}</span>
                  <span className="model-dice">{diceLabel}</span>
                  <button
                    className="dead-btn"
                    onClick={() => setDead(m.id, !m.dead)}
                  >
                    {m.dead ? 'Revive' : 'Kill'}
                  </button>
                </li>
              )
            })}
          </ul>

          <button
            className="tray-btn roll-btn throw-load-btn"
            onClick={loadDice}
            disabled={totalDice === 0}
          >
            Load {totalDice} {totalDice === 1 ? 'Die' : 'Dice'} into Tray
          </button>
        </>
      )}
    </section>
  )
}
