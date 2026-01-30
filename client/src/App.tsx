import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AppContent() {
  const [nickname, setNickname] = useState<string | null>(localStorage.getItem("nickname"));
  const [tempNickname, setTempNickname] = useState("");

  if (!nickname) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="arcade-card p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">GH</div>
          <h1 className="text-4xl font-display font-bold tracking-tight">GameHub</h1>
          <p className="text-muted-foreground">Enter a nickname to start playing.</p>
          
          <div className="space-y-4">
            <Input 
              placeholder="Your Nickname" 
              value={tempNickname} 
              onChange={(e) => setTempNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tempNickname.trim()) {
                  localStorage.setItem("nickname", tempNickname.trim());
                  setNickname(tempNickname.trim());
                }
              }}
            />
            <Button 
              className="w-full" 
              disabled={!tempNickname.trim()}
              onClick={() => {
                localStorage.setItem("nickname", tempNickname.trim());
                setNickname(tempNickname.trim());
              }}
            >
              Start Playing
            </Button>
          </div>
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
