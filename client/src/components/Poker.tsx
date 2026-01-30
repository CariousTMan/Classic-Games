import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Poker({ gameId, socket, onGameOver, initialBoard }: any) {
  const [gameState, setGameState] = useState<any>(initialBoard);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'GAME_UPDATE') {
        setGameState(msg.payload.board);
      }
    };
    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket]);

  const pokerAction = (action: string, amount?: number) => {
    socket.send(JSON.stringify({
      type: 'POKER_ACTION',
      payload: { action, amount, gameId }
    }));
  };

  if (!gameState || !gameState.playerHand || !gameState.communityCards) return <div className="flex items-center justify-center h-64 font-display text-xl animate-pulse text-primary">Shuffling deck...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-6 arcade-card bg-green-900/20 border-green-500/30">
      <div className="text-center space-y-2">
        <div className="text-sm font-bold text-green-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <span>Pot</span>
          <span className="px-2 py-0.5 rounded bg-green-500/10 text-[10px] border border-green-500/20">{gameState.phase?.toUpperCase() || 'PREFLOP'}</span>
        </div>
        <div className="text-4xl font-display font-bold text-white">${gameState.pot || 0}</div>
      </div>

      <div className="flex justify-center gap-4 py-8">
        {gameState.communityCards.map((card: any, i: number) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-28 bg-white rounded-lg shadow-xl flex flex-col items-center justify-between p-2 border-2 border-slate-200"
          >
            <div className="w-full text-left font-bold">{card.rank}</div>
            <div className={`text-4xl ${['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-slate-900'}`}>{card.suit}</div>
            <div className="w-full text-right font-bold rotate-180">{card.rank}</div>
          </motion.div>
        ))}
        {Array.from({ length: Math.max(0, 5 - (gameState.communityCards?.length || 0)) }).map((_, i) => (
          <div key={`empty-${i}`} className="w-20 h-28 border-2 border-dashed border-green-500/20 rounded-lg flex items-center justify-center text-green-500/10 text-4xl">?</div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8 pt-8">
        <div className="space-y-4">
          <div className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Hand</div>
          <div className="flex justify-center gap-2">
            {gameState.playerHand.map((card: any, i: number) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-24 h-32 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-between p-3 border-2 border-primary/20"
              >
                <div className="w-full text-left font-bold text-lg">{card.rank}</div>
                <div className={`text-5xl ${['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-slate-900'}`}>{card.suit}</div>
                <div className="w-full text-right font-bold text-lg rotate-180">{card.rank}</div>
              </motion.div>
            ))}
          </div>
          <div className="text-center font-display text-primary font-bold text-2xl mt-4">${gameState.playerChips}</div>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span>CPU Chips</span>
              <span className="text-white">${gameState.cpuChips}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${(gameState.cpuChips / 1000) * 100}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => pokerAction('check')} 
              className="arcade-btn h-12" 
              disabled={gameState.turn !== 1 || Number(gameState.currentBet) > 0}
            >
              Check
            </Button>
            <Button 
              onClick={() => pokerAction('call')} 
              variant="outline" 
              className="h-12 border-2" 
              disabled={gameState.turn !== 1 || !(gameState.currentBet > 0)}
            >
              Call (${gameState.currentBet || 0})
            </Button>
            <Button 
              onClick={() => pokerAction('bet', 50)} 
              variant="secondary" 
              className="h-12" 
              disabled={gameState.turn !== 1}
            >
              {gameState.currentBet > 0 ? `Raise $50` : `Bet $50`}
            </Button>
            <Button 
              onClick={() => pokerAction('fold')} 
              variant="destructive" 
              className="h-12" 
              disabled={gameState.turn !== 1}
            >
              Fold
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
