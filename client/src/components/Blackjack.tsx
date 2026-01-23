import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WS_MESSAGES } from "@shared/schema";
import { motion } from "framer-motion";

type CardData = { suit: string, rank: string, value: number };

function calculateBlackjackScore(hand: CardData[]): number {
  let score = hand.reduce((sum, card) => sum + card.value, 0);
  let aces = hand.filter(c => c.rank === 'A').length;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

export default function Blackjack({ gameId, socket, onGameOver, initialBoard }: any) {
  const [gameState, setGameState] = useState<any>(initialBoard);

  useEffect(() => {
    if (!socket) return;
    const handler = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === WS_MESSAGES.GAME_UPDATE) {
        setGameState(data.payload.board);
      } else if (data.type === WS_MESSAGES.GAME_OVER) {
        setGameState(data.payload.board);
        onGameOver(data.payload.winner);
      }
    };
    socket.addEventListener('message', handler);
    return () => socket.removeEventListener('message', handler);
  }, [socket, onGameOver]);

  const makeMove = (action: string) => {
    socket.send(JSON.stringify({
      type: WS_MESSAGES.MAKE_MOVE,
      payload: { gameId, move: { action } }
    }));
  };

  if (!gameState) return <div className="flex items-center justify-center h-64">Dealing cards...</div>;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 p-6 arcade-card">
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Dealer</h3>
          <div className="px-2 py-0.5 rounded bg-slate-200 text-xs font-mono">
            {calculateBlackjackScore(gameState.dealerHand)}
          </div>
        </div>
        <div className="flex justify-center gap-4">
          {gameState.dealerHand.map((card: CardData, i: number) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              className="w-20 h-28 flex flex-col items-center justify-between p-2 border-2 bg-white rounded-xl shadow-md relative group hover:-translate-y-1 transition-transform"
            >
              <div className="w-full flex justify-start text-xs font-bold">{card.rank}</div>
              <div className={`text-4xl ${['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-slate-900'}`}>{card.suit}</div>
              <div className="w-full flex justify-end text-xs font-bold rotate-180">{card.rank}</div>
            </motion.div>
          ))}
          {gameState.dealerHand.length === 1 && (
            <div className="w-20 h-28 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-400 animate-spin opacity-20" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">You</h3>
          <div className={`px-2 py-0.5 rounded text-xs font-mono ${calculateBlackjackScore(gameState.playerHand) > 21 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {calculateBlackjackScore(gameState.playerHand)}
          </div>
        </div>
        <div className="flex justify-center gap-4">
          {gameState.playerHand.map((card: CardData, i: number) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-20 h-28 flex flex-col items-center justify-between p-2 border-2 bg-white rounded-xl shadow-md relative group hover:-translate-y-2 transition-transform"
            >
              <div className="w-full flex justify-start text-xs font-bold">{card.rank}</div>
              <div className={`text-4xl ${['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-slate-900'}`}>{card.suit}</div>
              <div className="w-full flex justify-end text-xs font-bold rotate-180">{card.rank}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-6">
        <Button 
          onClick={() => makeMove('hit')} 
          disabled={calculateBlackjackScore(gameState.playerHand) >= 21}
          className="arcade-btn px-10 h-12 text-lg"
        >
          Hit
        </Button>
        <Button 
          onClick={() => makeMove('stand')} 
          variant="outline" 
          className="px-10 h-12 text-lg border-2"
        >
          Stand
        </Button>
      </div>
    </div>
  );
}
