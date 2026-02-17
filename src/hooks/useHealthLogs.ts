import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays } from "date-fns";

export interface HealthLog {
  id: string;
  user_id: string;
  log_date: string;
  water_glasses: number;
  stretching_minutes: number;
  exercise_minutes: number;
  exercise_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const EXERCISE_TYPES = ["Walking", "Running", "Gym", "Yoga", "Swimming", "Cycling", "HIIT", "Sports", "Other"];
export const WATER_GOAL = 8;
export const STRETCH_GOAL = 15;
export const EXERCISE_GOAL = 30;

export function useHealthLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["health_logs", user?.id],
    queryFn: async () => {
      const from = format(subDays(new Date(), 13), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("health_logs")
        .select("*")
        .gte("log_date", from)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data as HealthLog[];
    },
    enabled: !!user,
  });

  const todayLog = logs.find((l) => l.log_date === today) ?? null;

  const upsertLog = useMutation({
    mutationFn: async (values: Partial<HealthLog>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("health_logs")
        .upsert(
          { ...values, user_id: user.id, log_date: values.log_date ?? today },
          { onConflict: "user_id,log_date" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["health_logs"] }),
  });

  return { logs, todayLog, isLoading, upsertLog, today };
}
