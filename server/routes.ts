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

// Checkers Logic Helpers
function isValidCheckersMove(board: number[][], from: { r: number, c: number }, to: { r: number, c: number }, playerNum: number): { valid: boolean, captured?: { r: number, c: number } } {
  const piece = board[from.r][from.c];
  if (piece === 0 || piece % 10 !== playerNum) return { valid: false };
  if (board[to.r][to.c] !== 0) return { valid: false };
  if ((to.r + to.c) % 2 === 0) return { valid: false };

  const dr = to.r - from.r;
  const dc = Math.abs(to.c - from.c);
  const isKing = piece > 10;

  if (Math.abs(dr) === 1 && dc === 1) {
    if (!isKing && (playerNum === 1 ? dr > 0 : dr < 0)) return { valid: false };
    return { valid: true };
  }

  if (Math.abs(dr) === 2 && dc === 2) {
    if (!isKing && (playerNum === 1 ? dr > 0 : dr < 0)) return { valid: false };
    const midR = from.r + dr / 2;
    const midC = from.c + (to.c - from.c) / 2;
    const midPiece = board[midR][midC];
    if (midPiece !== 0 && midPiece % 10 !== playerNum) {
      return { valid: true, captured: { r: midR, c: midC } };
    }
  }

  return { valid: false };
}

function getValidCheckersMoves(board: number[][], playerNum: number) {
  const moves = [];
  const jumps = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] % 10 === playerNum) {
        for (const dr of [-1, 1, -2, 2]) {
          for (const dc of [-1, 1, -2, 2]) {
            if (Math.abs(dr) !== Math.abs(dc)) continue;
            const tr = r + dr;
            const tc = c + dc;
            if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
              const res = isValidCheckersMove(board, { r, c }, { r: tr, c: tc }, playerNum);
              if (res.valid) {
                if (res.captured) jumps.push({ from: { r, c }, to: { r: tr, c: tc }, captured: res.captured });
                else moves.push({ from: { r, c }, to: { r: tr, c: tc } });
              }
            }
          }
        }
      }
    }
  }
  return jumps.length > 0 ? jumps : moves;
}

function checkWinCheckers(board: number[][], nextPlayerNum: number): number | 'draw' | null {
  const moves = getValidCheckersMoves(board, nextPlayerNum);
  if (moves.length === 0) return nextPlayerNum === 1 ? 2 : 1;
  return null;
}

function getCheckersCpuMove(board: number[][], difficulty: string): any {
  const moves = getValidCheckersMoves(board, 2);
  if (moves.length === 0) return null;
  if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];
  const jumps = moves.filter((m: any) => m.captured);
  if (jumps.length > 0) return jumps[Math.floor(Math.random() * jumps.length)];
  return moves[Math.floor(Math.random() * moves.length)];
}

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

// Mancala Logic Helpers
function isValidMancalaMove(board: number[], pitIndex: number, playerNum: number): boolean {
  if (playerNum === 1) return pitIndex >= 0 && pitIndex <= 5 && board[pitIndex] > 0;
  if (playerNum === 2) return pitIndex >= 7 && pitIndex <= 12 && board[pitIndex] > 0;
  return false;
}

function makeMancalaMove(board: number[], pitIndex: number, playerNum: number): { board: number[], nextTurn: number, gameOver: boolean } {
  let seeds = board[pitIndex];
  const newBoard = [...board];
  newBoard[pitIndex] = 0;
  
  let currentPit = pitIndex;
  while (seeds > 0) {
    currentPit = (currentPit + 1) % 14;
    if (playerNum === 1 && currentPit === 13) continue;
    if (playerNum === 2 && currentPit === 6) continue;
    
    newBoard[currentPit]++;
    seeds--;

    if (seeds === 0 && newBoard[currentPit] > 1) {
      const isStore = currentPit === 6 || currentPit === 13;
      if (!isStore) {
        seeds = newBoard[currentPit];
        newBoard[currentPit] = 0;
      }
    }
  }
  
  let nextTurn = playerNum === 1 ? 2 : 1;
  if (playerNum === 1 && currentPit === 6) nextTurn = 1;
  if (playerNum === 2 && currentPit === 13) nextTurn = 2;
  
  const p1Empty = newBoard.slice(0, 6).every(p => p === 0);
  const p2Empty = newBoard.slice(7, 13).every(p => p === 0);
  let gameOver = false;
  if (p1Empty || p2Empty) {
    gameOver = true;
    for (let i = 0; i < 6; i++) { newBoard[6] += newBoard[i]; newBoard[i] = 0; }
    for (let i = 7; i < 13; i++) { newBoard[13] += newBoard[i]; newBoard[i] = 0; }
  }
  
  return { board: newBoard, nextTurn, gameOver };
}

function getMancalaCpuMove(board: number[]): number {
  const validPits = [];
  for (let i = 7; i <= 12; i++) if (board[i] > 0) validPits.push(i);
  return validPits[Math.floor(Math.random() * validPits.length)];
}

// Poker Logic Helpers
type PokerCard = { suit: string, rank: string, value: number };

function evaluatePokerHand(hand: PokerCard[], community: PokerCard[]): number {
  const allCards = [...hand, ...community];
  const rankValues = allCards.map(c => c.value).sort((a, b) => b - a);
  const suits = allCards.map(c => c.suit);
  
  const suitCounts: any = {};
  suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
  const isFlush = Object.values(suitCounts).some((count: any) => count >= 5);
  
  const uniqueRanks = Array.from(new Set(rankValues)).sort((a, b) => b - a);
  let isStraight = false;
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i] - uniqueRanks[i+4] === 4) isStraight = true;
  }

  if (isFlush && isStraight) return 1000 + rankValues[0];
  if (isFlush) return 500 + rankValues[0];
  if (isStraight) return 400 + rankValues[0];
  
  const counts: any = {};
  rankValues.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const values = Object.values(counts) as number[];
  if (values.includes(4)) return 800 + rankValues[0];
  if (values.includes(3) && values.includes(2)) return 700 + rankValues[0];
  if (values.includes(3)) return 300 + rankValues[0];
  if (values.filter(v => v === 2).length >= 2) return 200 + rankValues[0];
  if (values.includes(2)) return 100 + rankValues[0];

  return rankValues[0];
}

function getPokerCpuAction(board: any): { action: 'fold' | 'check' | 'call' | 'bet', amount?: number } {
  const cpuScore = evaluatePokerHand(board.cpuHand, board.communityCards);
  const playerScore = evaluatePokerHand(board.playerHand, board.communityCards);
  if (cpuScore > playerScore + 5) return { action: 'bet', amount: 50 };
  if (cpuScore > playerScore - 5) return { action: 'call' };
  if (Math.random() > 0.8) return { action: 'bet', amount: 25 };
  return { action: 'check' };
}

type BlackjackCard = { suit: string, rank: string, value: number };
function createDeck(): BlackjackCard[] {
  const suits = ['♠', '♣', '♥', '♦'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: BlackjackCard[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      let value = parseInt(rank);
      if (['J', 'Q', 'K'].includes(rank)) value = 10;
      if (rank === 'A') value = 11;
      deck.push({ suit, rank, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function calculateBlackjackScore(hand: BlackjackCard[]): number {
  let score = hand.reduce((sum, card) => sum + card.value, 0);
  let aces = hand.filter(c => c.rank === 'A').length;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function isValidChessMove(board: string[][], from: { r: number, c: number }, to: { r: number, c: number }, playerNum: number, metadata: any = {}): { valid: boolean, castling?: 'K' | 'Q' } {
  const piece = board[from.r][from.c];
  if (piece === '') return { valid: false };
  const isWhite = piece === piece.toUpperCase();
  if (playerNum === 1 && !isWhite) return { valid: false };
  if (playerNum === 2 && isWhite) return { valid: false };
  const targetPiece = board[to.r][to.c];
  if (targetPiece !== '') {
    const isTargetWhite = targetPiece === targetPiece.toUpperCase();
    if (isWhite === isTargetWhite) return { valid: false };
  }
  const dr = to.r - from.r;
  const dc = to.c - from.c;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);
  const type = piece.toUpperCase();
  switch (type) {
    case 'P':
      const direction = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;
      if (dc === 0 && targetPiece === '') {
        if (dr === direction) return { valid: true };
        if (from.r === startRow && dr === 2 * direction && board[from.r + direction][from.c] === '') return { valid: true };
      }
      if (absDc === 1 && dr === direction && targetPiece !== '') return { valid: true };
      return { valid: false };
    case 'R':
      if (dr !== 0 && dc !== 0) return { valid: false };
      return { valid: isPathClear(board, from, to) };
    case 'N':
      return { valid: (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2) };
    case 'B':
      if (absDr !== absDc) return { valid: false };
      return { valid: isPathClear(board, from, to) };
    case 'Q':
      if (absDr !== absDc && dr !== 0 && dc !== 0) return { valid: false };
      return { valid: isPathClear(board, from, to) };
    case 'K':
      if (dr === 0 && absDc === 2) {
        const rights = metadata?.castlingRights || { wK: true, wQ: true, bK: true, bQ: true };
        const r = from.r;
        if (isWhite && r === 7) {
          if (to.c === 6 && rights.wK && board[r][5] === '' && board[r][6] === '' && board[r][7] === 'R') return { valid: true, castling: 'K' };
          if (to.c === 2 && rights.wQ && board[r][1] === '' && board[r][2] === '' && board[r][3] === '' && board[r][0] === 'R') return { valid: true, castling: 'Q' };
        } else if (!isWhite && r === 0) {
          if (to.c === 6 && rights.bK && board[r][5] === '' && board[r][6] === '' && board[r][7] === 'r') return { valid: true, castling: 'K' };
          if (to.c === 2 && rights.bQ && board[r][1] === '' && board[r][2] === '' && board[r][3] === '' && board[r][0] === 'r') return { valid: true, castling: 'Q' };
        }
      }
      return { valid: absDr <= 1 && absDc <= 1 };
  }
  return { valid: false };
}

function isPathClear(board: string[][], from: { r: number, c: number }, to: { r: number, c: number }): boolean {
  const dr = Math.sign(to.r - from.r);
  const dc = Math.sign(to.c - from.c);
  let currR = from.r + dr;
  let currC = from.c + dc;
  while (currR !== to.r || currC !== to.c) {
    if (board[currR][currC] !== '') return false;
    currR += dr;
    currC += dc;
  }
  return true;
}

function getChessCpuMove(board: string[][], metadata: any = {}): any {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece !== '' && piece === piece.toLowerCase()) {
        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            const res = isValidChessMove(board, { r, c }, { r: tr, c: tc }, 2, metadata);
            if (res.valid) moves.push({ from: { r, c }, to: { r: tr, c: tc }, castling: res.castling });
          }
        }
      }
    }
  }
  if (moves.length === 0) return null;
  const captures = moves.filter(m => board[m.to.r][m.to.c] !== '');
  return captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)] : moves[Math.floor(Math.random() * moves.length)];
}

function isSquareAttacked(board: string[][], r: number, c: number, attackerPlayerNum: number): boolean {
  for (let ir = 0; ir < 8; ir++) {
    for (let ic = 0; ic < 8; ic++) {
      const piece = board[ir][ic];
      if (piece !== '') {
        const isWhite = piece === piece.toUpperCase();
        const piecePlayer = isWhite ? 1 : 2;
        if (piecePlayer === attackerPlayerNum) {
          if (isValidChessMove(board, { r: ir, c: ic }, { r, c }, attackerPlayerNum).valid) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function findKing(board: string[][], playerNum: number): { r: number, c: number } | null {
  const kingChar = playerNum === 1 ? 'K' : 'k';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === kingChar) return { r, c };
    }
  }
  return null;
}

function isInCheck(board: string[][], playerNum: number): boolean {
  const kingPos = findKing(board, playerNum);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos.r, kingPos.c, playerNum === 1 ? 2 : 1);
}

function hasLegalMoves(board: string[][], playerNum: number, metadata: any): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece === '') continue;
      const isWhite = piece === piece.toUpperCase();
      if ((playerNum === 1 && isWhite) || (playerNum === 2 && !isWhite)) {
        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            const moveRes = isValidChessMove(board, { r, c }, { r: tr, c: tc }, playerNum, metadata);
            if (moveRes.valid) {
              const tempBoard = board.map(row => [...row]);
              tempBoard[tr][tc] = tempBoard[r][c];
              tempBoard[r][c] = '';
              if (moveRes.castling) {
                const row = r;
                if (moveRes.castling === 'K') { tempBoard[row][5] = tempBoard[row][7]; tempBoard[row][7] = ''; }
                else { tempBoard[row][3] = tempBoard[row][0]; tempBoard[row][0] = ''; }
              }
              if (!isInCheck(tempBoard, playerNum)) return true;
            }
          }
        }
      }
    }
  }
  return false;
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
          let bjBoard: any = null;
          if (message.payload.gameType === 'blackjack') {
            const deck = createDeck();
            bjBoard = {
              playerHand: [deck.pop()!, deck.pop()!],
              dealerHand: [deck.pop()!],
              deck: deck
            };
          }
          const game = await storage.createGame(userId, 'cpu', message.payload.gameType, true, message.payload.difficulty);
          if (bjBoard) {
            await storage.updateGame(game.id, bjBoard, game.turn, game.status, game.winnerId);
          }
          ws.send(JSON.stringify({
            type: WS_MESSAGES.MATCH_FOUND,
            payload: { gameId: game.id, gameType: message.payload.gameType, opponentId: 'cpu', yourColor: 1, board: bjBoard }
          }));
        }
        else if (message.type === 'POKER_ACTION') {
          const { action, amount, gameId } = message.payload;
          const game = await storage.getGame(gameId);
          if (!game || game.status !== 'playing' || game.gameType !== 'poker') return;

          const board = game.board as any;
          if (board.turn !== (game.player1Id === userId ? 1 : 2)) return;

          const newBoard = { ...board };
          let gameOver = false;
          let winnerNum: 1 | 2 | 'draw' | null = null;

          const notify = (msg: string) => {
            const p1 = clients.get(game.player1Id);
            const p2 = clients.get(game.player2Id);
            if (p1?.readyState === WebSocket.OPEN) p1.send(msg);
            if (p2?.readyState === WebSocket.OPEN) p2.send(msg);
          };

          if (action === 'fold') {
            gameOver = true;
            winnerNum = board.turn === 1 ? 2 : 1;
          } else {
            if (action === 'bet' && amount) {
              const diff = amount;
              newBoard.currentBet = (newBoard.currentBet || 0) + diff;
              newBoard.pot += diff;
              if (board.turn === 1) newBoard.playerChips -= diff;
              else newBoard.cpuChips -= diff;
            } else if (action === 'call') {
              const callAmount = newBoard.currentBet || 0;
              newBoard.pot += callAmount;
              if (board.turn === 1) newBoard.playerChips -= callAmount;
              else newBoard.cpuChips -= callAmount;
              newBoard.currentBet = 0;
            } else if (action === 'check') {
              if (Number(newBoard.currentBet) > 0) {
                return ws.send(JSON.stringify({ type: WS_MESSAGES.ERROR, payload: { message: "Cannot check when there is a bet" } }));
              }
            }

            const isCpuTurn = board.turn === 2;
            let shouldTransition = false;
            if (action === 'call') shouldTransition = true;
            else if (action === 'check' && isCpuTurn) shouldTransition = true;

            if (shouldTransition) {
              if (newBoard.phase === 'flop') {
                newBoard.phase = 'turn';
                newBoard.communityCards.push(newBoard.deck.pop());
                newBoard.currentBet = 0;
              } else if (newBoard.phase === 'turn') {
                newBoard.phase = 'river';
                newBoard.communityCards.push(newBoard.deck.pop());
                newBoard.currentBet = 0;
              } else if (newBoard.phase === 'river') {
                newBoard.phase = 'showdown';
                gameOver = true;
                const pScore = evaluatePokerHand(newBoard.playerHand, newBoard.communityCards);
                const cScore = evaluatePokerHand(newBoard.cpuHand, newBoard.communityCards);
                if (pScore > cScore) winnerNum = 1;
                else if (cScore > pScore) winnerNum = 2;
                else winnerNum = 'draw';
              }
            }
          }

          if (gameOver) {
            const winnerId = winnerNum === 'draw' ? 'draw' : (winnerNum === 1 ? game.player1Id : 'cpu');
            await storage.updateGame(gameId, newBoard, 'player1', 'finished', winnerId);
            notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: newBoard, turn: 1 } }));
            notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: winnerNum, board: newBoard } }));
            if (winnerNum !== 'draw') {
              if (winnerNum === 1) await storage.updateLeaderboard(game.player1Id, 'poker', 'win');
              else await storage.updateLeaderboard(game.player1Id, 'poker', 'loss');
            } else await storage.updateLeaderboard(game.player1Id, 'poker', 'draw');
          } else {
            newBoard.turn = board.turn === 1 ? 2 : 1;
            await storage.updateGame(gameId, newBoard, game.turn, game.status, game.winnerId);
            notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: newBoard, turn: newBoard.turn } }));

            if (game.isCpu && newBoard.turn === 2) {
              setTimeout(async () => {
                const cpuMove = getPokerCpuAction(newBoard);
                if (cpuMove.action === 'fold') {
                  const finalBoard = { ...newBoard, status: 'finished' };
                  await storage.updateGame(gameId, finalBoard, 'player1', 'finished', game.player1Id);
                  notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: finalBoard, turn: 1 } }));
                  notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: 1, board: finalBoard } }));
                  await storage.updateLeaderboard(game.player1Id, 'poker', 'win');
                } else {
                  const finalCpuBoard = { ...newBoard };
                  if (cpuMove.action === 'bet') {
                    finalCpuBoard.currentBet = (finalCpuBoard.currentBet || 0) + (cpuMove.amount || 50);
                    finalCpuBoard.pot += (cpuMove.amount || 50);
                    finalCpuBoard.cpuChips -= (cpuMove.amount || 50);
                  } else if (cpuMove.action === 'call') {
                    const callAmt = finalCpuBoard.currentBet || 0;
                    finalCpuBoard.pot += callAmt;
                    finalCpuBoard.cpuChips -= callAmt;
                    finalCpuBoard.currentBet = 0;
                  }
                  
                  let cpuTransition = (cpuMove.action === 'call' || cpuMove.action === 'check');
                  if (cpuTransition) {
                    if (finalCpuBoard.phase === 'flop') {
                      finalCpuBoard.phase = 'turn';
                      finalCpuBoard.communityCards.push(finalCpuBoard.deck.pop());
                      finalCpuBoard.currentBet = 0;
                    } else if (finalCpuBoard.phase === 'turn') {
                      finalCpuBoard.phase = 'river';
                      finalCpuBoard.communityCards.push(finalCpuBoard.deck.pop());
                      finalCpuBoard.currentBet = 0;
                    } else if (finalCpuBoard.phase === 'river') {
                      finalCpuBoard.phase = 'showdown';
                      const finalWinner = evaluatePokerHand(finalCpuBoard.playerHand, finalCpuBoard.communityCards) > evaluatePokerHand(finalCpuBoard.cpuHand, finalCpuBoard.communityCards) ? 1 : 2;
                      await storage.updateGame(gameId, finalCpuBoard, 'player1', 'finished', finalWinner === 1 ? game.player1Id : 'cpu');
                      notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: finalCpuBoard, turn: 1 } }));
                      notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: finalWinner, board: finalCpuBoard } }));
                      return;
                    }
                  }
                  finalCpuBoard.turn = 1;
                  await storage.updateGame(gameId, finalCpuBoard, 'player1', game.status, game.winnerId);
                  notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: finalCpuBoard, turn: 1 } }));
                }
              }, 1000);
            }
          }
        }
        else if (message.type === WS_MESSAGES.MAKE_MOVE) {
          const { gameId, move } = message.payload;
          const game = await storage.getGame(gameId);
          if (!game || game.status !== 'playing') return;
          const isPlayer1 = game.player1Id === userId;
          const isPlayer2 = game.player2Id === userId;
          if (!isPlayer1 && !isPlayer2) return;
          if ((isPlayer1 && game.turn !== 'player1') || (isPlayer2 && game.turn !== 'player2')) return;
          const notify = (msg: string) => {
            const p1 = clients.get(game.player1Id);
            const p2 = clients.get(game.player2Id);
            if (p1?.readyState === WebSocket.OPEN) p1.send(msg);
            if (p2?.readyState === WebSocket.OPEN) p2.send(msg);
          };
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
              await storage.updateLeaderboard(userId, 'connect4', 'win');
              if (!game.isCpu) {
                const opponentId = isPlayer1 ? game.player2Id : game.player1Id;
                await storage.updateLeaderboard(opponentId, 'connect4', 'loss');
              }
            }
            else if (newBoard[0].every(cell => cell !== 0)) { 
              status = 'finished'; 
              winnerId = 'draw';
              await storage.updateLeaderboard(game.player1Id, 'connect4', 'draw');
              if (!game.isCpu) await storage.updateLeaderboard(game.player2Id, 'connect4', 'draw');
            }
            let turn = game.turn === 'player1' ? 'player2' : 'player1';
            await storage.updateGame(gameId, newBoard, turn, status, winnerId);
            notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: newBoard, turn: turn === 'player1' ? 1 : 2 } }));
            if (status === 'finished') notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: winnerId === 'draw' ? 'draw' : playerNum, board: newBoard } }));
            else if (game.isCpu && turn === 'player2') {
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
                  await storage.updateLeaderboard(userId, 'connect4', 'loss');
                }
                else if (newBoard[0].every((cell: any) => cell !== 0)) { 
                  cStatus = 'finished'; 
                  cWinnerId = 'draw'; 
                  await storage.updateLeaderboard(userId, 'connect4', 'draw');
                }
                await storage.updateGame(gameId, newBoard, 'player1', cStatus, cWinnerId);
                notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: newBoard, turn: 1 } }));
                if (cStatus === 'finished') notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: cWinnerId === 'draw' ? 'draw' : 2, board: newBoard } }));
              }, 500);
            }
          } else if (game.gameType === 'checkers') {
            const { from, to } = move;
            const board = game.board as number[][];
            const playerNum = isPlayer1 ? 1 : 2;
            const res = isValidCheckersMove(board, from, to, playerNum);
            if (!res.valid) { ws.send(JSON.stringify({ type: WS_MESSAGES.ERROR, payload: { message: "Invalid move" } })); return; }
            const newBoard = board.map(row => [...row]);
            const piece = newBoard[from.r][from.c];
            newBoard[to.r][to.c] = piece;
            newBoard[from.r][from.c] = 0;
            if (res.captured) newBoard[res.captured.r][res.captured.c] = 0;
            if (playerNum === 1 && to.r === 0) newBoard[to.r][to.c] = 11;
            if (playerNum === 2 && to.r === 7) newBoard[to.r][to.c] = 22;
            let turn = game.turn === 'player1' ? 'player2' : 'player1';
            let winner = checkWinCheckers(newBoard, turn === 'player1' ? 1 : 2);
            let status = winner ? 'finished' : 'playing';
            if (status === 'finished') {
              if (winner === 'draw') {
                await storage.updateLeaderboard(game.player1Id, 'checkers', 'draw');
                if (!game.isCpu) await storage.updateLeaderboard(game.player2Id, 'checkers', 'draw');
              } else {
                const winUserId = winner === 1 ? game.player1Id : game.player2Id;
                const lossUserId = winner === 1 ? game.player2Id : game.player1Id;
                if (winUserId !== 'cpu') await storage.updateLeaderboard(winUserId, 'checkers', 'win');
                if (lossUserId !== 'cpu') await storage.updateLeaderboard(lossUserId, 'checkers', 'loss');
              }
            }
            await storage.updateGame(gameId, newBoard, turn, status, winner ? (winner === 1 ? game.player1Id : game.player2Id) : null);
            notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: newBoard, turn: turn === 'player1' ? 1 : 2 } }));
            if (status === 'finished') notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: winner === 'draw' ? 'draw' : winner, board: newBoard } }));
            else if (game.isCpu && turn === 'player2') {
              setTimeout(async () => {
                const cpuMove = getCheckersCpuMove(newBoard, game.difficulty || 'easy');
                if (!cpuMove) return;
                const cBoard = newBoard.map(row => [...row]);
                const cPiece = cBoard[cpuMove.from.r][cpuMove.from.c];
                cBoard[cpuMove.to.r][cpuMove.to.c] = cPiece;
                cBoard[cpuMove.from.r][cpuMove.from.c] = 0;
                if (cpuMove.captured) cBoard[cpuMove.captured.r][cpuMove.captured.c] = 0;
                if (cpuMove.to.r === 7) cBoard[cpuMove.to.r][cpuMove.to.c] = 22;
                let cWinner = checkWinCheckers(cBoard, 1);
                let cStatus = cWinner ? 'finished' : 'playing';
                if (cStatus === 'finished') {
                  if (cWinner === 'draw') await storage.updateLeaderboard(game.player1Id, 'checkers', 'draw');
                  else if (cWinner === 1) await storage.updateLeaderboard(game.player1Id, 'checkers', 'win');
                  else await storage.updateLeaderboard(game.player1Id, 'checkers', 'loss');
                }
                await storage.updateGame(gameId, cBoard, 'player1', cStatus, cWinner ? (cWinner === 1 ? game.player1Id : 'cpu') : null);
                notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: cBoard, turn: 1 } }));
                if (cStatus === 'finished') notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: cWinner === 'draw' ? 'draw' : cWinner, board: cBoard } }));
              }, 500);
            }
          } else if (game.gameType === 'blackjack') {
            const board = game.board as { playerHand: BlackjackCard[], dealerHand: BlackjackCard[], deck: BlackjackCard[] };
            const { action } = move;
            let status = 'playing';
            let winnerId = null;
            let turn = game.turn;
            if (action === 'hit') {
              board.playerHand.push(board.deck.pop()!);
              if (calculateBlackjackScore(board.playerHand) > 21) {
                status = 'finished'; winnerId = 'cpu';
                await storage.updateLeaderboard(userId, 'blackjack', 'loss');
              }
            } else if (action === 'stand') {
              turn = 'player2';
              while (calculateBlackjackScore(board.dealerHand) < 17) board.dealerHand.push(board.deck.pop()!);
              status = 'finished';
              const pScore = calculateBlackjackScore(board.playerHand);
              const dScore = calculateBlackjackScore(board.dealerHand);
              if (dScore > 21 || pScore > dScore) { winnerId = userId; await storage.updateLeaderboard(userId, 'blackjack', 'win'); }
              else if (dScore > pScore) { winnerId = 'cpu'; await storage.updateLeaderboard(userId, 'blackjack', 'loss'); }
              else { winnerId = 'draw'; await storage.updateLeaderboard(userId, 'blackjack', 'draw'); }
            }
            await storage.updateGame(gameId, board, turn, status, winnerId);
            notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board, turn: turn === 'player1' ? 1 : 2 } }));
            if (status === 'finished') notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: winnerId === 'draw' ? 'draw' : (winnerId === userId ? 1 : 2), board } }));
          } else if (game.gameType === 'chess') {
            const { from, to } = move;
            const board = game.board as string[][];
            const playerNum = isPlayer1 ? 1 : 2;
            const newMetadata = { ...(game.metadata as any) || {} };
            if (!newMetadata.castlingRights) newMetadata.castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
            const movingPiece = board[from.r][from.c];
            const moveRes = isValidChessMove(board, from, to, playerNum, newMetadata);
            if (!moveRes.valid) { ws.send(JSON.stringify({ type: WS_MESSAGES.ERROR, payload: { message: "Invalid chess move" } })); return; }
            if (moveRes.castling) {
              if (isInCheck(board, playerNum)) { ws.send(JSON.stringify({ type: WS_MESSAGES.ERROR, payload: { message: "Cannot castle out of check" } })); return; }
              const stepC = moveRes.castling === 'K' ? 5 : 3;
              const stepBoard = board.map(row => [...row]);
              stepBoard[from.r][stepC] = stepBoard[from.r][from.c];
              stepBoard[from.r][from.c] = '';
              if (isInCheck(stepBoard, playerNum)) { ws.send(JSON.stringify({ type: WS_MESSAGES.ERROR, payload: { message: "Cannot castle through check" } })); return; }
            }
            const tempBoard = board.map(row => [...row]);
            tempBoard[to.r][to.c] = tempBoard[from.r][from.c];
            tempBoard[from.r][from.c] = '';
            if (isInCheck(tempBoard, playerNum)) { ws.send(JSON.stringify({ type: WS_MESSAGES.ERROR, payload: { message: "Move would leave king in check" } })); return; }
            const chessBoard = board.map(row => [...row]);
            let pieceToMove = chessBoard[from.r][from.c];
            if (pieceToMove === 'P' && to.r === 0) pieceToMove = 'Q';
            if (pieceToMove === 'p' && to.r === 7) pieceToMove = 'q';
            chessBoard[to.r][to.c] = pieceToMove;
            chessBoard[from.r][from.c] = '';
            if (movingPiece === 'K') { newMetadata.castlingRights.wK = false; newMetadata.castlingRights.wQ = false; }
            if (movingPiece === 'k') { newMetadata.castlingRights.bK = false; newMetadata.castlingRights.bQ = false; }
            if (movingPiece === 'R' && from.r === 7 && from.c === 7) newMetadata.castlingRights.wK = false;
            if (movingPiece === 'R' && from.r === 7 && from.c === 0) newMetadata.castlingRights.wQ = false;
            if (movingPiece === 'r' && from.r === 0 && from.c === 7) newMetadata.castlingRights.bK = false;
            if (movingPiece === 'r' && from.r === 0 && from.c === 0) newMetadata.castlingRights.bQ = false;
            if (moveRes.castling) {
              const r = from.r;
              if (moveRes.castling === 'K') { chessBoard[r][5] = chessBoard[r][7]; chessBoard[r][7] = ''; }
              else if (moveRes.castling === 'Q') { chessBoard[r][3] = chessBoard[r][0]; chessBoard[r][0] = ''; }
            }
            let nextTurn = game.turn === 'player1' ? 'player2' : 'player1';
            const nextPlayerNum = nextTurn === 'player1' ? 1 : 2;
            let status = 'playing';
            let winnerId = null;
            if (!hasLegalMoves(chessBoard, nextPlayerNum, newMetadata)) {
              status = 'finished';
              if (isInCheck(chessBoard, nextPlayerNum)) {
                winnerId = playerNum === 1 ? game.player1Id : game.player2Id;
                if (winnerId !== 'cpu') await storage.updateLeaderboard(winnerId, 'chess', 'win');
                const loserId = playerNum === 1 ? game.player2Id : game.player1Id;
                if (loserId !== 'cpu') await storage.updateLeaderboard(loserId, 'chess', 'loss');
              } else {
                winnerId = 'draw';
                await storage.updateLeaderboard(game.player1Id, 'chess', 'draw');
                if (!game.isCpu) await storage.updateLeaderboard(game.player2Id, 'chess', 'draw');
              }
            }
            await storage.updateGame(gameId, chessBoard, nextTurn, status, winnerId);
            notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: chessBoard, turn: nextPlayerNum } }));
            if (status === 'finished') notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: winnerId === 'draw' ? 'draw' : playerNum, board: chessBoard } }));
            else if (game.isCpu && nextTurn === 'player2') {
              setTimeout(async () => {
                const cpuMove = getChessCpuMove(chessBoard, newMetadata);
                if (!cpuMove) return;
                const cBoard = chessBoard.map(row => [...row]);
                let cPiece = cBoard[cpuMove.from.r][cpuMove.from.c];
                if (cPiece === 'p' && cpuMove.to.r === 7) cPiece = 'q';
                cBoard[cpuMove.to.r][cpuMove.to.c] = cPiece;
                cBoard[cpuMove.from.r][cpuMove.from.c] = '';
                if (cpuMove.castling) {
                  if (cpuMove.castling === 'K') { cBoard[0][5] = cBoard[0][7]; cBoard[0][7] = ''; }
                  else { cBoard[0][3] = cBoard[0][0]; cBoard[0][0] = ''; }
                }
                let cStatus = 'playing';
                let cWinnerId = null;
                if (!hasLegalMoves(cBoard, 1, newMetadata)) {
                  cStatus = 'finished';
                  cWinnerId = isInCheck(cBoard, 1) ? 'cpu' : 'draw';
                  if (cWinnerId === 'cpu') await storage.updateLeaderboard(game.player1Id, 'chess', 'loss');
                  else await storage.updateLeaderboard(game.player1Id, 'chess', 'draw');
                }
                await storage.updateGame(gameId, cBoard, 'player1', cStatus, cWinnerId);
                notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: cBoard, turn: 1 } }));
                if (cStatus === 'finished') notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: cWinnerId === 'draw' ? 'draw' : 2, board: cBoard } }));
              }, 500);
            }
          } else if (game.gameType === 'mancala') {
            const pitIndex = move;
            const playerNum = isPlayer1 ? 1 : 2;
            if (!isValidMancalaMove(game.board as number[], pitIndex, playerNum)) return;
            const { board, nextTurn, gameOver } = makeMancalaMove(game.board as number[], pitIndex, playerNum);
            let status = gameOver ? 'finished' : 'playing';
            let winnerId = null;
            if (gameOver) {
              const p1Score = board[6]; const p2Score = board[13];
              if (p1Score > p2Score) { winnerId = game.player1Id; await storage.updateLeaderboard(game.player1Id, 'mancala', 'win'); if (!game.isCpu) await storage.updateLeaderboard(game.player2Id, 'mancala', 'loss'); }
              else if (p2Score > p1Score) {
                winnerId = game.player2Id;
                if (game.player2Id !== 'cpu') { await storage.updateLeaderboard(game.player2Id, 'mancala', 'win'); await storage.updateLeaderboard(game.player1Id, 'mancala', 'loss'); }
                else await storage.updateLeaderboard(game.player1Id, 'mancala', 'loss');
              } else { winnerId = 'draw'; await storage.updateLeaderboard(game.player1Id, 'mancala', 'draw'); if (!game.isCpu) await storage.updateLeaderboard(game.player2Id, 'mancala', 'draw'); }
            }
            const turnStr = nextTurn === 1 ? 'player1' : 'player2';
            await storage.updateGame(gameId, board, turnStr, status, winnerId);
            notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board, turn: nextTurn } }));
            if (status === 'finished') notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: winnerId === 'draw' ? 'draw' : (winnerId === game.player1Id ? 1 : 2), board } }));
            else if (game.isCpu && nextTurn === 2) {
              const executeCpuMove = async (currentBoard: number[]) => {
                setTimeout(async () => {
                  const cpuMove = getMancalaCpuMove(currentBoard);
                  const { board: cBoard, nextTurn: cNextTurn, gameOver: cGameOver } = makeMancalaMove(currentBoard, cpuMove, 2);
                  let cStatus = cGameOver ? 'finished' : 'playing';
                  let cWinnerId = null;
                  if (cGameOver) {
                    const cp1Score = cBoard[6]; const cp2Score = cBoard[13];
                    if (cp1Score > cp2Score) { cWinnerId = game.player1Id; await storage.updateLeaderboard(game.player1Id, 'mancala', 'win'); }
                    else if (cp2Score > cp1Score) { cWinnerId = 'cpu'; await storage.updateLeaderboard(game.player1Id, 'mancala', 'loss'); }
                    else { cWinnerId = 'draw'; await storage.updateLeaderboard(game.player1Id, 'mancala', 'draw'); }
                  }
                  const cTurnStr = cNextTurn === 1 ? 'player1' : 'player2';
                  await storage.updateGame(gameId, cBoard, cTurnStr, cStatus, cWinnerId);
                  notify(JSON.stringify({ type: WS_MESSAGES.GAME_UPDATE, payload: { board: cBoard, turn: cNextTurn } }));
                  if (cStatus === 'finished') notify(JSON.stringify({ type: WS_MESSAGES.GAME_OVER, payload: { winner: cWinnerId === 'draw' ? 'draw' : (cWinnerId === game.player1Id ? 1 : 2), board: cBoard } }));
                  else if (cNextTurn === 2) executeCpuMove(cBoard);
                }, 500);
              };
              executeCpuMove(board);
            }
          }
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    });

    ws.on('close', () => {
      storage.removeFromQueue(userId);
      clients.delete(userId);
    });
  });

  return httpServer;
}
