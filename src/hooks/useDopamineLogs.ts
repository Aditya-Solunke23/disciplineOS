import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, subDays, differenceInCalendarDays } from "date-fns";

export type DopamineLog = {
  id: string;
  user_id: string;
  log_date: string;
  time_spent_minutes: number;
  daily_limit_minutes: number;
  notes: string | null;
  created_at: string;
};

export function useDopamineLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todayLogQuery = useQuery({
    queryKey: ["dopamine-log", "today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dopamine_logs")
        .select("*")
        .eq("log_date", todayStr)
        .maybeSingle();
      if (error) throw error;
      return data as DopamineLog | null;
    },
    enabled: !!user,
  });

  const recentLogsQuery = useQuery({
    queryKey: ["dopamine-logs", "recent"],
    queryFn: async () => {
      const weekAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("dopamine_logs")
        .select("*")
        .gte("log_date", weekAgo)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data as DopamineLog[];
    },
    enabled: !!user,
  });

  const upsertLog = useMutation({
    mutationFn: async (log: { time_spent_minutes: number; daily_limit_minutes: number; notes?: string | null }) => {
      const existing = todayLogQuery.data;
      if (existing) {
        const { data, error } = await supabase
          .from("dopamine_logs")
          .update(log)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("dopamine_logs")
          .insert({ ...log, user_id: user!.id, log_date: todayStr })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dopamine-log"] });
      queryClient.invalidateQueries({ queryKey: ["dopamine-logs"] });
      toast.success("Dopamine log saved");
    },
    onError: () => toast.error("Failed to save log"),
  });

  // Calculate streak (consecutive days within limit)
  const calculateStreak = (logs: DopamineLog[]) => {
    if (!logs.length) return 0;
    const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sorted.length; i++) {
      const log = sorted[i];
      const logDate = new Date(log.log_date);
      const expectedDay = subDays(today, i);
      const diff = differenceInCalendarDays(expectedDay, logDate);
      
      if (diff > 1) break;
      if (log.time_spent_minutes <= log.daily_limit_minutes) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Dopamine score: 100 = no time wasted, 0 = at/over limit
  const calculateScore = (log: DopamineLog | null) => {
    if (!log) return 100;
    if (log.daily_limit_minutes === 0) return log.time_spent_minutes === 0 ? 100 : 0;
    const ratio = log.time_spent_minutes / log.daily_limit_minutes;
    return Math.max(0, Math.round((1 - ratio) * 100));
  };

  return {
    todayLogQuery,
    recentLogsQuery,
    upsertLog,
    calculateStreak,
    calculateScore,
  };
}
