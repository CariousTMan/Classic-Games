import { games, type Game, type InsertGame } from "@shared/schema";

export interface IStorage {
  // Queue operations
  addToQueue(userId: string): void;
  removeFromQueue(userId: string): void;
  findMatch(): { p1: string; p2: string } | null;
  
  // Game operations
  createGame(p1: string, p2: string, isCpu?: boolean, difficulty?: string): Promise<Game>;
  getGame(gameId: number): Promise<Game | undefined>;
  updateGame(gameId: number, board: number[][], turn: string, status: string, winnerId?: string | null): Promise<Game>;
  
  // Helpers
  getGameByPlayer(userId: string): Promise<Game | undefined>;
}

export class MemStorage implements IStorage {
  private queue: Set<string> = new Set();
  private activeGames: Map<number, Game> = new Map();
  private gameIdCounter = 1;

  addToQueue(userId: string): void {
    this.queue.add(userId);
  }

  removeFromQueue(userId: string): void {
    this.queue.delete(userId);
  }

  findMatch(): { p1: string; p2: string } | null {
    if (this.queue.size >= 2) {
      const it = this.queue.values();
      const p1 = it.next().value;
      const p2 = it.next().value;
      this.queue.delete(p1);
      this.queue.delete(p2);
      return { p1, p2 };
    }
    return null;
  }

  async createGame(p1: string, p2: string, isCpu: boolean = false, difficulty: string = 'easy'): Promise<Game> {
    const id = this.gameIdCounter++;
    // 6 rows, 7 cols
    const board = Array(6).fill(null).map(() => Array(7).fill(0));
    const game: Game = {
      id,
      player1Id: p1,
      player2Id: p2,
      board,
      turn: 'player1', // p1 starts
      status: 'playing',
      winnerId: null,
      isCpu,
      difficulty
    };
    this.activeGames.set(id, game);
    return game;
  }

  async getGame(gameId: number): Promise<Game | undefined> {
    return this.activeGames.get(gameId);
  }

  async updateGame(gameId: number, board: number[][], turn: string, status: string, winnerId: string | null = null): Promise<Game> {
    const game = this.activeGames.get(gameId);
    if (!game) throw new Error("Game not found");
    
    const updatedGame = { ...game, board, turn, status, winnerId };
    this.activeGames.set(gameId, updatedGame);
    return updatedGame;
  }

  async getGameByPlayer(userId: string): Promise<Game | undefined> {
    return Array.from(this.activeGames.values()).find(g => 
      (g.player1Id === userId || g.player2Id === userId) && g.status === 'playing'
    );
  }
}

export const storage = new MemStorage();
