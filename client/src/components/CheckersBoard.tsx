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
    } else if (selected) {
      // Basic diagonal validation on client side for UX
      const dr = Math.abs(r - selected.r);
      const dc = Math.abs(c - selected.c);
      if (board[r][c] === 0 && (r + c) % 2 === 1 && (dr === 1 || dr === 2) && dc === dr) {
        onMove({ from: selected, to: { r, c } });
        setSelected(null);
      } else if (isMyPiece) {
        setSelected({ r, c });
      }
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
              ${(r + c) % 2 === 0 ? 'bg-slate-200 dark:bg-slate-300' : 'bg-slate-700 dark:bg-slate-800'}
              ${selected?.r === r && selected?.c === c ? 'ring-4 ring-blue-400 ring-inset z-10 scale-105' : ''}
              ${myTurn && (r + c) % 2 === 1 && cell === 0 && selected ? 'hover:bg-slate-600' : ''}
            `}
          >
            {/* Cell border to simulate grid */}
            <div className="absolute inset-0 border-[0.5px] border-black/10 pointer-events-none" />
            
            {cell !== 0 && (
              <motion.div
                layoutId={`piece-${r}-${c}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`
                  w-[85%] h-[85%] rounded-full shadow-[0_4px_0_0_rgba(0,0,0,0.3)] border-4
                  ${cell % 10 === 1 ? 'bg-red-500 border-red-700' : 'bg-slate-900 border-slate-950'}
                  flex items-center justify-center relative
                `}
              >
                {/* Visual texture for pieces */}
                <div className="absolute inset-2 border-2 border-white/10 rounded-full" />
                {cell > 10 && (
                  <motion.div 
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    className="text-yellow-400 drop-shadow-md"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
