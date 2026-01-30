import { useEffect, useRef } from "react";
import { useGameSocket } from "@/hooks/use-game-socket";
import { Board } from "@/components/Board";
import { CheckersBoard } from "@/components/CheckersBoard";
import { ChessBoard } from "@/components/ChessBoard";
import { MancalaBoard } from "@/components/MancalaBoard";
import BlackjackBoard from "@/components/Blackjack";
import PokerBoard from "@/components/Poker";
import { PlayerCard } from "@/components/PlayerCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Trophy, Frown, Gamepad2, Play, SearchX } from "lucide-react";
import confetti from "canvas-confetti";
import { Link, useSearch } from "wouter";

export default function Game() {
  const { connected, gameState, joinQueue, startCpuGame, leaveQueue, makeMove, resetGame, socket } = useGameSocket();
  const { status, board, turn, myColor, winner, opponentConnected, gameType } = gameState;
  const searchParams = new URLSearchParams(useSearch());
  const initialized = useRef(false);

  useEffect(() => {
    if (!connected || initialized.current) return;
    const mode = searchParams.get('mode');
    const type = searchParams.get('type') || 'connect4';
    const difficulty = searchParams.get('difficulty') as any;
    if (mode === 'cpu' && difficulty) startCpuGame(type, difficulty);
    else joinQueue(type);
    initialized.current = true;
  }, [connected, startCpuGame, joinQueue, searchParams]);

  useEffect(() => {
    if (status === 'game_over' && winner === myColor) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [status, winner, myColor]);

  const getGameOverMessage = () => {
    if (!opponentConnected) return { title: "Opponent Left", desc: "The other player disconnected.", icon: <SearchX className="w-12 h-12 text-orange-500" /> };
    if (winner === 'draw') return { title: "It's a Draw!", desc: "The game ended in a draw!", icon: <Gamepad2 className="w-12 h-12 text-blue-500" /> };
    if (winner === myColor) return { title: "Victory!", desc: "You won the game!", icon: <Trophy className="w-12 h-12 text-yellow-500" /> };
    return { title: "Defeat", desc: "Better luck next time!", icon: <Frown className="w-12 h-12 text-red-500" /> };
  };

  const gameOverInfo = getGameOverMessage();
  const isMyTurn = status === 'playing' && turn === myColor;

  const getGameTitle = () => {
    const type = gameType || searchParams.get('type');
    switch (type) {
      case 'checkers': return 'Checkers';
      case 'chess': return 'Chess';
      case 'mancala': return 'Mancala';
      case 'blackjack': return 'Blackjack';
      case 'poker': return 'Poker';
      default: return 'Connect Four';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl flex items-center justify-between mb-8 arcade-card p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">CG</div>
          <span className="font-display font-bold text-xl">
            {getGameTitle()}
          </span>
        </Link>
        <StatusBadge connected={connected} gameStatus={status} />
      </header>

      <main className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-center lg:items-start relative">
        <div className="w-full lg:w-64 flex flex-col gap-4">
          {(status === 'playing' || status === 'game_over') && (
            <div className="arcade-card p-4 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase text-center">Players</h3>
              <PlayerCard name="You" color={myColor === 1 ? 'red' : 'yellow'} active={isMyTurn} isMe />
              <div className="h-px bg-border w-full" />
              <PlayerCard name={searchParams.get('mode') === 'cpu' ? "CPU" : "Opponent"} color={myColor === 1 ? 'yellow' : 'red'} active={!isMyTurn} />
            </div>
          )}
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[400px]">
          {status === 'searching' ? (
            <div className="text-center animate-pulse">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold">Finding Match...</h2>
            </div>
          ) : board ? (
            gameType === 'blackjack' ? (
              <BlackjackBoard gameId={gameState.gameId} socket={socket} onGameOver={(winner: any) => {}} initialBoard={board} />
            ) : gameType === 'poker' ? (
              <PokerBoard gameId={gameState.gameId} socket={socket} onGameOver={(winner: any) => {}} initialBoard={board} />
            ) : Array.isArray(board) ? (
              gameType === 'checkers' ? (
                <CheckersBoard board={board as number[][]} onMove={makeMove} myTurn={isMyTurn} myColor={myColor as 1 | 2} />
              ) : gameType === 'chess' ? (
                <ChessBoard board={board as string[][]} onMove={makeMove} myTurn={isMyTurn} myColor={myColor as 1 | 2} />
              ) : (gameType === 'mancala' || (typeof board[0] === 'number' && board.length === 14)) ? (
                <MancalaBoard board={board as number[]} onMove={makeMove} myTurn={isMyTurn} myColor={myColor as 1 | 2} />
              ) : (
                <Board board={board as number[][]} onColumnClick={makeMove} myTurn={isMyTurn} disabled={status !== 'playing' || !isMyTurn} myColor={myColor as 1 | 2} />
              )
            ) : null
          ) : null}
        </div>
      </main>

      <Dialog open={status === 'game_over' || !opponentConnected} onOpenChange={() => resetGame()}>
        <DialogContent className="text-center rounded-3xl">
          <DialogHeader className="items-center">
            {gameOverInfo.icon}
            <DialogTitle className="text-3xl font-bold mt-4">{gameOverInfo.title}</DialogTitle>
            <DialogDescription className="text-lg">{gameOverInfo.desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
            <Link href="/" className="w-full"><Button variant="outline" className="w-full">Home</Button></Link>
            <Button onClick={() => joinQueue(gameType!)} className="w-full arcade-btn">Play Again</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
