import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "tasks" | "focus" | "health" | "reading" | "dopamine" | "streak" | "finance";
  requirement: number;
  unlocked: boolean;
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlocked">[] = [
  // Tasks
  { id: "tasks_1", name: "First Step", description: "Complete your first task", icon: "✅", category: "tasks", requirement: 1 },
  { id: "tasks_10", name: "Task Crusher", description: "Complete 10 tasks", icon: "💪", category: "tasks", requirement: 10 },
  { id: "tasks_50", name: "Productivity Machine", description: "Complete 50 tasks", icon: "⚡", category: "tasks", requirement: 50 },
  { id: "tasks_100", name: "Centurion", description: "Complete 100 tasks", icon: "🏆", category: "tasks", requirement: 100 },
  // Focus
  { id: "focus_1", name: "Laser Focus", description: "Complete 1 focus session", icon: "🎯", category: "focus", requirement: 1 },
  { id: "focus_10", name: "Deep Worker", description: "Complete 10 focus sessions", icon: "🧠", category: "focus", requirement: 10 },
  { id: "focus_50", name: "Flow State Master", description: "Complete 50 focus sessions", icon: "🔥", category: "focus", requirement: 50 },
  // Health
  { id: "health_7", name: "Health Habit", description: "Log health 7 days", icon: "💚", category: "health", requirement: 7 },
  { id: "health_30", name: "Wellness Warrior", description: "Log health 30 days", icon: "🏋️", category: "health", requirement: 30 },
  // Reading
  { id: "books_1", name: "Bookworm", description: "Finish your first book", icon: "📖", category: "reading", requirement: 1 },
  { id: "books_5", name: "Avid Reader", description: "Finish 5 books", icon: "📚", category: "reading", requirement: 5 },
  // Dopamine
  { id: "dopamine_7", name: "Digital Detox", description: "Stay under limit 7 days", icon: "🛡️", category: "dopamine", requirement: 7 },
  { id: "dopamine_30", name: "Mind Fortress", description: "Stay under limit 30 days", icon: "🏰", category: "dopamine", requirement: 30 },
  // Streak
  { id: "streak_3", name: "On a Roll", description: "3-day activity streak", icon: "🔥", category: "streak", requirement: 3 },
  { id: "streak_7", name: "Week Warrior", description: "7-day activity streak", icon: "⭐", category: "streak", requirement: 7 },
  { id: "streak_30", name: "Monthly Legend", description: "30-day activity streak", icon: "👑", category: "streak", requirement: 30 },
  // Finance
  { id: "finance_10", name: "Budget Tracker", description: "Log 10 transactions", icon: "💰", category: "finance", requirement: 10 },
  { id: "finance_50", name: "Financial Guru", description: "Log 50 transactions", icon: "📊", category: "finance", requirement: 50 },
];

interface ActivityCounts {
  completedTasks: number;
  completedFocus: number;
  healthDays: number;
  completedBooks: number;
  dopamineUnderLimit: number;
  transactions: number;
  streakDays: number;
}

function computeAchievements(counts: ActivityCounts): Achievement[] {
  const getCount = (cat: Achievement["category"]): number => {
    switch (cat) {
      case "tasks": return counts.completedTasks;
      case "focus": return counts.completedFocus;
      case "health": return counts.healthDays;
      case "reading": return counts.completedBooks;
      case "dopamine": return counts.dopamineUnderLimit;
      case "streak": return counts.streakDays;
      case "finance": return counts.transactions;
    }
  };

  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    unlocked: getCount(def.category) >= def.requirement,
  }));
}

export function useGamification() {
  const { user } = useAuth();

  const gamificationQuery = useQuery({
    queryKey: ["gamification", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gamification")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activityQuery = useQuery({
    queryKey: ["achievement-counts", user?.id],
    queryFn: async () => {
      const [tasks, focus, health, books, dopamine, finances] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("completed", true),
        supabase.from("focus_sessions").select("id", { count: "exact", head: true }).eq("completed", true),
        supabase.from("health_logs").select("id", { count: "exact", head: true }),
        supabase.from("books").select("id", { count: "exact", head: true }).eq("completed", true),
        supabase.from("dopamine_logs").select("*"),
        supabase.from("finances").select("id", { count: "exact", head: true }),
      ]);

      const dopamineUnder = (dopamine.data ?? []).filter(
        (d) => d.time_spent_minutes <= d.daily_limit_minutes
      ).length;

      const counts: ActivityCounts = {
        completedTasks: tasks.count ?? 0,
        completedFocus: focus.count ?? 0,
        healthDays: health.count ?? 0,
        completedBooks: books.count ?? 0,
        dopamineUnderLimit: dopamineUnder,
        transactions: finances.count ?? 0,
        streakDays: gamificationQuery.data?.streak_days ?? 0,
      };

      return counts;
    },
    enabled: !!user && !gamificationQuery.isLoading,
  });

  const counts = activityQuery.data;
  const achievements = counts ? computeAchievements(counts) : [];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const xp = gamificationQuery.data?.xp ?? 0;
  const level = gamificationQuery.data?.level ?? 1;
  const streak = gamificationQuery.data?.streak_days ?? 0;
  const xpForNextLevel = level * 500;
  const xpProgress = Math.min((xp / xpForNextLevel) * 100, 100);

  return {
    achievements,
    unlockedCount,
    totalCount,
    xp,
    level,
    streak,
    xpForNextLevel,
    xpProgress,
    counts,
    isLoading: gamificationQuery.isLoading || activityQuery.isLoading,
  };
}
