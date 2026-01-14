import { motion } from "framer-motion";

interface BoardProps {
  board: number[][];
  onColumnClick: (colIndex: number) => void;
  myTurn: boolean;
  disabled: boolean;
  myColor: 1 | 2 | null;
}

export function Board({ board, onColumnClick, myTurn, disabled, myColor }: BoardProps) {
  // Board dimensions: 6 rows, 7 cols
  const cols = 7;
  const rows = 6;

  return (
    <div className="relative p-4 rounded-3xl bg-blue-600 shadow-xl border-b-[12px] border-blue-800 w-full max-w-md mx-auto aspect-[7/6]">
      {/* Board Legs (Purely visual) */}
      <div className="absolute -bottom-8 -left-2 w-4 h-24 bg-blue-800 -z-10 rounded-full rotate-12" />
      <div className="absolute -bottom-8 -right-2 w-4 h-24 bg-blue-800 -z-10 rounded-full -rotate-12" />

      {/* Grid Container */}
      <div className="grid grid-cols-7 gap-2 h-full">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div
            key={colIndex}
            className={`flex flex-col gap-2 relative ${
              myTurn && !disabled ? "cursor-pointer hover:bg-white/10 rounded-full" : ""
            }`}
            onClick={() => !disabled && onColumnClick(colIndex)}
          >
            {/* Hover Indicator Arrow */}
            {myTurn && !disabled && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl"
              >
                {myColor === 1 ? '🔴' : '🟡'}
              </motion.div>
            )}

            {Array.from({ length: rows }).map((_, rowIndex) => {
              const cellValue = board[rowIndex][colIndex];
              return (
                <div
                  key={`${colIndex}-${rowIndex}`}
                  className="flex-1 rounded-full game-cell-hole bg-blue-800/40 relative overflow-hidden"
                >
                  {cellValue !== 0 && (
                    <motion.div
                      initial={{ y: -300 }}
                      animate={{ y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`w-full h-full rounded-full ${
                        cellValue === 1 ? "piece-p1" : "piece-p2"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
