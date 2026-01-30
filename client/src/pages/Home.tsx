import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Users, ArrowLeft, Grid3X3, CircleDot, Trophy } from "lucide-react";
import { useState } from "react";
import { Leaderboard } from "@/components/Leaderboard";

export default function Home() {
  const [, setLocation] = useLocation();
  const [menuState, setMenuState] = useState<'main' | 'game-select' | 'cpu-difficulty' | 'leaderboard'>('main');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const nickname = localStorage.getItem("nickname") || "Guest";

  const startOnlineGame = (gameType: string) => {
    setLocation(`/game?mode=online&type=${gameType}`);
  };

  const startCpuGame = (difficulty: string) => {
    if (!selectedGame) return;
    setLocation(`/game?mode=cpu&type=${selectedGame}&difficulty=${difficulty}`);
  };

  const logout = () => {
    localStorage.removeItem("nickname");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold text-sm shadow-md">GH</div>
          <span className="font-display font-bold text-lg hidden sm:inline-block">GameHub</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">Welcome, {nickname}</span>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
            Change Nickname
          </Button>
        </div>
      </header>

      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-20 left-[10%] w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-[10%] w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center w-full max-w-4xl space-y-8"
        >
          <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            GameHub
          </h1>
          
          <div className="flex flex-col items-center justify-center gap-4 pt-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              {menuState === 'main' && (
                <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 w-full max-w-sm">
                  <Button size="lg" onClick={() => setMenuState('game-select')} className="arcade-btn h-20 text-xl">
                    <Gamepad2 className="mr-3 w-8 h-8" /> Play Games
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setMenuState('leaderboard')} className="h-16 text-lg border-2">
                    <Trophy className="mr-3 w-6 h-6" /> Leaderboards
                  </Button>
                </motion.div>
              )}

              {menuState === 'leaderboard' && (
                <motion.div key="leaderboard" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full">
                  <Leaderboard />
                  <Button variant="ghost" onClick={() => setMenuState('main')} className="mt-6"><ArrowLeft className="mr-2" /> Back to Menu</Button>
                </motion.div>
              )}

              {menuState === 'game-select' && (
                <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 w-full max-w-sm">
                  <h2 className="text-2xl font-bold mb-4">Select a Game</h2>
                  <Button variant="outline" onClick={() => { setSelectedGame('connect4'); setMenuState('cpu-difficulty'); }} className="h-20 text-lg border-2">
                    <Grid3X3 className="mr-3 w-6 h-6" /> Connect Four
                  </Button>
                  <Button variant="outline" onClick={() => { setSelectedGame('checkers'); setMenuState('cpu-difficulty'); }} className="h-20 text-lg border-2">
                    <CircleDot className="mr-3 w-6 h-6" /> Checkers
                  </Button>
                  <Button variant="outline" onClick={() => { setSelectedGame('mancala'); setMenuState('cpu-difficulty'); }} className="h-20 text-lg border-2">
                    <div className="mr-3 w-6 h-6 flex items-center justify-center text-2xl">🕳️</div> Mancala
                  </Button>
                  <Button variant="outline" onClick={() => { setSelectedGame('chess'); setMenuState('cpu-difficulty'); }} className="h-20 text-lg border-2">
                    <div className="mr-3 w-6 h-6 flex items-center justify-center font-bold">♟</div> Chess
                  </Button>
                  <Button variant="outline" onClick={() => { setSelectedGame('blackjack'); setMenuState('cpu-difficulty'); }} className="h-20 text-lg border-2">
                    <div className="mr-3 w-6 h-6 flex items-center justify-center font-bold">🃏</div> Blackjack
                  </Button>
                  <Button variant="outline" onClick={() => { setSelectedGame('poker'); setMenuState('cpu-difficulty'); }} className="h-20 text-lg border-2 border-red-500/30">
                    <div className="mr-3 w-6 h-6 flex items-center justify-center font-bold">♠️</div> Poker
                  </Button>
                  <Button variant="ghost" onClick={() => setMenuState('main')} className="mt-4"><ArrowLeft className="mr-2" /> Back</Button>
                </motion.div>
              )}

              {menuState === 'cpu-difficulty' && (
                <motion.div key="cpu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 w-full max-w-sm">
                  <h2 className="text-2xl font-bold mb-4">Select Mode</h2>
                  <Button onClick={() => startOnlineGame(selectedGame!)} className="h-16 text-lg"><Users className="mr-2" /> Online Matchmaking</Button>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" onClick={() => startCpuGame('easy')} className="border-green-500/30 hover:bg-green-500/10">Easy</Button>
                    <Button variant="outline" onClick={() => startCpuGame('medium')} className="border-yellow-500/30 hover:bg-yellow-500/10">Med</Button>
                    <Button variant="outline" onClick={() => startCpuGame('hard')} className="border-red-500/30 hover:bg-red-500/10">Hard</Button>
                  </div>
                  <Button variant="ghost" onClick={() => setMenuState('game-select')} className="mt-4"><ArrowLeft className="mr-2" /> Back</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
