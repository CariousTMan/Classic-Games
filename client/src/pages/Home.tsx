import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Trophy, Users, Zap, Cpu, ArrowLeft } from "lucide-react";
import { useGames } from "@/hooks/use-games";
import { useState } from "react";

export default function Home() {
  const { data: recentGames } = useGames();
  const [, setLocation] = useLocation();
  const [showCpuOptions, setShowCpuOptions] = useState(false);

  const startCpuGame = (difficulty: string) => {
    setLocation(`/game?mode=cpu&difficulty=${difficulty}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-20 left-[10%] w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-[10%] w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-medium text-sm mb-4 border shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Multiplayer & CPU
          </div>
          
          <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
            Connect<br/>Four
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
            The classic strategy game. Challenge random opponents online or test your skills against our AI.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-8">
            <AnimatePresence mode="wait">
              {!showCpuOptions ? (
                <motion.div 
                  key="main-options"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col sm:flex-row gap-4 w-full justify-center"
                >
                  <Link href="/game">
                    <Button size="lg" className="w-full sm:w-auto arcade-btn bg-primary text-xl px-12 py-8 hover:scale-105 active:scale-95">
                      <Users className="mr-3 w-6 h-6" /> Online Play
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => setShowCpuOptions(true)}
                    className="w-full sm:w-auto rounded-2xl py-8 text-xl px-12 hover:bg-secondary/50 border-2"
                  >
                    <Cpu className="mr-3 w-6 h-6" /> Play CPU
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  key="cpu-options"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => startCpuGame('easy')}
                      className="rounded-2xl py-6 px-8 text-lg border-2 border-green-500/30 hover:bg-green-500/10"
                    >
                      Easy
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => startCpuGame('medium')}
                      className="rounded-2xl py-6 px-8 text-lg border-2 border-yellow-500/30 hover:bg-yellow-500/10"
                    >
                      Medium
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => startCpuGame('hard')}
                      className="rounded-2xl py-6 px-8 text-lg border-2 border-red-500/30 hover:bg-red-500/10"
                    >
                      Hard
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowCpuOptions(false)}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Main Menu
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Floating Game Pieces Animation */}
        <motion.div 
          animate={{ y: [0, -20, 0] }} 
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute top-1/4 right-[15%] hidden lg:block w-16 h-16 rounded-full bg-red-500 shadow-xl opacity-80"
        />
        <motion.div 
          animate={{ y: [0, 25, 0] }} 
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/3 left-[15%] hidden lg:block w-16 h-16 rounded-full bg-yellow-400 shadow-xl opacity-80"
        />
      </section>

      {/* Features Grid */}
      <section className="bg-secondary/30 py-20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-yellow-500" />}
              title="Smart AI"
              desc="Practice your skills against our CPU with multiple difficulty levels."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-blue-500" />}
              title="Real-time Multiplayer"
              desc="Smooth, lag-free gameplay powered by WebSocket technology."
            />
            <FeatureCard 
              icon={<Trophy className="w-8 h-8 text-red-500" />}
              title="Instant Play"
              desc="No accounts needed. Just jump in and start connecting four!"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border/50">
        <p>&copy; 2024 Connect Four Online. Built with ❤️</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-background p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-display font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
