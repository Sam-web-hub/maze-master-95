# 🧩 Maze Master 95

A retro Windows 95-style maze game built with Next.js 14, TypeScript, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- 🎲 Procedurally generated mazes (recursive backtracker algorithm)
- 5 difficulty sizes: 10×10 up to 35×35
- ⌨️ Arrow keys or WASD to move
- 🔥 Orange trail tracking your path
- 💡 Auto-Solve (BFS pathfinding highlights full solution)
- ❓ Hint (shows just the next step)
- ⏱️ Timer, move counter, and best-time tracking
- 🏆 Win dialog on escape
- 🖥️ Full Windows 95 aesthetic — title bar, menu bar, toolbar, status bar, taskbar

## Project Structure

```
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Win95 styles + Tailwind
├── components/
│   ├── MazeGame.tsx     # Main game component (all state)
│   └── MazeCanvas.tsx   # Canvas renderer
└── lib/
    └── maze.ts          # Maze generation & BFS solver
```

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **HTML Canvas** for maze rendering
