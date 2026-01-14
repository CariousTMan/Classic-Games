import { cn } from "@/lib/utils";
import { Loader2, Wifi, WifiOff } from "lucide-react";

interface StatusBadgeProps {
  connected: boolean;
  gameStatus: 'idle' | 'searching' | 'playing' | 'game_over';
}

export function StatusBadge({ connected, gameStatus }: StatusBadgeProps) {
  if (!connected) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
        <WifiOff className="w-4 h-4" />
        <span>Disconnected</span>
      </div>
    );
  }

  if (gameStatus === 'searching') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Finding Opponent...</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium border border-green-500/20">
      <Wifi className="w-4 h-4" />
      <span>Online</span>
    </div>
  );
}
