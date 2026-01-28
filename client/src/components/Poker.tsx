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

  if (!gameState) return <div className="flex items-center justify-center h-64 font-display text-xl animate-pulse">Shuffling deck...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-6 arcade-card bg-green-900/20 border-green-500/30">
      <div className="text-center space-y-2">
        <div className="text-sm font-bold text-green-500 uppercase tracking-[0.2em]">Pot</div>
        <div className="text-4xl font-display font-bold text-white">${gameState.pot}</div>
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
        {Array(5 - gameState.communityCards.length).fill(null).map((_, i) => (
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
          <div className="text-center font-display text-primary font-bold">${gameState.playerChips}</div>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => pokerAction('check')} className="arcade-btn h-12" disabled={gameState.turn !== 1}>Check</Button>
            <Button onClick={() => pokerAction('call')} variant="outline" className="h-12 border-2" disabled={gameState.turn !== 1}>Call</Button>
            <Button onClick={() => pokerAction('bet', 50)} variant="secondary" className="h-12" disabled={gameState.turn !== 1}>Bet $50</Button>
            <Button onClick={() => pokerAction('fold')} variant="destructive" className="h-12" disabled={gameState.turn !== 1}>Fold</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
