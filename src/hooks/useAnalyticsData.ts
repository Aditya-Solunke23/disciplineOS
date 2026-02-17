import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfDay } from "date-fns";

export type DailyFocus = { date: string; minutes: number };
export type DailyTasks = { date: string; completed: number; added: number };
export type DailyReading = { date: string; pages: number };

export function useAnalyticsData(days = 14) {
  const { user } = useAuth();
  const since = subDays(startOfDay(new Date()), days - 1).toISOString();

  const focusQuery = useQuery({
    queryKey: ["analytics", "focus", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("duration_minutes, completed, started_at")
        .gte("started_at", since)
        .eq("completed", true);
      if (error) throw error;

      const map: Record<string, number> = {};
      for (let i = 0; i < days; i++) {
        map[format(subDays(new Date(), i), "yyyy-MM-dd")] = 0;
      }
      data?.forEach((s) => {
        const d = format(new Date(s.started_at), "yyyy-MM-dd");
        if (map[d] !== undefined) map[d] += s.duration_minutes;
      });

      return Object.entries(map)
        .map(([date, minutes]) => ({ date, minutes }))
        .sort((a, b) => a.date.localeCompare(b.date)) as DailyFocus[];
    },
    enabled: !!user,
  });

  const tasksQuery = useQuery({
    queryKey: ["analytics", "tasks", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("completed, created_at, updated_at")
        .gte("created_at", since);
      if (error) throw error;

      const addedMap: Record<string, number> = {};
      const completedMap: Record<string, number> = {};
      for (let i = 0; i < days; i++) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        addedMap[d] = 0;
        completedMap[d] = 0;
      }
      data?.forEach((t) => {
        const created = format(new Date(t.created_at), "yyyy-MM-dd");
        if (addedMap[created] !== undefined) addedMap[created]++;
        if (t.completed) {
          const updated = format(new Date(t.updated_at), "yyyy-MM-dd");
          if (completedMap[updated] !== undefined) completedMap[updated]++;
        }
      });

      return Object.keys(addedMap)
        .sort()
        .map((date) => ({
          date,
          added: addedMap[date],
          completed: completedMap[date],
        })) as DailyTasks[];
    },
    enabled: !!user,
  });

  const readingQuery = useQuery({
    queryKey: ["analytics", "reading"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("title, current_page, total_pages, completed");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return { focusQuery, tasksQuery, readingQuery };
}
