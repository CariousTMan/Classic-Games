import { cn } from "@/lib/utils";

interface PlayerCardProps {
  name: string;
  color: "red" | "yellow";
  active: boolean;
  score?: number;
  isMe?: boolean;
}

export function PlayerCard({ name, color, active, score, isMe }: PlayerCardProps) {
  const isRed = color === "red";
  
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 p-3 pr-6 rounded-2xl transition-all duration-300 border-2",
        active 
          ? "scale-105 shadow-lg bg-white dark:bg-zinc-800 border-primary" 
          : "opacity-80 grayscale-[0.3] bg-transparent border-transparent",
        isRed && active ? "border-[hsl(var(--player-1))]" : "",
        !isRed && active ? "border-[hsl(var(--player-2))]" : ""
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full shadow-inner flex items-center justify-center text-xl font-bold text-white",
          isRed 
            ? "bg-gradient-to-br from-[hsl(var(--player-1))] to-[hsl(var(--player-1-dark))]" 
            : "bg-gradient-to-br from-[hsl(var(--player-2))] to-[hsl(var(--player-2-dark))]"
        )}
      >
        {name[0].toUpperCase()}
      </div>
      
      <div className="flex flex-col">
        <span className="font-display font-bold text-lg leading-tight">
          {name} {isMe && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
        </span>
        <span className={cn(
          "text-xs font-bold uppercase tracking-wider",
          active ? "opacity-100" : "opacity-0"
        )}>
          {active ? "Thinking..." : "Waiting"}
        </span>
      </div>

      {score !== undefined && (
        <div className="ml-auto font-mono text-xl font-bold text-muted-foreground">
          {score}
        </div>
      )}
      
      {active && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
      )}
    </div>
  );
}
