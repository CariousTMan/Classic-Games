import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import robotSticker from "@/assets/im-not-a-robot.png";

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="arcade-card p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">GH</div>
          <h1 className="text-4xl font-display font-bold tracking-tight">GameHub</h1>
          <p className="text-muted-foreground">The ultimate destination for classic board games. Play Connect 4, Chess, Checkers, and Mancala with friends or AI.</p>
          
          <div className="flex flex-col items-center gap-4 py-4">
            <Button asChild size="lg" className="w-full arcade-btn text-lg py-6">
              <a href="/api/login">Login to Play</a>
            </Button>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-md shadow-sm w-full">
              <div className="w-6 h-6 border-2 border-slate-300 rounded" />
              <span className="text-sm font-medium text-slate-600">I'm not a robot</span>
              <img src={robotSticker} alt="Not a robot" className="w-8 h-8 ml-auto opacity-80" />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">Powered by Replit Auth</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
