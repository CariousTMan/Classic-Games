import type { Express } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { WS_MESSAGES, type WsMessage } from "@shared/schema";
import { randomUUID } from "crypto";

// Helper to check for a win
function checkWin(board: number[][], player: number): boolean {
  const rows = 6;
  const cols = 7;

  // Horizontal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 3; c++) {
      if (board[r][c] === player && board[r][c+1] === player && board[r][c+2] === player && board[r][c+3] === player) {
        return true;
      }
    }
  }

  // Vertical
  for (let r = 0; r < rows - 3; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === player && board[r+1][c] === player && board[r+2][c] === player && board[r+3][c] === player) {
        return true;
      }
    }
  }

  // Diagonal /
  for (let r = 3; r < rows; r++) {
    for (let c = 0; c < cols - 3; c++) {
      if (board[r][c] === player && board[r-1][c+1] === player && board[r-2][c+2] === player && board[r-3][c+3] === player) {
        return true;
      }
    }
  }

  // Diagonal \
  for (let r = 0; r < rows - 3; r++) {
    for (let c = 0; c < cols - 3; c++) {
      if (board[r][c] === player && board[r+1][c+1] === player && board[r+2][c+2] === player && board[r+3][c+3] === player) {
        return true;
      }
    }
  }

  return false;
}

// Simple AI logic
function getCpuMove(board: number[][], difficulty: string): number {
  const cols = 7;
  const validCols = [];
  for (let c = 0; c < cols; c++) {
    if (board[0][c] === 0) validCols.push(c);
  }

  if (difficulty === 'easy') {
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  // Medium: Check if CPU can win in one move, or if it needs to block player
  for (const player of [2, 1]) { // 2 is CPU, 1 is Player
    for (const c of validCols) {
      let r = 5;
      while (r >= 0 && board[r][c] !== 0) r--;
      if (r >= 0) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[r][c] = player;
        if (checkWin(tempBoard, player)) return c;
      }
    }
    if (difficulty === 'medium' && player === 2) break; // Medium only blocks if Hard
  }

  // Hard: (Simplified) Try to win, block, or pick center
  if (difficulty === 'hard') {
    if (validCols.includes(3)) return 3; // Center is strategic
  }

  return validCols[Math.floor(Math.random() * validCols.length)];
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws) => {
    const userId = randomUUID();
    clients.set(userId, ws);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WsMessage;

        if (message.type === WS_MESSAGES.JOIN_QUEUE) {
          storage.addToQueue(userId);
          const match = storage.findMatch();
          if (match) {
            const game = await storage.createGame(match.p1, match.p2);
            [match.p1, match.p2].forEach((pId, idx) => {
              const pWs = clients.get(pId);
              if (pWs?.readyState === WebSocket.OPEN) {
                pWs.send(JSON.stringify({
                  type: WS_MESSAGES.MATCH_FOUND,
                  payload: { gameId: game.id, opponentId: idx === 0 ? match.p2 : match.p1, yourColor: idx + 1 }
                }));
              }
            });
          }
        } 
        else if (message.type === WS_MESSAGES.START_CPU_GAME) {
          const game = await storage.createGame(userId, 'cpu', true, message.payload.difficulty);
          ws.send(JSON.stringify({
            type: WS_MESSAGES.MATCH_FOUND,
            payload: { gameId: game.id, opponentId: 'cpu', yourColor: 1 }
          }));
        }
        else if (message.type === WS_MESSAGES.MAKE_MOVE) {
          const { gameId, column } = message.payload;
          const game = await storage.getGame(gameId);
          if (!game || game.status !== 'playing') return;

          const isPlayer1 = game.player1Id === userId;
          const isPlayer2 = game.player2Id === userId;
          if (!isPlayer1 && !isPlayer2) return;
          if ((isPlayer1 && game.turn !== 'player1') || (isPlayer2 && game.turn !== 'player2')) return;

          // Apply move
          let r = 5;
          while (r >= 0 && game.board[r][column] !== 0) r--;
          if (r < 0) return;

          const playerNum = isPlayer1 ? 1 : 2;
          const newBoard = game.board.map(row => [...row]);
          newBoard[r][column] = playerNum;

          let status = 'playing';
          let winnerId = null;
          if (checkWin(newBoard, playerNum)) {
            status = 'finished';
            winnerId = userId;
          } else if (newBoard[0].every(cell => cell !== 0)) {
            status = 'finished';
            winnerId = 'draw';
          }

          let turn = game.turn === 'player1' ? 'player2' : 'player1';
          await storage.updateGame(gameId, newBoard, turn, status, winnerId);

          const notify = (msg: string) => {
            const p1 = clients.get(game.player1Id);
            const p2 = clients.get(game.player2Id);
            if (p1?.readyState === WebSocket.OPEN) p1.send(msg);
            if (p2?.readyState === WebSocket.OPEN) p2.send(msg);
          };

          notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: newBoard, turn: turn === 'player1' ? 1 : 2 } }));
          if (status === 'finished') {
            notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: winnerId === 'draw' ? 'draw' : playerNum, board: newBoard } }));
          } else if (game.isCpu && turn === 'player2') {
            // CPU Turn
            setTimeout(async () => {
              const cpuCol = getCpuMove(newBoard, game.difficulty || 'easy');
              let cr = 5;
              while (cr >= 0 && newBoard[cr][cpuCol] !== 0) cr--;
              
              newBoard[cr][cpuCol] = 2;
              let cStatus = 'playing';
              let cWinnerId = null;
              if (checkWin(newBoard, 2)) {
                cStatus = 'finished';
                cWinnerId = 'cpu';
              } else if (newBoard[0].every(cell => cell !== 0)) {
                cStatus = 'finished';
                cWinnerId = 'draw';
              }

              await storage.updateGame(gameId, newBoard, 'player1', cStatus, cWinnerId);
              notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: newBoard, turn: 1 } }));
              if (cStatus === 'finished') {
                notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: cWinnerId === 'draw' ? 'draw' : 2, board: newBoard } }));
              }
            }, 500);
          }
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });

    ws.on('close', async () => {
      clients.delete(userId);
      storage.removeFromQueue(userId);
      const game = await storage.getGameByPlayer(userId);
      if (game && !game.isCpu) {
        const opponentId = game.player1Id === userId ? game.player2Id : game.player1Id;
        const opponentWs = clients.get(opponentId);
        if (opponentWs?.readyState === WebSocket.OPEN) {
          opponentWs.send(JSON.stringify({ type: WS_MESSAGES.OPPONENT_DISCONNECTED }));
        }
        storage.updateGame(game.id, game.board, game.turn, 'aborted');
      }
    });
  });

  return httpServer;
}
