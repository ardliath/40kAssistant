import DiceTray from './components/DiceTray'
import TurnTracker from './components/TurnTracker'
import VictoryPointTracker from './components/VictoryPointTracker'
import CommandPointTracker from './components/CommandPointTracker'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Warhammer 40,000</h1>
        <p className="subtitle">Game Tracker</p>
      </header>

      <main className="game-layout">
        <DiceTray />

        <aside className="trackers">
          <TurnTracker />
          <VictoryPointTracker />
          <CommandPointTracker />
        </aside>
      </main>
    </div>
  )
}
