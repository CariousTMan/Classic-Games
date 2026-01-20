import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MancalaBoardProps {
  board: number[];
  onMove: (pitIndex: number) => void;
  myTurn: boolean;
  myColor: 1 | 2;
}

export function MancalaBoard({ board, onMove, myTurn, myColor }: MancalaBoardProps) {
  // Pits 0-5: Player 1 (Red)
  // Pit 6: Player 1 Store
  // Pits 7-12: Player 2 (Yellow)
  // Pit 13: Player 2 Store
  
  const handlePitClick = (index: number) => {
    if (!myTurn) return;
    if (myColor === 1 && (index < 0 || index > 5)) return;
    if (myColor === 2 && (index < 7 || index > 12)) return;
    if (board[index] === 0) return;
    onMove(index);
  };

  const Pit = ({ index, color }: { index: number, color: 'red' | 'yellow' }) => {
    const seeds = board[index];
    const isClickable = myTurn && (
      (myColor === 1 && index >= 0 && index <= 5) || 
      (myColor === 2 && index >= 7 && index <= 12)
    ) && seeds > 0;
    
    return (
      <div className="flex flex-col items-center gap-1">
        <motion.button
          whileHover={isClickable ? { scale: 1.05 } : {}}
          whileTap={isClickable ? { scale: 0.95 } : {}}
          onClick={() => handlePitClick(index)}
          disabled={!isClickable}
          className={cn(
            "w-14 h-14 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center text-xl font-bold transition-all shadow-inner relative",
            isClickable 
              ? "border-primary bg-primary/10 hover:bg-primary/20 cursor-pointer" 
              : "border-slate-200 bg-slate-100 cursor-not-allowed",
            color === 'red' && "border-red-400 bg-red-50",
            color === 'yellow' && "border-yellow-400 bg-yellow-50",
            isClickable && color === 'red' && "hover:bg-red-100",
            isClickable && color === 'yellow' && "hover:bg-yellow-100"
          )}
        >
          {seeds}
        </motion.button>
      </div>
    );
  };

  const Store = ({ index, label, color }: { index: number, label: string, color: 'red' | 'yellow' }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
      <div className={cn(
        "w-20 h-56 md:w-28 md:h-72 rounded-3xl border-4 flex items-center justify-center text-4xl font-bold shadow-inner transition-colors",
        color === 'red' ? "border-red-500 bg-red-100 text-red-700" : "border-yellow-500 bg-yellow-100 text-yellow-700"
      )}>
        {board[index]}
      </div>
    </div>
  );

  return (
    <div className="arcade-card p-6 md:p-12 flex items-center justify-center gap-4 md:gap-10 bg-amber-50/50">
      {/* Player 2 Store (Left) */}
      <Store index={13} label="CPU" color="yellow" />
      
      <div className="flex flex-col gap-10 md:gap-16">
        {/* Top Row: Player 2 pits (7-12) - shown in reverse for correct Mancala orientation */}
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
