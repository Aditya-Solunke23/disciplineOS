import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Timer, ShieldAlert, Wallet, BookOpen, Zap, Flame, Quote, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useTasks } from "@/hooks/useTasks";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useFinances } from "@/hooks/useFinances";
import { useBooks } from "@/hooks/useBooks";
import { useHealthLogs, WATER_GOAL, STRETCH_GOAL, EXERCISE_GOAL } from "@/hooks/useHealthLogs";
import { useGamification } from "@/hooks/useGamification";
import { useMemo } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const quotes = [
  "Discipline is choosing between what you want now and what you want most.",
  "The pain of discipline is nothing compared to the pain of regret.",
  "Small daily improvements are the key to staggering long-term results.",
  "You don't have to be extreme. Just consistent.",
  "What you do every day matters more than what you do once in a while.",
];

const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { tasksQuery } = useTasks("today");
  const { todaySessionsQuery } = useFocusSessions();
  const { transactionsQuery } = useFinances();
  const { booksQuery } = useBooks();
  const { todayLog } = useHealthLogs();
  const { xp, level, streak, xpForNextLevel, xpProgress, unlockedCount, totalCount, isLoading: gamLoading } = useGamification();

  const todayTasks = tasksQuery.data ?? [];
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;

  const focusMinutes = useMemo(() => {
    const sessions = todaySessionsQuery.data ?? [];
    return sessions.filter((s) => s.completed).reduce((sum, s) => sum + s.duration_minutes, 0);
  }, [todaySessionsQuery.data]);

  const focusH = Math.floor(focusMinutes / 60);
  const focusM = focusMinutes % 60;

  const monthlyBalance = useMemo(() => {
    const txs = transactionsQuery.data ?? [];
    const now = new Date();
    const month = format(now, "yyyy-MM");
    return txs
      .filter((t) => t.transaction_date.startsWith(month))
      .reduce((sum, t) => sum + (t.transaction_type === "income" ? t.amount : -t.amount), 0);
  }, [transactionsQuery.data]);

  const activeBook = useMemo(() => {
    const books = booksQuery.data ?? [];
    return books.find((b) => !b.completed) ?? null;
  }, [booksQuery.data]);

  const readingLabel = activeBook
    ? `${activeBook.current_page} / ${activeBook.total_pages} pages`
    : "No active book";

  const readingProgress = activeBook
    ? Math.round((activeBook.current_page / activeBook.total_pages) * 100)
    : 0;

  const healthScore = useMemo(() => {
    if (!todayLog) return null;
    const w = Math.min(todayLog.water_glasses / WATER_GOAL, 1);
    const s = Math.min(todayLog.stretching_minutes / STRETCH_GOAL, 1);
    const e = Math.min(todayLog.exercise_minutes / EXERCISE_GOAL, 1);
    return Math.round(((w + s + e) / 3) * 100);
  }, [todayLog]);

  const isLoading = tasksQuery.isLoading || todaySessionsQuery.isLoading || transactionsQuery.isLoading || booksQuery.isLoading || gamLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground text-sm">Your discipline starts here.</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Quote className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm italic text-muted-foreground">{randomQuote}</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* XP & Level */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Level & XP</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-3xl font-bold font-mono">Lv. {level}</div>
                  <p className="text-xs text-muted-foreground mt-1">{xp} / {xpForNextLevel} XP</p>
                  <Progress value={xpProgress} className="mt-2 h-2" />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Daily Streak</CardTitle>
              <Flame className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-3xl font-bold font-mono">{streak} <span className="text-base font-normal text-muted-foreground">days</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{streak > 0 ? "Keep it going!" : "Stay consistent to build your streak"}</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Tasks */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {tasksQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-3xl font-bold font-mono">{completedToday} <span className="text-base font-normal text-muted-foreground">/ {totalToday}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{totalToday === 0 ? "No tasks yet — add some!" : completedToday === totalToday ? "All done! 🎉" : `${totalToday - completedToday} remaining`}</p>
                  {totalToday > 0 && <Progress value={(completedToday / totalToday) * 100} className="mt-2 h-2" />}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Focus Timer */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Focus Today</CardTitle>
              <Timer className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              {todaySessionsQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-3xl font-bold font-mono">{focusH}h {focusM}m</div>
                  <p className="text-xs text-muted-foreground mt-1">{focusMinutes > 0 ? `${(todaySessionsQuery.data ?? []).filter(s => s.completed).length} sessions completed` : "Start a focus session"}</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Health Score */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Heart className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <>
                <div className="text-3xl font-bold font-mono">{healthScore ?? 0}<span className="text-base font-normal text-muted-foreground">%</span></div>
                <p className="text-xs text-muted-foreground mt-1">{todayLog ? `💧${todayLog.water_glasses} 🧘${todayLog.stretching_minutes}m 🏃${todayLog.exercise_minutes}m` : "Log your health today"}</p>
                {healthScore !== null && <Progress value={healthScore} className="mt-2 h-2" />}
              </>
            </CardContent>
          </Card>
        </motion.div>

        {/* Finance Summary */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Balance</CardTitle>
              <Wallet className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              {transactionsQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className={`text-3xl font-bold font-mono ${monthlyBalance >= 0 ? "text-chart-2" : "text-destructive"}`}>
                    {monthlyBalance >= 0 ? "+" : ""}${Math.abs(monthlyBalance).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(transactionsQuery.data ?? []).length} transactions this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Reading */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reading Progress</CardTitle>
              <BookOpen className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              {booksQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-3xl font-bold font-mono">{readingProgress}<span className="text-base font-normal text-muted-foreground">%</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{readingLabel}</p>
                  {activeBook && <Progress value={readingProgress} className="mt-2 h-2" />}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Achievements</CardTitle>
              <ShieldAlert className="h-4 w-4 text-chart-5" />
            </CardHeader>
            <CardContent>
              {gamLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-3xl font-bold font-mono">{unlockedCount} <span className="text-base font-normal text-muted-foreground">/ {totalCount}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{unlockedCount === 0 ? "Start unlocking badges!" : `${totalCount - unlockedCount} remaining`}</p>
                  <Progress value={(unlockedCount / totalCount) * 100} className="mt-2 h-2" />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
