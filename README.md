# Warhammer 40,000 Game Tracker

A small React app for tracking a game of Warhammer 40,000. It has three
independent components, each of which persists its own state to
`localStorage` so your game survives a page refresh.

## Components

- **`TurnTracker`** — battle round counter (1–6) with increment/decrement
  buttons and an indicator showing whether it's your turn or your opponent's
  (toggle with the **Pass Turn** button).
- **`VictoryPointTracker`** — victory point counter with +/− buttons. Cannot
  go below zero.
- **`CommandPointTracker`** — command point counter with +/− buttons. Cannot
  go below zero.

All three share a small `useLocalStorage` hook (`src/hooks/useLocalStorage.js`).

## Getting started

You need [Node.js](https://nodejs.org/) 18+ installed (it was not present when
this project was scaffolded).

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build into `dist/`
- `npm run preview` — preview the production build

## Project structure

```
src/
  components/
    TurnTracker.jsx
    VictoryPointTracker.jsx
    CommandPointTracker.jsx
  hooks/
    useLocalStorage.js
  App.jsx
  main.jsx
  App.css
  index.css
```
