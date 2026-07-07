import { useHashRoute } from './hooks/useHashRoute'
import GamePage from './pages/GamePage'
import RostersPage from './pages/RostersPage'
import './App.css'

export default function App() {
  const route = useHashRoute()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Warhammer 40,000</h1>
        <p className="subtitle">Game Tracker</p>

        <nav className="app-nav">
          <a href="#/" className={route === '/' ? 'active' : ''}>
            Game
          </a>
          <a href="#/rosters" className={route === '/rosters' ? 'active' : ''}>
            Rosters
          </a>
        </nav>
      </header>

      {route === '/rosters' ? <RostersPage /> : <GamePage />}
    </div>
  )
}
