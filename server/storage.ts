import { games, type Game, type InsertGame } from "@shared/schema";

export interface IStorage {
  // Queue operations
  addToQueue(userId: string, gameType: string): void;
  removeFromQueue(userId: string): void;
  findMatch(gameType: string): { p1: string; p2: string } | null;
  
  // Game operations
  createGame(p1: string, p2: string, gameType: string, isCpu?: boolean, difficulty?: string): Promise<Game>;
  getGame(gameId: number): Promise<Game | undefined>;
  updateGame(gameId: number, board: any, turn: string, status: string, winnerId?: string | null): Promise<Game>;
  
  // Helpers
  getGameByPlayer(userId: string): Promise<Game | undefined>;
}

export class MemStorage implements IStorage {
  private queues: Map<string, Set<string>> = new Map();
  private activeGames: Map<number, Game> = new Map();
  private gameIdCounter = 1;

  addToQueue(userId: string, gameType: string): void {
    if (!this.queues.has(gameType)) {
      this.queues.set(gameType, new Set());
    }
    this.queues.get(gameType)!.add(userId);
  }

  removeFromQueue(userId: string): void {
    for (const queue of this.queues.values()) {
      queue.delete(userId);
    }
  }

  findMatch(gameType: string): { p1: string; p2: string } | null {
    const queue = this.queues.get(gameType);
    if (queue && queue.size >= 2) {
      const it = queue.values();
      const p1 = it.next().value;
      const p2 = it.next().value;
      if (p1 && p2) {
        queue.delete(p1);
        queue.delete(p2);
        return { p1, p2 };
      }
    }
    return null;
  }

  private createInitialBoard(gameType: string): any {
    if (gameType === 'checkers') {
      // 8x8 checkers board
      // 0: empty, 1: red, 2: black, 11: red king, 22: black king
      return Array(8).fill(null).map((_, r) => 
        Array(8).fill(null).map((_, c) => {
          if ((r + c) % 2 === 1) {
            if (r < 3) return 2; // Black pieces at top
            if (r > 4) return 1; // Red pieces at bottom
          }
          return 0;
        })
      );
    } else if (gameType === 'chess') {
      // 8x8 chess board
      // Pieces: P=pawn, R=rook, N=knight, B=bishop, Q=queen, K=king
      // Case: Upper = white (player 1), Lower = black (player 2)
      const backRank1 = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
      const backRank2 = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
      return Array(8).fill(null).map((_, r) => 
        Array(8).fill(null).map((_, c) => {
          if (r === 0) return backRank2[c]; // Black back rank
          if (r === 1) return 'p';           // Black pawns
          if (r === 6) return 'P';           // White pawns
          if (r === 7) return backRank1[c]; // White back rank
          return '';
        })
      );
    }
    // Default Connect 4: 6 rows, 7 cols
    return Array(6).fill(null).map(() => Array(7).fill(0));
  }

  async createGame(p1: string, p2: string, gameType: string, isCpu: boolean = false, difficulty: string = 'easy'): Promise<Game> {
    const id = this.gameIdCounter++;
    const board = this.createInitialBoard(gameType);

    const game: Game = {
      id,
      gameType,
      player1Id: p1,
      player2Id: p2,
      board,
      turn: 'player1',
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

  async updateGame(gameId: number, board: any, turn: string, status: string, winnerId: string | null = null): Promise<Game> {
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
