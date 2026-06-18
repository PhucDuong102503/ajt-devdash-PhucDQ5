# DevDash — Typed Async Dashboard

A sleek, modern single-page dashboard built with **TypeScript** (strict mode) and **Vite**. It loads data from the [DummyJSON API](https://dummyjson.com/) and presents products with search, filtering, sorting, and detail views — all with type-safe, asynchronous, well-structured code.

![DevDash Screenshot](./screenshot.png)

## Features

### ✅ Pass Tier (Foundation — 6.0 pts)
- [x] Project compiles with `"strict": true` and **zero** type errors
- [x] Domain data modelled with `interface` types (no `any` for fetched data)
- [x] Fetches and renders a product list using `async/await`
- [x] Functions and parameters are correctly type-annotated
- [x] `try/catch` error handling with a visible error state
- [x] Detail view shows a single item by ID (modal overlay)

### ✅ Good Tier (Intermediate — 8.0 pts)
- [x] Search, filter (by category), and sort (by price/rating) implemented with higher-order functions (`filter`, `map`, `sort`)
- [x] A reusable **generic** `fetchJson<T>(url: string): Promise<T>` helper used across the app
- [x] `Promise.all` to load products + categories in parallel
- [x] Application state modelled with a **union/literal type** (`idle | loading | success | error`)

### ✅ Excellent Tier (Advanced — 10.0 pts)
- [x] A **discriminated union** drives app state and is exhaustively narrowed (via `assertNever`)
- [x] **Utility types** used meaningfully: `Pick` (ProductSummary), `Omit` (ProductDisplayDetails), `Partial` (DashboardDataUpdate), `Record` (CategoryMap)
- [x] A **generic class** `CacheManager<T extends Identifiable>` with a constraint for detail caching
- [x] **Debounce** (a closure) applied to the search input
- [x] Clean module architecture, reusable helpers, and this README with run instructions

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript (strict) | Application logic and type safety |
| Vite | Build tooling and dev server |
| Vanilla CSS | Glassmorphism dark-theme styling |
| Fetch API | Network requests to DummyJSON |
| DummyJSON API | Product / category data source |

## Project Structure

```
ajt-devdash/
├── index.html          # Entry HTML
├── package.json
├── tsconfig.json       # "strict": true
├── styles.css          # Dark glassmorphism design system
├── src/
│   ├── main.ts         # App entry — state init, Promise.all, debounce setup
│   ├── types.ts        # Interfaces, discriminated union, utility types
│   ├── api.ts          # Generic fetchJson<T> + endpoint wrappers
│   ├── state.ts        # Centralized state management
│   ├── ui.ts           # Render functions, event binding, caching
│   └── utils.ts        # Debounce, CacheManager<T>, assertNever, formatCurrency
└── README.md
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
```
The output will be in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## Deployment

Deploy the `dist/` folder to any static hosting service:
- [GitHub Pages](https://pages.github.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)

## Author

Built as part of the **AJT-LA-01** assignment.
