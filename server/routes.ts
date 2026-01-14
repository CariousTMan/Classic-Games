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

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Create WebSocket Server attached to the HTTP server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Map to store connected clients: userId -> WebSocket
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws) => {
    // Assign a temporary ID for this session
    const userId = randomUUID();
    clients.set(userId, ws);

    console.log(`User connected: ${userId}`);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WsMessage;

        if (message.type === WS_MESSAGES.JOIN_QUEUE) {
          storage.addToQueue(userId);
          
          // Check for match
          const match = storage.findMatch();
          if (match) {
            const game = await storage.createGame(match.p1, match.p2);
            
            // Notify Player 1
            const p1Ws = clients.get(match.p1);
            if (p1Ws && p1Ws.readyState === WebSocket.OPEN) {
              p1Ws.send(JSON.stringify({
                type: WS_MESSAGES.MATCH_FOUND,
                payload: { gameId: game.id, opponentId: match.p2, yourColor: 1 }
              }));
            }

            // Notify Player 2
            const p2Ws = clients.get(match.p2);
            if (p2Ws && p2Ws.readyState === WebSocket.OPEN) {
              p2Ws.send(JSON.stringify({
                type: WS_MESSAGES.MATCH_FOUND,
                payload: { gameId: game.id, opponentId: match.p1, yourColor: 2 }
              }));
            }
          }
        } 
        else if (message.type === WS_MESSAGES.MAKE_MOVE) {
          const { gameId, column } = message.payload;
          const game = await storage.getGame(gameId);
          
          if (!game || game.status !== 'playing') {
            ws.send(JSON.stringify({ type: WS_MESSAGES.ERROR, payload: { message: "Invalid game" } }));
            return;
          }

          // Validate Turn
          const isPlayer1 = game.player1Id === userId;
          const isPlayer2 = game.player2Id === userId;
          
          if (!isPlayer1 && !isPlayer2) return; // Not in this game

          if ((isPlayer1 && game.turn !== 'player1') || (isPlayer2 && game.turn !== 'player2')) {
            ws.send(JSON.stringify({ type: WS_MESSAGES.ERROR, payload: { message: "Not your turn" } }));
            return;
          }

          // Validate Move
          if (column < 0 || column >= 7) return;

          // Find first empty row in column (from bottom up)
          let row = 5;
          while (row >= 0 && game.board[row][column] !== 0) {
            row--;
          }

          if (row < 0) {
            ws.send(JSON.stringify({ type: WS_MESSAGES.ERROR, payload: { message: "Column full" } }));
            return;
          }

          // Apply Move
          const playerNum = isPlayer1 ? 1 : 2;
          const newBoard = game.board.map(r => [...r]);
          newBoard[row][column] = playerNum;

          // Check Win
          let status = 'playing';
          let winnerId = null;
          let turn = game.turn === 'player1' ? 'player2' : 'player1';

          if (checkWin(newBoard, playerNum)) {
            status = 'finished';
            winnerId = userId;
          } else {
            // Check Draw (Board full)
            const isFull = newBoard[0].every(cell => cell !== 0);
            if (isFull) {
              status = 'finished';
              winnerId = 'draw';
            }
          }

          // Update Game
          await storage.updateGame(gameId, newBoard, turn, status, winnerId);

          // Broadcast Update
          const p1Ws = clients.get(game.player1Id);
          const p2Ws = clients.get(game.player2Id);
          
          const updateMsg = JSON.stringify({
            type: WS_MESSAGES.GAME_UPDATE,
            payload: { board: newBoard, turn: turn === 'player1' ? 1 : 2 }
          });

          if (p1Ws?.readyState === WebSocket.OPEN) p1Ws.send(updateMsg);
          if (p2Ws?.readyState === WebSocket.OPEN) p2Ws.send(updateMsg);

          // If Game Over, send Game Over message
          if (status === 'finished') {
             const gameOverMsg = JSON.stringify({
              type: WS_MESSAGES.GAME_OVER,
              payload: { winner: winnerId === 'draw' ? 'draw' : playerNum, board: newBoard }
            });
            if (p1Ws?.readyState === WebSocket.OPEN) p1Ws.send(gameOverMsg);
            if (p2Ws?.readyState === WebSocket.OPEN) p2Ws.send(gameOverMsg);
          }
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });

    ws.on('close', async () => {
      clients.delete(userId);
      storage.removeFromQueue(userId);
      
      // Handle active game disconnection
      const game = await storage.getGameByPlayer(userId);
      if (game) {
        // Notify opponent
        const opponentId = game.player1Id === userId ? game.player2Id : game.player1Id;
        const opponentWs = clients.get(opponentId);
        if (opponentWs?.readyState === WebSocket.OPEN) {
          opponentWs.send(JSON.stringify({ type: WS_MESSAGES.OPPONENT_DISCONNECTED }));
        }
        // Mark game as aborted/finished?
        storage.updateGame(game.id, game.board, game.turn, 'aborted');
      }
    });
  });

  return httpServer;
}
