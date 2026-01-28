import { games, leaderboards, type Game, type InsertGame, type Leaderboard } from "@shared/schema";

export interface IStorage {
  // Queue operations
  addToQueue(userId: string, gameType: string): void;
  removeFromQueue(userId: string): void;
  findMatch(gameType: string): { p1: string; p2: string } | null;
  
  // Game operations
  createGame(p1: string, p2: string, gameType: string, isCpu?: boolean, difficulty?: string): Promise<Game>;
  getGame(gameId: number): Promise<Game | undefined>;
  updateGame(gameId: number, board: any, turn: string, status: string, winnerId?: string | null): Promise<Game>;
  
  // Leaderboard operations
  getLeaderboard(gameType: string): Promise<Leaderboard[]>;
  updateLeaderboard(userId: string, gameType: string, result: 'win' | 'loss' | 'draw'): Promise<void>;

  // Helpers
  getGameByPlayer(userId: string): Promise<Game | undefined>;
}

export class MemStorage implements IStorage {
  private queues: Map<string, Set<string>> = new Map();
  private activeGames: Map<number, Game> = new Map();
  private gameIdCounter = 1;
  private leaderboardData: Leaderboard[] = []; // In-memory for now to match MemStorage pattern, but we have the table

  addToQueue(userId: string, gameType: string): void {
    if (!this.queues.has(gameType)) {
      this.queues.set(gameType, new Set());
    }
    this.queues.get(gameType)!.add(userId);
  }

  removeFromQueue(userId: string): void {
    this.queues.forEach(queue => {
      queue.delete(userId);
    });
  }

  findMatch(gameType: string): { p1: string; p2: string } | null {
    const queue = this.queues.get(gameType);
    if (queue && queue.size >= 2) {
      const values = Array.from(queue.values());
      const p1 = values[0];
      const p2 = values[1];
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
      return Array(8).fill(null).map((_, r) => 
        Array(8).fill(null).map((_, c) => {
          if ((r + c) % 2 === 1) {
            if (r < 3) return 2;
            if (r > 4) return 1;
          }
          return 0;
        })
      );
    } else if (gameType === 'chess') {
      const backRank1 = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
      const backRank2 = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
      return Array(8).fill(null).map((_, r) => 
        Array(8).fill(null).map((_, c) => {
          if (r === 0) return backRank2[c];
          if (r === 1) return 'p';
          if (r === 6) return 'P';
          if (r === 7) return backRank1[c];
          return '';
        })
      );
    } else if (gameType === 'mancala') {
      return [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
    } else if (gameType === 'poker') {
      return {
        playerHand: [],
        communityCards: [],
        playerChips: 1000,
        cpuChips: 1000,
        pot: 0,
        currentBet: 0,
        phase: 'preflop',
        turn: 1
      };
    }
    return Array(6).fill(null).map(() => Array(7).fill(0));
  }

  async createGame(p1: string, p2: string, gameType: string, isCpu: boolean = false, difficulty: string = 'easy', initialBoard?: any): Promise<Game> {
    const id = this.gameIdCounter++;
    const board = initialBoard || this.createInitialBoard(gameType);

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
      difficulty,
      metadata: gameType === 'chess' ? { 
        castlingRights: { wK: true, wQ: true, bK: true, bQ: true },
        enPassant: null 
      } : {}
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

  async getLeaderboard(gameType: string): Promise<Leaderboard[]> {
    return this.leaderboardData
      .filter(l => l.gameType === gameType)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10);
  }

  async updateLeaderboard(userId: string, gameType: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    let entry = this.leaderboardData.find(l => l.userId === userId && l.gameType === gameType);
    if (!entry) {
      entry = { id: this.leaderboardData.length + 1, userId, gameType, wins: 0, losses: 0, draws: 0 };
      this.leaderboardData.push(entry);
    }
    if (result === 'win') entry.wins++;
    else if (result === 'loss') entry.losses++;
    else entry.draws++;
  }
}

export const storage = new MemStorage();
