import { useState, useRef, useEffect, useCallback } from "react";
import { type WsMessage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type GameState = {
  status: 'idle' | 'searching' | 'playing' | 'game_over';
  gameId: number | null;
  board: number[][]; // 6 rows x 7 cols
  turn: 1 | 2; // 1 or 2
  myColor: 1 | 2 | null;
  winner: 1 | 2 | 'draw' | null;
  opponentConnected: boolean;
};

const INITIAL_BOARD = Array(6).fill(0).map(() => Array(7).fill(0));

export function useGameSocket() {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    gameId: null,
    board: INITIAL_BOARD,
    turn: 1, // Red starts usually
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

    socket.onopen = () => {
      setConnected(true);
      console.log('Connected to game server');
    };

    socket.onclose = () => {
      setConnected(false);
      console.log('Disconnected from game server');
      // Could add auto-reconnect logic here
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsMessage;
        handleMessage(message);
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleMessage = useCallback((message: WsMessage) => {
    switch (message.type) {
      case 'MATCH_FOUND':
        setGameState(prev => ({
          ...prev,
          status: 'playing',
          gameId: message.payload.gameId,
          myColor: message.payload.yourColor,
          board: INITIAL_BOARD,
          turn: 1,
          winner: null,
          opponentConnected: true
        }));
        toast({
          title: "Match Found!",
          description: `You are playing as ${message.payload.yourColor === 1 ? 'Red' : 'Yellow'}.`,
          duration: 3000,
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
        setGameState(prev => ({
          ...prev,
          opponentConnected: false
        }));
        toast({
          title: "Opponent Disconnected",
          description: "Your opponent left the game.",
          variant: "destructive",
        });
        break;

      case 'ERROR':
        toast({
          title: "Error",
          description: message.payload.message,
          variant: "destructive",
        });
        break;
    }
  }, [toast]);

  const joinQueue = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'JOIN_QUEUE' }));
      setGameState(prev => ({ ...prev, status: 'searching', winner: null }));
    } else {
      toast({ title: "Connection Error", description: "Not connected to server", variant: "destructive" });
    }
  };

  const leaveQueue = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LEAVE_QUEUE' }));
      setGameState(prev => ({ ...prev, status: 'idle' }));
    }
  };

  const makeMove = (column: number) => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN && 
      gameState.status === 'playing' && 
      gameState.turn === gameState.myColor &&
      gameState.gameId
    ) {
      wsRef.current.send(JSON.stringify({ 
        type: 'MAKE_MOVE', 
        payload: { column, gameId: gameState.gameId } 
      }));
    }
  };

  const resetGame = () => {
    setGameState({
      status: 'idle',
      gameId: null,
      board: INITIAL_BOARD,
      turn: 1,
      myColor: null,
      winner: null,
      opponentConnected: true,
    });
  };

  return {
    connected,
    gameState,
    joinQueue,
    leaveQueue,
    makeMove,
    resetGame
  };
}
