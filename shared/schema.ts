import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We'll store game history in the DB, but active game state will be in memory for speed
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  player1Id: text("player1_id").notNull(),
  player2Id: text("player2_id").notNull(), // Will be 'cpu' for CPU games
  winnerId: text("winner_id"),
  // Board state: 6 rows x 7 cols. 0=empty, 1=Player1 (Red), 2=Player2 (Yellow)
  board: jsonb("board").$type<number[][]>().notNull(),
  turn: text("turn").notNull(), // 'player1' or 'player2'
  status: text("status").notNull(), // 'playing', 'finished', 'aborted'
  isCpu: boolean("is_cpu").default(false).notNull(),
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
});

export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

// === WebSocket Protocol ===

export const WS_MESSAGES = {
  JOIN_QUEUE: 'JOIN_QUEUE',
  LEAVE_QUEUE: 'LEAVE_QUEUE',
  START_CPU_GAME: 'START_CPU_GAME',
  MATCH_FOUND: 'MATCH_FOUND',
  MAKE_MOVE: 'MAKE_MOVE',
  GAME_UPDATE: 'GAME_UPDATE',
  GAME_OVER: 'GAME_OVER',
  OPPONENT_DISCONNECTED: 'OPPONENT_DISCONNECTED',
  ERROR: 'ERROR'
} as const;

export type WsMessage =
  | { type: 'JOIN_QUEUE' }
  | { type: 'LEAVE_QUEUE' }
  | { type: 'START_CPU_GAME', payload: { difficulty: 'easy' | 'medium' | 'hard' } }
  | { type: 'MATCH_FOUND', payload: { gameId: number, yourColor: 1 | 2, opponentId: string } }
  | { type: 'MAKE_MOVE', payload: { column: number, gameId: number } }
  | { type: 'GAME_UPDATE', payload: { board: number[][], turn: 1 | 2 } }
  | { type: 'GAME_OVER', payload: { winner: 1 | 2 | 'draw', board: number[][] } }
  | { type: 'OPPONENT_DISCONNECTED' }
  | { type: 'ERROR', payload: { message: string } };
