import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MancalaBoardProps {
  board: number[];
  onMove: (pitIndex: number) => void;
  myTurn: boolean;
  myColor: 1 | 2;
}

export function MancalaBoard({ board, onMove, myTurn, myColor }: MancalaBoardProps) {
  const p1Pits = board.slice(0, 6);
  const p1Store = board[6];
  const p2Pits = board.slice(7, 13).reverse();
  const p2Store = board[13];

  const handlePitClick = (index: number) => {
    if (!myTurn) return;
    if (myColor === 1 && (index < 0 || index > 5)) return;
    if (myColor === 2 && (index < 7 || index > 12)) return;
    if (board[index] === 0) return;
    onMove(index);
  };

  const Pit = ({ seeds, index, label }: { seeds: number, index: number, label?: string }) => {
    const isClickable = myTurn && ((myColor === 1 && index >= 0 && index <= 5) || (myColor === 2 && index >= 7 && index <= 12)) && seeds > 0;
    
    return (
      <div className="flex flex-col items-center gap-1">
        {label && <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>}
        <motion.button
          whileHover={isClickable ? { scale: 1.05 } : {}}
          whileTap={isClickable ? { scale: 0.95 } : {}}
          onClick={() => handlePitClick(index)}
          disabled={!isClickable}
          className={cn(
            "w-12 h-12 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center text-xl font-bold transition-colors shadow-inner",
            isClickable ? "border-primary bg-primary/10 hover:bg-primary/20" : "border-slate-200 bg-slate-100",
            myColor === 1 && index <= 5 && "border-red-400 bg-red-50",
            myColor === 2 && index >= 7 && "border-yellow-400 bg-yellow-50"
          )}
        >
          {seeds}
        </motion.button>
      </div>
    );
  };

  const Store = ({ seeds, label, color }: { seeds: number, label: string, color: 'red' | 'yellow' }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
      <div className={cn(
        "w-16 h-48 md:w-24 md:h-64 rounded-3xl border-4 flex items-center justify-center text-3xl font-bold shadow-inner",
        color === 'red' ? "border-red-500 bg-red-100 text-red-700" : "border-yellow-500 bg-yellow-100 text-yellow-700"
      )}>
        {seeds}
      </div>
    </div>
  );

  return (
    <div className="arcade-card p-6 md:p-10 flex items-center gap-4 md:gap-8 bg-amber-50">
      <Store seeds={p2Store} label="CPU" color="yellow" />
      
      <div className="flex flex-col gap-8 md:gap-12">
        <div className="flex gap-2 md:gap-4">
          {p2Pits.map((seeds, i) => (
            <Pit key={`p2-${i}`} seeds={seeds} index={12 - i} />
          ))}
        </div>
        <div className="flex gap-2 md:gap-4">
          {p1Pits.map((seeds, i) => (
            <Pit key={`p1-${i}`} seeds={seeds} index={i} />
          ))}
        </div>
      </div>

      <Store seeds={p1Store} label="You" color="red" />
    </div>
  );
}
