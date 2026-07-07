import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { importSharedState } from './share/shareLinks'
import './index.css'

// If the page was opened via a share link, load that state into localStorage
// before anything renders so the components read the imported values.
importSharedState()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
