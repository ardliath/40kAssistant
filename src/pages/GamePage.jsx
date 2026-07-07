import { useLocalStorage } from '../hooks/useLocalStorage'
import { startNewGame } from '../newGame'
import DiceTray from '../components/DiceTray'
import UnitThrowPanel from '../components/UnitThrowPanel'
import TurnTracker from '../components/TurnTracker'
import VictoryPointTracker from '../components/VictoryPointTracker'
import CommandPointTracker from '../components/CommandPointTracker'

/**
 * The main game screen: dice tray + unit throw loader on the left,
 * turn/VP/CP trackers on the right. Owns the tray's dice state so the
 * unit throw panel can load dice into the tray.
 */
export default function GamePage() {
  const [dice, setDice] = useLocalStorage('40k.dice', [
    { id: 'die-1', value: 1, colorId: 'white' },
  ])

  return (
    <main className="game-layout">
      <div className="tray-column">
        <DiceTray dice={dice} setDice={setDice} />
        <UnitThrowPanel onLoadDice={setDice} />
      </div>

      <aside className="trackers">
        <TurnTracker />
        <VictoryPointTracker />
        <CommandPointTracker />

        <button
          className="new-game-btn"
          onClick={() => {
            if (
              window.confirm(
                'Start a new game? Turn, victory points and command points reset, and all models are revived.',
              )
            ) {
              startNewGame()
            }
          }}
        >
          ⚔ New Game
        </button>
      </aside>
    </main>
  )
}
