import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy } from "lucide-react";
import type { Leaderboard } from "@shared/schema";

const GAME_TYPES = [
  { id: 'connect4', name: 'Connect 4' },
  { id: 'chess', name: 'Chess' },
  { id: 'checkers', name: 'Checkers' },
  { id: 'mancala', name: 'Mancala' },
];

export function Leaderboard() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <CardTitle>Leaderboards</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connect4">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            {GAME_TYPES.map((game) => (
              <TabsTrigger key={game.id} value={game.id} data-testid={`tab-leaderboard-${game.id}`}>
                {game.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {GAME_TYPES.map((game) => (
            <TabsContent key={game.id} value={game.id}>
              <LeaderboardTable gameType={game.id} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function LeaderboardTable({ gameType }: { gameType: string }) {
  const { data: leaderboard, isLoading } = useQuery<Leaderboard[]>({
    queryKey: [`/api/leaderboard/${gameType}`],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No records yet. Be the first to win!
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Wins</TableHead>
          <TableHead className="text-right">Losses</TableHead>
          <TableHead className="text-right">Draws</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaderboard.map((entry, index) => (
          <TableRow key={entry.id}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>{entry.userId}</TableCell>
            <TableCell className="text-right">{entry.wins}</TableCell>
            <TableCell className="text-right">{entry.losses}</TableCell>
            <TableCell className="text-right">{entry.draws}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
