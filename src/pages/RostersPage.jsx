import { useState, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { DICE_COLORS } from '../diceColors'
import { downloadRoster, parseRosterFile } from '../rosterFiles'
import { uid } from '../uid'
import './RostersPage.css'

// Data shape (persisted under '40k.rosters'):
//   roster: { id, name, units: [unit] }
//   unit:   { id, name, models: [model], throws: [throw] }
//   model:  { id, name, dead }
//   throw:  { id, name, dice: { [modelId]: { count, colorId } } }
//
// A "throw" is a named dice profile for the unit (e.g. "Shooting",
// "Combat" — the user names them, the app doesn't care). Each model gets
// its own dice count + colour per throw.

const emptySpec = { count: 0, colorId: 'white' }

export default function RostersPage() {
  const [rosters, setRosters] = useLocalStorage('40k.rosters', [])
  const [openRosterId, setOpenRosterId] = useState(null)
  const [openUnitId, setOpenUnitId] = useState(null)
  const [newRosterName, setNewRosterName] = useState('')
  const [importError, setImportError] = useState(null)
  const fileInputRef = useRef(null)

  // ---- import / export ----
  const importFromFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    try {
      const roster = parseRosterFile(await file.text())
      setRosters((rs) => [...rs, roster])
      setOpenRosterId(roster.id)
      setImportError(null)
    } catch (err) {
      setImportError(err.message)
    }
  }

  // ---- immutable update helpers ----
  const updateRoster = (rosterId, fn) =>
    setRosters((rs) => rs.map((r) => (r.id === rosterId ? fn(r) : r)))

  const updateUnit = (rosterId, unitId, fn) =>
    updateRoster(rosterId, (r) => ({
      ...r,
      units: r.units.map((u) => (u.id === unitId ? fn(u) : u)),
    }))

  // ---- roster actions ----
  const addRoster = () => {
    const name = newRosterName.trim()
    if (!name) return
    const roster = { id: uid(), name, units: [] }
    setRosters((rs) => [...rs, roster])
    setNewRosterName('')
    setOpenRosterId(roster.id)
  }

  const deleteRoster = (rosterId) => {
    setRosters((rs) => rs.filter((r) => r.id !== rosterId))
    if (openRosterId === rosterId) setOpenRosterId(null)
  }

  // ---- unit actions ----
  const addUnit = (rosterId) => {
    const unit = { id: uid(), name: 'New unit', models: [], throws: [] }
    updateRoster(rosterId, (r) => ({ ...r, units: [...r.units, unit] }))
    setOpenUnitId(unit.id)
  }

  const deleteUnit = (rosterId, unitId) => {
    updateRoster(rosterId, (r) => ({
      ...r,
      units: r.units.filter((u) => u.id !== unitId),
    }))
    if (openUnitId === unitId) setOpenUnitId(null)
  }

  // ---- model actions ----
  const addModel = (rosterId, unitId) =>
    updateUnit(rosterId, unitId, (u) => ({
      ...u,
      models: [...u.models, { id: uid(), name: 'New model', dead: false }],
    }))

  const duplicateModel = (rosterId, unitId, model) =>
    updateUnit(rosterId, unitId, (u) => {
      const copy = { id: uid(), name: model.name, dead: false }
      return {
        ...u,
        models: [...u.models, copy],
        // Copy the model's dice specs across every throw too.
        throws: u.throws.map((t) =>
          t.dice[model.id] ? { ...t, dice: { ...t.dice, [copy.id]: { ...t.dice[model.id] } } } : t,
        ),
      }
    })

  const deleteModel = (rosterId, unitId, modelId) =>
    updateUnit(rosterId, unitId, (u) => ({
      ...u,
      models: u.models.filter((m) => m.id !== modelId),
      // Tidy up the model's dice specs from every throw.
      throws: u.throws.map((t) => {
        if (!(modelId in t.dice)) return t
        const { [modelId]: _removed, ...rest } = t.dice
        return { ...t, dice: rest }
      }),
    }))

  const setModel = (rosterId, unitId, modelId, patch) =>
    updateUnit(rosterId, unitId, (u) => ({
      ...u,
      models: u.models.map((m) => (m.id === modelId ? { ...m, ...patch } : m)),
    }))

  // ---- throw actions ----
  const addThrow = (rosterId, unitId) =>
    updateUnit(rosterId, unitId, (u) => ({
      ...u,
      throws: [...u.throws, { id: uid(), name: 'New throw', dice: {} }],
    }))

  const deleteThrow = (rosterId, unitId, throwId) =>
    updateUnit(rosterId, unitId, (u) => ({
      ...u,
      throws: u.throws.filter((t) => t.id !== throwId),
    }))

  const setThrowName = (rosterId, unitId, throwId, name) =>
    updateUnit(rosterId, unitId, (u) => ({
      ...u,
      throws: u.throws.map((t) => (t.id === throwId ? { ...t, name } : t)),
    }))

  const setDiceSpec = (rosterId, unitId, throwId, modelId, patch) =>
    updateUnit(rosterId, unitId, (u) => ({
      ...u,
      throws: u.throws.map((t) => {
        if (t.id !== throwId) return t
        const current = t.dice[modelId] ?? emptySpec
        return { ...t, dice: { ...t.dice, [modelId]: { ...current, ...patch } } }
      }),
    }))

  return (
    <main className="rosters-page">
      <section className="roster-panel">
        <h2>Rosters</h2>

        <div className="roster-add-row">
          <input
            type="text"
            value={newRosterName}
            onChange={(e) => setNewRosterName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRoster()}
            placeholder="New roster name…"
            aria-label="New roster name"
          />
          <button className="roster-btn primary" onClick={addRoster}>
            + Add Roster
          </button>
          <button
            className="roster-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Import…
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={importFromFile}
            hidden
          />
        </div>

        {importError && (
          <p className="roster-error" role="alert">
            Import failed: {importError}
          </p>
        )}

        {rosters.length === 0 && (
          <p className="roster-empty">
            No rosters yet. Create one above — e.g. “Ultramarines 1000pts”.
          </p>
        )}

        {rosters.map((roster) => (
          <div key={roster.id} className="roster-card">
            <div className="roster-card-header">
              <button
                className="roster-toggle"
                onClick={() =>
                  setOpenRosterId(openRosterId === roster.id ? null : roster.id)
                }
                aria-expanded={openRosterId === roster.id}
              >
                {openRosterId === roster.id ? '▾' : '▸'}
              </button>
              <input
                type="text"
                className="roster-name-input"
                value={roster.name}
                onChange={(e) =>
                  updateRoster(roster.id, (r) => ({ ...r, name: e.target.value }))
                }
                aria-label="Roster name"
              />
              <span className="roster-meta">
                {roster.units.length} unit{roster.units.length === 1 ? '' : 's'}
              </span>
              <button
                className="roster-btn"
                onClick={() => downloadRoster(roster)}
                title="Download this roster as a JSON file"
              >
                Export
              </button>
              <button
                className="roster-btn danger"
                onClick={() => deleteRoster(roster.id)}
              >
                Delete
              </button>
            </div>

            {openRosterId === roster.id && (
              <div className="roster-units">
                {roster.units.map((unit) => (
                  <div key={unit.id} className="unit-card">
                    <div className="unit-card-header">
                      <button
                        className="roster-toggle"
                        onClick={() =>
                          setOpenUnitId(openUnitId === unit.id ? null : unit.id)
                        }
                        aria-expanded={openUnitId === unit.id}
                      >
                        {openUnitId === unit.id ? '▾' : '▸'}
                      </button>
                      <input
                        type="text"
                        className="roster-name-input"
                        value={unit.name}
                        onChange={(e) =>
                          updateUnit(roster.id, unit.id, (u) => ({
                            ...u,
                            name: e.target.value,
                          }))
                        }
                        aria-label="Unit name"
                      />
                      <span className="roster-meta">
                        {unit.models.filter((m) => !m.dead).length}/
                        {unit.models.length} alive
                      </span>
                      <button
                        className="roster-btn danger"
                        onClick={() => deleteUnit(roster.id, unit.id)}
                      >
                        Delete
                      </button>
                    </div>

                    {openUnitId === unit.id && (
                      <div className="unit-editor">
                        <div className="unit-editor-actions">
                          <button
                            className="roster-btn"
                            onClick={() => addModel(roster.id, unit.id)}
                          >
                            + Add Model
                          </button>
                          <button
                            className="roster-btn"
                            onClick={() => addThrow(roster.id, unit.id)}
                          >
                            + Add Throw
                          </button>
                        </div>

                        {unit.models.length === 0 ? (
                          <p className="roster-empty">
                            Add models (e.g. “Intercessor”, “Sergeant”), then
                            throws (e.g. “Shooting”, “Combat”) and set each
                            model’s dice.
                          </p>
                        ) : (
                          <div className="unit-table-wrap">
                            <table className="unit-table">
                              <thead>
                                <tr>
                                  <th>Model</th>
                                  <th>Dead</th>
                                  {unit.throws.map((t) => (
                                    <th key={t.id}>
                                      <div className="throw-header">
                                        <input
                                          type="text"
                                          value={t.name}
                                          onChange={(e) =>
                                            setThrowName(
                                              roster.id,
                                              unit.id,
                                              t.id,
                                              e.target.value,
                                            )
                                          }
                                          aria-label="Throw name"
                                        />
                                        <button
                                          className="roster-btn danger small"
                                          onClick={() =>
                                            deleteThrow(roster.id, unit.id, t.id)
                                          }
                                          aria-label={`Delete throw ${t.name}`}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </th>
                                  ))}
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {unit.models.map((model) => (
                                  <tr
                                    key={model.id}
                                    className={model.dead ? 'model-dead' : ''}
                                  >
                                    <td>
                                      <input
                                        type="text"
                                        value={model.name}
                                        onChange={(e) =>
                                          setModel(roster.id, unit.id, model.id, {
                                            name: e.target.value,
                                          })
                                        }
                                        aria-label="Model name"
                                      />
                                    </td>
                                    <td className="cell-center">
                                      <input
                                        type="checkbox"
                                        checked={model.dead}
                                        onChange={(e) =>
                                          setModel(roster.id, unit.id, model.id, {
                                            dead: e.target.checked,
                                          })
                                        }
                                        aria-label={`${model.name} dead`}
                                      />
                                    </td>
                                    {unit.throws.map((t) => {
                                      const spec = t.dice[model.id] ?? emptySpec
                                      return (
                                        <td key={t.id}>
                                          <div className="dice-spec">
                                            <input
                                              type="number"
                                              min="0"
                                              max="99"
                                              value={spec.count}
                                              onChange={(e) =>
                                                setDiceSpec(
                                                  roster.id,
                                                  unit.id,
                                                  t.id,
                                                  model.id,
                                                  {
                                                    count: Math.max(
                                                      0,
                                                      Math.min(
                                                        99,
                                                        Number(e.target.value) || 0,
                                                      ),
                                                    ),
                                                  },
                                                )
                                              }
                                              aria-label={`${model.name} ${t.name} dice count`}
                                            />
                                            <select
                                              value={spec.colorId}
                                              onChange={(e) =>
                                                setDiceSpec(
                                                  roster.id,
                                                  unit.id,
                                                  t.id,
                                                  model.id,
                                                  { colorId: e.target.value },
                                                )
                                              }
                                              aria-label={`${model.name} ${t.name} dice colour`}
                                            >
                                              {DICE_COLORS.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                  {c.label}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        </td>
                                      )
                                    })}
                                    <td>
                                      <div className="model-actions">
                                        <button
                                          className="roster-btn small"
                                          onClick={() =>
                                            duplicateModel(roster.id, unit.id, model)
                                          }
                                          title="Duplicate model"
                                        >
                                          Copy
                                        </button>
                                        <button
                                          className="roster-btn danger small"
                                          onClick={() =>
                                            deleteModel(roster.id, unit.id, model.id)
                                          }
                                          title="Delete model"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  className="roster-btn"
                  onClick={() => addUnit(roster.id)}
                >
                  + Add Unit
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  )
}
