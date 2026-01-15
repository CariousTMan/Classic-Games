import { motion } from "framer-motion";
import { useState } from "react";

interface ChessBoardProps {
  board: string[][];
  onMove: (move: { from: { r: number; c: number }; to: { r: number; c: number } }) => void;
  myTurn: boolean;
  myColor: number | null;
}

const PIECE_SYMBOLS: Record<string, string> = {
  'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
  'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚'
};

export function ChessBoard({ board, onMove, myTurn, myColor }: ChessBoardProps) {
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  const handleClick = (r: number, c: number) => {
    if (!myTurn) return;
    
    const piece = board[r][c];
    const isWhite = piece !== '' && piece === piece.toUpperCase();
    const isMyPiece = piece !== '' && (myColor === 1 ? isWhite : !isWhite);

    if (isMyPiece) {
      setSelected({ r, c });
    } else if (selected) {
      onMove({ from: selected, to: { r, c } });
      setSelected(null);
    }
  };

  return (
    <div className="grid grid-cols-8 bg-slate-800 p-2 rounded-lg shadow-2xl aspect-square w-full max-w-[500px] border-8 border-slate-900 overflow-hidden">
      {board.map((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            onClick={() => handleClick(r, c)}
            className={`
              relative aspect-square flex items-center justify-center cursor-pointer transition-all duration-200
              ${(r + c) % 2 === 0 ? 'bg-[#eeeed2]' : 'bg-[#769656]'}
              ${selected?.r === r && selected?.c === c ? 'ring-4 ring-blue-400 ring-inset z-10' : ''}
            `}
          >
            <div className="absolute top-0 left-0 p-0.5 text-[8px] opacity-20 pointer-events-none">
              {String.fromCharCode(97 + c)}{8 - r}
            </div>
            
            {cell !== '' && (
              <motion.div
                layoutId={`piece-${r}-${c}`}
                className="text-4xl select-none"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {PIECE_SYMBOLS[cell]}
              </motion.div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
