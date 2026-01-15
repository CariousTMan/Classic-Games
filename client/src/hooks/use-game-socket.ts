import { useState, useRef, useEffect, useCallback } from "react";
import { type WsMessage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type GameState = {
  status: 'idle' | 'searching' | 'playing' | 'game_over';
  gameType: string | null;
  gameId: number | null;
  board: any;
  turn: 1 | 2;
  myColor: 1 | 2 | null;
  winner: 1 | 2 | 'draw' | null;
  opponentConnected: boolean;
};

export function useGameSocket() {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    gameType: null,
    gameId: null,
    board: null,
    turn: 1,
    myColor: null,
    winner: null,
    opponentConnected: true,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsUrl = `${protocol}${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsMessage;
        handleMessage(message);
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    return () => socket.close();
  }, []);

  const handleMessage = useCallback((message: WsMessage) => {
    switch (message.type) {
      case 'MATCH_FOUND':
        setGameState(prev => {
          let initialBoard = null;
          if (message.payload.gameType === 'checkers') {
            initialBoard = Array(8).fill(null).map((_, r) => 
              Array(8).fill(null).map((_, c) => {
                if ((r + c) % 2 === 1) {
                  if (r < 3) return 2;
                  if (r > 4) return 1;
                }
                return 0;
              })
            );
          } else {
            initialBoard = Array(6).fill(0).map(() => Array(7).fill(0));
          }

          return {
            ...prev,
            status: 'playing',
            gameType: message.payload.gameType,
            gameId: message.payload.gameId,
            myColor: message.payload.yourColor,
            board: initialBoard,
            turn: 1,
            winner: null,
            opponentConnected: true
          };
        });
        toast({
          title: "Match Found!",
          description: `Game: ${message.payload.gameType}. You are Player ${message.payload.yourColor}.`,
        });
        break;

      case 'GAME_UPDATE':
        setGameState(prev => ({
          ...prev,
          board: message.payload.board,
          turn: message.payload.turn
        }));
        break;

      case 'GAME_OVER':
        setGameState(prev => ({
          ...prev,
          status: 'game_over',
          winner: message.payload.winner,
          board: message.payload.board
        }));
        break;

      case 'OPPONENT_DISCONNECTED':
        setGameState(prev => ({ ...prev, opponentConnected: false }));
        break;
    }
  }, [toast]);

  const joinQueue = (gameType: string = 'connect4') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'JOIN_QUEUE', payload: { gameType } }));
      setGameState(prev => ({ ...prev, status: 'searching', gameType, winner: null }));
    }
  };

  const startCpuGame = (gameType: string, difficulty: 'easy' | 'medium' | 'hard') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'START_CPU_GAME', payload: { gameType, difficulty } }));
      setGameState(prev => ({ ...prev, status: 'searching', gameType, winner: null }));
    }
  };

  const leaveQueue = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LEAVE_QUEUE' }));
      setGameState(prev => ({ ...prev, status: 'idle' }));
    }
  };

  const makeMove = (move: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && gameState.gameId) {
      wsRef.current.send(JSON.stringify({ 
        type: 'MAKE_MOVE', 
        payload: { move, gameId: gameState.gameId } 
      }));
    }
  };

  const resetGame = () => {
    setGameState({
      status: 'idle',
      gameType: null,
      gameId: null,
      board: null,
      turn: 1,
      myColor: null,
      winner: null,
      opponentConnected: true,
    });
  };

  return { connected, gameState, joinQueue, startCpuGame, leaveQueue, makeMove, resetGame };
}
