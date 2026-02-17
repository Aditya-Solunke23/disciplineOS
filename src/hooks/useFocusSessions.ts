import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type FocusSession = {
  id: string;
  user_id: string;
  duration_minutes: number;
  session_type: string;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
};

export function useFocusSessions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const todaySessionsQuery = useQuery({
    queryKey: ["focus-sessions", "today"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("*")
        .gte("started_at", today.toISOString())
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data as FocusSession[];
    },
    enabled: !!user,
  });

  const startSession = useMutation({
    mutationFn: async ({ duration_minutes, session_type }: { duration_minutes: number; session_type: string }) => {
      const { data, error } = await supabase
        .from("focus_sessions")
        .insert({ user_id: user!.id, duration_minutes, session_type })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["focus-sessions"] }),
    onError: () => toast.error("Failed to start session"),
  });

  const completeSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("focus_sessions")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["focus-sessions"] });
      toast.success("Focus session completed! 🎯");
    },
    onError: () => toast.error("Failed to save session"),
  });

  return { todaySessionsQuery, startSession, completeSession };
}
