import type { Express } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { WS_MESSAGES, type WsMessage } from "@shared/schema";
import { randomUUID } from "crypto";

// Helper to check for a win (Connect 4)
function checkWinConnect4(board: number[][], player: number): boolean {
  const rows = board.length;
  const cols = board[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 3; c++) {
      if (board[r][c] === player && board[r][c+1] === player && board[r][c+2] === player && board[r][c+3] === player) return true;
    }
  }
  for (let r = 0; r < rows - 3; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === player && board[r+1][c] === player && board[r+2][c] === player && board[r+3][c] === player) return true;
    }
  }
  for (let r = 3; r < rows; r++) {
    for (let c = 0; c < cols - 3; c++) {
      if (board[r][c] === player && board[r-1][c+1] === player && board[r-2][c+2] === player && board[r-3][c+3] === player) return true;
    }
  }
  for (let r = 0; r < rows - 3; r++) {
    for (let c = 0; c < cols - 3; c++) {
      if (board[r][c] === player && board[r+1][c+1] === player && board[r+2][c+2] === player && board[r+3][c+3] === player) return true;
    }
  }
  return false;
}

// Simple CPU logic for Connect 4
function getConnect4CpuMove(board: number[][], difficulty: string): number {
  const cols = board[0].length;
  const validCols = [];
  for (let c = 0; c < cols; c++) if (board[0][c] === 0) validCols.push(c);
  if (difficulty === 'easy' || validCols.length === 0) return validCols[Math.floor(Math.random() * validCols.length)];
  for (const player of [2, 1]) {
    for (const c of validCols) {
      let r = board.length - 1;
      while (r >= 0 && board[r][c] !== 0) r--;
      if (r >= 0) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[r][c] = player;
        if (checkWinConnect4(tempBoard, player)) return c;
      }
    }
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
          const gameType = (message as any).payload?.gameType || 'connect4';
          storage.addToQueue(userId, gameType);
          const match = storage.findMatch(gameType);
          if (match) {
            const game = await storage.createGame(match.p1, match.p2, gameType);
            [match.p1, match.p2].forEach((pId, idx) => {
              const pWs = clients.get(pId);
              if (pWs?.readyState === WebSocket.OPEN) {
                pWs.send(JSON.stringify({
                  type: WS_MESSAGES.MATCH_FOUND,
                  payload: { gameId: game.id, gameType, opponentId: idx === 0 ? match.p2 : match.p1, yourColor: idx + 1 }
                }));
              }
            });
          }
        } 
        else if (message.type === WS_MESSAGES.START_CPU_GAME) {
          const game = await storage.createGame(userId, 'cpu', message.payload.gameType, true, message.payload.difficulty);
          ws.send(JSON.stringify({
            type: WS_MESSAGES.MATCH_FOUND,
            payload: { gameId: game.id, gameType: message.payload.gameType, opponentId: 'cpu', yourColor: 1 }
          }));
        }
        else if (message.type === WS_MESSAGES.MAKE_MOVE) {
          const { gameId, move } = message.payload;
          const game = await storage.getGame(gameId);
          if (!game || game.status !== 'playing') return;

          const isPlayer1 = game.player1Id === userId;
          const isPlayer2 = game.player2Id === userId;
          if (!isPlayer1 && !isPlayer2) return;
          if ((isPlayer1 && game.turn !== 'player1') || (isPlayer2 && game.turn !== 'player2')) return;

          if (game.gameType === 'connect4') {
            const column = move;
            const board = game.board as number[][];
            let r = board.length - 1;
            while (r >= 0 && board[r][column] !== 0) r--;
            if (r < 0) return;

            const playerNum = isPlayer1 ? 1 : 2;
            const newBoard = board.map(row => [...row]);
            newBoard[r][column] = playerNum;

            let status = 'playing';
            let winnerId = null;
            if (checkWinConnect4(newBoard, playerNum)) {
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
              setTimeout(async () => {
                const cpuCol = getConnect4CpuMove(newBoard, game.difficulty || 'easy');
                let cr = newBoard.length - 1;
                while (cr >= 0 && newBoard[cr][cpuCol] !== 0) cr--;
                newBoard[cr][cpuCol] = 2;
                let cStatus = 'playing';
                let cWinnerId = null;
                if (checkWinConnect4(newBoard, 2)) {
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
          } else if (game.gameType === 'checkers') {
            // Checkers logic: Simplified for now - accept the move if it's a valid diagonal move
            const { from, to } = move;
            const board = game.board as number[][];
            const piece = board[from.r][from.c];
            
            // Apply move and potential capture
            const newBoard = board.map(row => [...row]);
            newBoard[to.r][to.c] = piece;
            newBoard[from.r][from.c] = 0;
            
            // Check for capture
            if (Math.abs(to.r - from.r) === 2) {
              const midR = (from.r + to.r) / 2;
              const midC = (from.c + to.c) / 2;
              newBoard[midR][midC] = 0;
            }
            
            // King promotion
            if (piece === 1 && to.r === 0) newBoard[to.r][to.c] = 11;
            if (piece === 2 && to.r === 7) newBoard[to.r][to.c] = 22;
            
            let turn = game.turn === 'player1' ? 'player2' : 'player1';
            await storage.updateGame(gameId, newBoard, turn, 'playing', null);
            
            const notify = (msg: string) => {
              const p1 = clients.get(game.player1Id);
              const p2 = clients.get(game.player2Id);
              if (p1?.readyState === WebSocket.OPEN) p1.send(msg);
              if (p2?.readyState === WebSocket.OPEN) p2.send(msg);
            };
            
            notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: newBoard, turn: turn === 'player1' ? 1 : 2 } }));
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
        if (opponentWs?.readyState === WebSocket.OPEN) opponentWs.send(JSON.stringify({ type: WS_MESSAGES.OPPONENT_DISCONNECTED }));
        storage.updateGame(game.id, game.board, game.turn, 'aborted');
      }
    });
  });

  return httpServer;
}
