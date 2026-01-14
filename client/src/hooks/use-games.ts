import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGames() {
  return useQuery({
    queryKey: [api.games.list.path],
    queryFn: async () => {
      const res = await fetch(api.games.list.path);
      if (!res.ok) throw new Error("Failed to fetch games history");
      return api.games.list.responses[200].parse(await res.json());
    }
  });
}
