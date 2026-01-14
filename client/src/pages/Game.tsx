import { useEffect } from "react";
import { useGameSocket } from "@/hooks/use-game-socket";
import { Board } from "@/components/Board";
import { PlayerCard } from "@/components/PlayerCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Trophy, Frown, Gamepad2, Play, SearchX } from "lucide-react";
import confetti from "canvas-confetti";
import { Link } from "wouter";

export default function Game() {
  const { connected, gameState, joinQueue, leaveQueue, makeMove, resetGame } = useGameSocket();
  const { status, board, turn, myColor, winner, opponentConnected } = gameState;

  // Trigger confetti on win
  useEffect(() => {
    if (status === 'game_over' && winner === myColor) {
      const duration = 3000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ef4444', '#eab308']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ef4444', '#eab308']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [status, winner, myColor]);

  // Determine message for game over dialog
  const getGameOverMessage = () => {
    if (!opponentConnected) return { title: "Opponent Left", desc: "The other player disconnected.", icon: <SearchX className="w-12 h-12 text-orange-500" /> };
    if (winner === 'draw') return { title: "It's a Draw!", desc: "The board is full. Good game!", icon: <Gamepad2 className="w-12 h-12 text-blue-500" /> };
    if (winner === myColor) return { title: "Victory!", desc: "You connected 4! Spectacular win!", icon: <Trophy className="w-12 h-12 text-yellow-500" /> };
    return { title: "Defeat", desc: "Better luck next time!", icon: <Frown className="w-12 h-12 text-red-500" /> };
  };

  const gameOverInfo = getGameOverMessage();
  const isMyTurn = status === 'playing' && turn === myColor;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-100 to-slate-200 dark:from-slate-900 dark:to-black p-4 md:p-8 flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-8 arcade-card p-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
            C4
          </div>
          <span className="font-display font-bold text-xl hidden sm:inline">Connect Four</span>
        </Link>
        <StatusBadge connected={connected} gameStatus={status} />
      </header>

      {/* Main Game Area */}
      <main className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        
        {/* Game Info Panel - Left (Desktop) / Top (Mobile) */}
        <div className="w-full lg:w-64 flex flex-col gap-4 order-2 lg:order-1">
          {status === 'playing' || status === 'game_over' ? (
            <div className="arcade-card p-4 flex flex-col gap-4">
              <h3 className="font-display font-bold text-center text-muted-foreground uppercase text-xs tracking-widest">Players</h3>
              <PlayerCard 
                name="You" 
                color={myColor === 1 ? 'red' : 'yellow'} 
                active={turn === myColor && status === 'playing'} 
                isMe 
              />
              <div className="h-px bg-border w-full" />
              <PlayerCard 
                name="Opponent" 
                color={myColor === 1 ? 'yellow' : 'red'} 
                active={turn !== myColor && status === 'playing'} 
              />
            </div>
          ) : (
            <div className="arcade-card p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-2">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <h2 className="font-display font-bold text-xl">Ready to Play?</h2>
              <p className="text-sm text-muted-foreground">Join the queue to find a random opponent immediately.</p>
              
              {status === 'idle' ? (
                <Button 
                  onClick={joinQueue} 
                  disabled={!connected}
                  className="w-full arcade-btn bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Play Now
                </Button>
              ) : (
                <Button 
                  onClick={leaveQueue}
                  variant="destructive"
                  className="w-full arcade-btn py-6"
                >
                  Cancel Search
                </Button>
              )}
            </div>
          )}

          {/* Tips Card */}
          <div className="arcade-card p-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20">
            <h4 className="font-bold text-yellow-700 dark:text-yellow-500 mb-1 flex items-center gap-2">
              <span className="text-lg">💡</span> Tip
            </h4>
            <p className="text-xs text-yellow-800/80 dark:text-yellow-200/80 leading-relaxed">
              Control the center column to maximize your connection opportunities.
            </p>
          </div>
        </div>

        {/* Board Area - Center */}
        <div className="flex-1 w-full flex flex-col items-center justify-center order-1 lg:order-2">
          {status === 'searching' && (
             <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-3xl">
               <div className="text-center space-y-4 animate-bounce">
                 <div className="text-6xl">🔍</div>
                 <h2 className="text-2xl font-display font-bold text-primary">Searching...</h2>
               </div>
             </div>
          )}
          
          <div className={`transition-all duration-500 ${status === 'idle' ? 'opacity-50 blur-[2px] scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
             <Board 
               board={board} 
               onColumnClick={makeMove}
               myTurn={isMyTurn}
               disabled={status !== 'playing' || !isMyTurn}
               myColor={myColor}
             />
          </div>
          
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-background/80 backdrop-blur-md px-6 py-3 rounded-full font-bold shadow-lg border text-muted-foreground">
                Waiting to start...
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Game Over Dialog */}
      <Dialog open={status === 'game_over' || !opponentConnected} onOpenChange={(open) => !open && resetGame()}>
        <DialogContent className="sm:max-w-md text-center border-4 border-black/5 dark:border-white/5 shadow-2xl rounded-3xl">
          <DialogHeader className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 animate-in zoom-in duration-300">
              {gameOverInfo.icon}
            </div>
            <DialogTitle className="font-display text-3xl font-bold">{gameOverInfo.title}</DialogTitle>
            <DialogDescription className="text-lg">
              {gameOverInfo.desc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
            <Button variant="outline" onClick={resetGame} className="w-full rounded-xl py-6">
              Home
            </Button>
            <Button onClick={joinQueue} className="w-full arcade-btn bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
              Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
