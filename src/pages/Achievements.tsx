import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Star, Zap, Lock } from "lucide-react";
import { useGamification, type Achievement } from "@/hooks/useGamification";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_LABELS: Record<Achievement["category"], string> = {
  tasks: "Tasks",
  focus: "Focus",
  health: "Health",
  reading: "Reading",
  dopamine: "Dopamine",
  streak: "Streaks",
  finance: "Finances",
};

export default function Achievements() {
  const {
    achievements, unlockedCount, totalCount,
    xp, level, streak, xpForNextLevel, xpProgress, isLoading,
  } = useGamification();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground text-sm">Your discipline milestones.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const categories = [...new Set(achievements.map((a) => a.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground text-sm">Your discipline milestones.</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Level {level}</p>
                <p className="text-lg font-bold">{xp} / {xpForNextLevel} XP</p>
                <Progress value={xpProgress} className="mt-1 h-1.5" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-chart-4/10">
                <Flame className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-lg font-bold">{streak} day{streak !== 1 ? "s" : ""}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-chart-3/10">
                <Trophy className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unlocked</p>
                <p className="text-lg font-bold">{unlockedCount} / {totalCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Badges by category */}
      {categories.map((cat) => {
        const catAchievements = achievements.filter((a) => a.category === cat);
        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {CATEGORY_LABELS[cat]}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {catAchievements.filter((a) => a.unlocked).length}/{catAchievements.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {catAchievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        ach.unlocked
                          ? "bg-primary/5 border-primary/20"
                          : "opacity-50 border-border"
                      }`}
                    >
                      <span className="text-2xl">{ach.unlocked ? ach.icon : ""}</span>
                      {!ach.unlocked && (
                        <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{ach.name}</p>
                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
