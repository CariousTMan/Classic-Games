import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface MancalaBoardProps {
  board: number[];
  onMove: (pitIndex: number) => void;
  myTurn: boolean;
  myColor: 1 | 2;
}

export function MancalaBoard({ board, onMove, myTurn, myColor }: MancalaBoardProps) {
  const [displayBoard, setDisplayBoard] = useState(board);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastBoardRef = useRef(board);

  useEffect(() => {
    // If we're not animating and the board changed, update displayBoard
    // This handles initial load and updates from other players
    if (!isAnimating && JSON.stringify(board) !== JSON.stringify(displayBoard)) {
      setDisplayBoard(board);
      lastBoardRef.current = board;
    }
  }, [board, isAnimating]);

  const handlePitClick = async (index: number) => {
    if (!myTurn || isAnimating) return;
    if (myColor === 1 && (index < 0 || index > 5)) return;
    if (myColor === 2 && (index < 7 || index > 12)) return;
    
    const seeds = displayBoard[index];
    if (typeof seeds !== 'number' || seeds <= 0) return;
    
    setIsAnimating(true);
    await animateSowing(index);
    onMove(index);
    setIsAnimating(false);
  };

  const animateSowing = async (startIndex: number) => {
    let currentBoard = [...displayBoard];
    let seeds = currentBoard[startIndex];
    currentBoard[startIndex] = 0;
    setDisplayBoard([...currentBoard]);
    
    let currentPit = startIndex;
    const playerNum = myColor;

    while (seeds > 0) {
      await new Promise(resolve => setTimeout(resolve, 300));
      currentPit = (currentPit + 1) % 14;
      
      // Skip opponent's store
      if (playerNum === 1 && currentPit === 13) continue;
      if (playerNum === 2 && currentPit === 6) continue;
      
      currentBoard[currentPit]++;
      seeds--;
      setDisplayBoard([...currentBoard]);

      // Relay sowing logic mirroring backend
      if (seeds === 0 && currentBoard[currentPit] > 1) {
        const isStore = currentPit === 6 || currentPit === 13;
        if (!isStore) {
          await new Promise(resolve => setTimeout(resolve, 500));
          seeds = currentBoard[currentPit];
          currentBoard[currentPit] = 0;
          setDisplayBoard([...currentBoard]);
        }
      }
    }
  };

  const Pit = ({ index, color }: { index: number, color: 'red' | 'yellow' }) => {
    const seeds = typeof displayBoard[index] === 'number' ? displayBoard[index] : 0;
    const isOwnPit = (myColor === 1 && index >= 0 && index <= 5) || 
                     (myColor === 2 && index >= 7 && index <= 12);
    const isClickable = myTurn && isOwnPit && seeds > 0 && !isAnimating;
    
    return (
      <div className="flex flex-col items-center gap-1">
        <motion.button
          whileHover={isClickable ? { scale: 1.05 } : {}}
          whileTap={isClickable ? { scale: 0.95 } : {}}
          onClick={() => handlePitClick(index)}
          type="button"
          disabled={!isClickable}
          className={cn(
            "w-14 h-14 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center text-xl font-bold transition-all shadow-inner relative overflow-hidden",
            isClickable 
              ? "border-primary bg-primary/10 hover:bg-primary/20 cursor-pointer" 
              : "border-slate-200 bg-slate-100 cursor-default opacity-80",
            color === 'red' && "border-red-400 bg-red-50",
            color === 'yellow' && "border-yellow-400 bg-yellow-50",
            isClickable && color === 'red' && "hover:bg-red-100",
            isClickable && color === 'yellow' && "hover:bg-yellow-100"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={seeds}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {seeds}
            </motion.span>
          </AnimatePresence>
          
          {/* Visual representation of seeds */}
          <div className="absolute inset-0 pointer-events-none flex flex-wrap items-center justify-center p-2 gap-0.5 opacity-30">
            {Array.from({ length: Math.min(seeds, 12) }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-2 h-2 rounded-full",
                  color === 'red' ? "bg-red-500" : "bg-yellow-500"
                )} 
              />
            ))}
            {seeds > 12 && <span className="text-[8px] font-bold">+</span>}
          </div>
        </motion.button>
      </div>
    );
  };

  const Store = ({ index, label, color }: { index: number, label: string, color: 'red' | 'yellow' }) => {
    const seeds = typeof displayBoard[index] === 'number' ? displayBoard[index] : 0;
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
        <div className={cn(
          "w-20 h-56 md:w-28 md:h-72 rounded-3xl border-4 flex flex-col items-center justify-center text-4xl font-bold shadow-inner transition-colors relative overflow-hidden",
          color === 'red' ? "border-red-500 bg-red-100 text-red-700" : "border-yellow-500 bg-yellow-100 text-yellow-700"
        )}>
          <AnimatePresence mode="wait">
            <motion.span
              key={seeds}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {seeds}
            </motion.span>
          </AnimatePresence>

          {/* Seed reservoir visual */}
          <div className="absolute bottom-4 left-0 right-0 flex flex-wrap items-center justify-center p-2 gap-1 opacity-20">
            {Array.from({ length: Math.min(seeds, 20) }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-3 h-3 rounded-full",
                  color === 'red' ? "bg-red-600" : "bg-yellow-600"
                )} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="arcade-card p-6 md:p-12 flex items-center justify-center gap-4 md:gap-10 bg-amber-50/50">
      {/* Player 2 Store (Left) */}
      <Store index={13} label="CPU" color="yellow" />
      
      <div className="flex flex-col gap-10 md:gap-16">
        {/* Top Row: Player 2 pits (7-12) */}
        <div className="flex gap-3 md:gap-6 flex-row-reverse">
          {[7, 8, 9, 10, 11, 12].map((idx) => (
            <Pit key={idx} index={idx} color="yellow" />
          ))}
        </div>
        
        {/* Bottom Row: Player 1 pits (0-5) */}
        <div className="flex gap-3 md:gap-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <Pit key={idx} index={idx} color="red" />
          ))}
        </div>
      </div>

      {/* Player 1 Store (Right) */}
      <Store index={6} label="YOU" color="red" />
    </div>
  );
}
