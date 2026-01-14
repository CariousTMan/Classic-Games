# Connect Four Game

## Overview

A real-time multiplayer Connect Four game built with React frontend and Express backend. Players can compete against each other online through WebSocket matchmaking or play against CPU opponents with varying difficulty levels. The classic 6x7 grid game features smooth animations, victory celebrations, and a modern arcade-styled UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom arcade-themed design tokens
- **Animations**: Framer Motion for game piece dropping and page transitions
- **Effects**: Canvas-confetti for victory celebrations

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Style**: REST endpoints for game history, WebSocket for real-time gameplay
- **Real-time Communication**: Native WebSocket (ws library) for game state synchronization
- **Build Process**: esbuild for server bundling, Vite for client bundling

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines the games table
- **Active Game State**: In-memory storage (`MemStorage` class) for fast real-time gameplay
- **Session Storage**: Memory-based for development, PostgreSQL-compatible for production

### WebSocket Protocol
The game uses a custom message protocol defined in `shared/schema.ts`:
- `JOIN_QUEUE` / `LEAVE_QUEUE`: Matchmaking queue management
- `START_CPU_GAME`: Initiates single-player game with difficulty setting
- `MATCH_FOUND`: Server notifies clients when paired
- `MAKE_MOVE` / `GAME_UPDATE`: Turn-based move synchronization
- `GAME_OVER`: Announces winner or draw
- `OPPONENT_DISCONNECTED`: Handles player disconnection

### Project Structure
```
client/          # React frontend
  src/
    components/  # UI components including Board, PlayerCard
    hooks/       # Custom hooks (useGameSocket, useToast)
    pages/       # Route components (Home, Game)
    lib/         # Utilities and query client
server/          # Express backend
  index.ts       # Server entry point
  routes.ts      # WebSocket and REST route handlers
  storage.ts     # Game state management
  db.ts          # Database connection
shared/          # Shared types and schemas
  schema.ts      # Drizzle schema and WebSocket types
  routes.ts      # API route definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations
- **Drizzle-Zod**: Schema validation integration

### UI Framework
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Tailwind CSS**: Utility-first styling with custom theme configuration
- **Lucide React**: Icon library

### Real-time Communication
- **ws**: WebSocket server implementation
- **connect-pg-simple**: PostgreSQL session store (available for production)

### Development Tools
- **Vite**: Frontend dev server with HMR
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **Replit plugins**: Error overlay, cartographer, dev banner for Replit environment