import { motion } from "framer-motion";
import { useState } from "react";

interface CheckersBoardProps {
  board: number[][];
  onMove: (move: { from: { r: number; c: number }; to: { r: number; c: number } }) => void;
  myTurn: boolean;
  myColor: number | null;
}

export function CheckersBoard({ board, onMove, myTurn, myColor }: CheckersBoardProps) {
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  const handleClick = (r: number, c: number) => {
    if (!myTurn) return;
    
    const piece = board[r][c];
    const isMyPiece = piece > 0 && (piece % 10 === myColor);

    if (isMyPiece) {
      setSelected({ r, c });
    } else if (selected && board[r][c] === 0 && (r + c) % 2 === 1) {
      onMove({ from: selected, to: { r, c } });
      setSelected(null);
    }
  };

  return (
    <div className="grid grid-cols-8 gap-1 bg-slate-800 p-2 rounded-lg shadow-2xl aspect-square w-full max-w-[500px]">
      {board.map((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            onClick={() => handleClick(r, c)}
            className={`
              relative aspect-square flex items-center justify-center rounded-sm cursor-pointer transition-colors
              ${(r + c) % 2 === 0 ? 'bg-slate-200' : 'bg-slate-700'}
              ${selected?.r === r && selected?.c === c ? 'ring-4 ring-blue-400 z-10' : ''}
              ${myTurn && (r + c) % 2 === 1 && cell === 0 && selected ? 'hover:bg-slate-600' : ''}
            `}
          >
            {cell !== 0 && (
              <motion.div
                layoutId={`piece-${r}-${c}`}
                className={`
                  w-4/5 h-4/5 rounded-full shadow-lg border-4
                  ${cell % 10 === 1 ? 'bg-red-500 border-red-700' : 'bg-slate-900 border-black'}
                  flex items-center justify-center
                `}
              >
                {cell > 10 && <div className="text-yellow-400 font-bold text-xl">★</div>}
              </motion.div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
