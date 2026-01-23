import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WS_MESSAGES } from "@shared/schema";

type CardData = { suit: string, rank: string, value: number };

export default function Blackjack({ gameId, socket, onGameOver }: any) {
  const [gameState, setGameState] = useState<any>(null);

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
  }, [socket]);

  const makeMove = (action: string) => {
    socket.send(JSON.stringify({
      type: WS_MESSAGES.MAKE_MOVE,
      payload: { gameId, move: { action } }
    }));
  };

  if (!gameState) return <div className="flex items-center justify-center h-64">Dealing cards...</div>;

  return (
    <div className="space-y-8 p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center">Dealer's Hand</h3>
        <div className="flex justify-center gap-2">
          {gameState.dealerHand.map((card: CardData, i: number) => (
            <Card key={i} className="w-16 h-24 flex flex-col items-center justify-center border-2 bg-white">
              <span className="text-lg font-bold">{card.rank}</span>
              <span className="text-2xl">{card.suit}</span>
            </Card>
          ))}
          {gameState.dealerHand.length === 1 && (
            <Card className="w-16 h-24 bg-slate-200 border-2 border-dashed border-slate-400" />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center">Your Hand</h3>
        <div className="flex justify-center gap-2">
          {gameState.playerHand.map((card: CardData, i: number) => (
            <Card key={i} className="w-16 h-24 flex flex-col items-center justify-center border-2 bg-white">
              <span className="text-lg font-bold">{card.rank}</span>
              <span className="text-2xl">{card.suit}</span>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Button onClick={() => makeMove('hit')} className="arcade-btn px-8">Hit</Button>
        <Button onClick={() => makeMove('stand')} variant="outline" className="px-8">Stand</Button>
      </div>
    </div>
  );
}
