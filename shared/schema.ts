import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// We'll store game history in the DB, but active game state will be in memory for speed
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  gameType: text("game_type").notNull().default("connect4"), // 'connect4', 'checkers', 'chess', 'mancala', 'blackjack'
  player1Id: text("player1_id").notNull(),
  player2Id: text("player2_id").notNull(), // Will be 'cpu' for CPU games
  winnerId: text("winner_id"),
  // Board state: flexible for different games
  board: jsonb("board").notNull(),
  turn: text("turn").notNull(), // 'player1' or 'player2'
  status: text("status").notNull(), // 'playing', 'finished', 'aborted'
  isCpu: boolean("is_cpu").default(false).notNull(),
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
  metadata: jsonb("metadata").notNull().default({}), // For specialized state like castling rights
});

export const leaderboards = pgTable("leaderboards", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  gameType: text("game_type").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
});

export const insertLeaderboardSchema = createInsertSchema(leaderboards).omit({ id: true });
export type Leaderboard = typeof leaderboards.$inferSelect;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;

export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

// === WebSocket Protocol ===

export type PokerGameState = {
  playerHand: { suit: string, rank: string, value: number }[];
  communityCards: { suit: string, rank: string, value: number }[];
  playerChips: number;
  cpuChips: number;
  pot: number;
  currentBet: number;
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  turn: 1 | 2; // 1: Player, 2: CPU/Opponent
};

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
  | { type: 'JOIN_QUEUE', payload: { gameType: string } }
  | { type: 'LEAVE_QUEUE' }
  | { type: 'START_CPU_GAME', payload: { gameType: string, difficulty: 'easy' | 'medium' | 'hard' } }
  | { type: 'MATCH_FOUND', payload: { gameId: number, gameType: string, yourColor: 1 | 2, opponentId: string, board?: any } }
  | { type: 'POKER_ACTION', payload: { action: 'fold' | 'check' | 'call' | 'bet', amount?: number, gameId: number } }
  | { type: 'MAKE_MOVE', payload: { move: any, gameId: number } }
  | { type: 'GAME_UPDATE', payload: { board: any, turn: 1 | 2 } }
  | { type: 'GAME_OVER', payload: { winner: 1 | 2 | 'draw', board: any } }
  | { type: 'OPPONENT_DISCONNECTED' }
  | { type: 'ERROR', payload: { message: string } };
