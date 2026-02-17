import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { ShieldAlert, Flame, TrendingDown, Trophy, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDopamineLogs } from "@/hooks/useDopamineLogs";
import { format } from "date-fns";

export default function Dopamine() {
  const { todayLogQuery, recentLogsQuery, upsertLog, calculateStreak, calculateScore } = useDopamineLogs();

  const todayLog = todayLogQuery.data;
  const recentLogs = recentLogsQuery.data ?? [];
  const streak = calculateStreak(recentLogs);
  const score = calculateScore(todayLog);

  const [timeSpent, setTimeSpent] = useState<number>(todayLog?.time_spent_minutes ?? 0);
  const [dailyLimit, setDailyLimit] = useState<number>(todayLog?.daily_limit_minutes ?? 60);
  const [notes, setNotes] = useState(todayLog?.notes ?? "");
  const [initialized, setInitialized] = useState(false);

  // Sync state when data loads
  if (todayLog && !initialized) {
    setTimeSpent(todayLog.time_spent_minutes);
    setDailyLimit(todayLog.daily_limit_minutes);
    setNotes(todayLog.notes ?? "");
    setInitialized(true);
  }

  const handleSave = () => {
    upsertLog.mutate({
      time_spent_minutes: timeSpent,
      daily_limit_minutes: dailyLimit,
      notes: notes.trim() || null,
    });
  };

  const overLimit = timeSpent > dailyLimit;
  const usagePercent = dailyLimit > 0 ? Math.min(100, (timeSpent / dailyLimit) * 100) : 0;

  const scoreColor = score >= 80 ? "text-emerald-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const scoreLabel = score >= 80 ? "Disciplined" : score >= 50 ? "Moderate" : "Needs Work";

  if (todayLogQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dopamine Control</h1>
        <p className="text-muted-foreground text-sm">Master your impulses. Report honestly.</p>
      </div>

      {/* Score cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Today's Score</p>
                <p className={cn("text-3xl font-bold font-mono mt-1", scoreColor)}>{score}</p>
                <p className={cn("text-xs mt-0.5", scoreColor)}>{scoreLabel}</p>
              </div>
              <ShieldAlert className={cn("h-8 w-8", scoreColor)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
                <p className="text-3xl font-bold font-mono mt-1">{streak}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">Consecutive within limit</p>
              </div>
              <Flame className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Usage</p>
                <p className="text-3xl font-bold font-mono mt-1">
                  {timeSpent}<span className="text-sm font-normal text-muted-foreground">/{dailyLimit}m</span>
                </p>
                <p className={cn("text-xs mt-0.5", overLimit ? "text-red-400" : "text-muted-foreground")}>
                  {overLimit ? "Over limit!" : `${dailyLimit - timeSpent}m remaining`}
                </p>
              </div>
              <TrendingDown className={cn("h-8 w-8", overLimit ? "text-red-400" : "text-muted-foreground")} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Log Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Today's Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Usage bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Time spent on distractions</span>
                <span className={cn(overLimit && "text-red-400 font-medium")}>{timeSpent} / {dailyLimit} min</span>
              </div>
              <Progress
                value={usagePercent}
                className={cn("h-2", overLimit && "[&>div]:bg-red-500")}
              />
            </div>

            {/* Time spent slider */}
            <div className="space-y-3">
              <Label className="text-sm">Time spent (minutes)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[timeSpent]}
                  onValueChange={([v]) => setTimeSpent(v)}
                  max={Math.max(180, dailyLimit * 2)}
                  step={5}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
            </div>

            {/* Daily limit */}
            <div className="space-y-3">
              <Label className="text-sm">Daily limit commitment (minutes)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[dailyLimit]}
                  onValueChange={([v]) => setDailyLimit(v)}
                  max={180}
                  step={5}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you consume? How did it make you feel?"
                rows={2}
              />
            </div>

            <Button onClick={handleSave} disabled={upsertLog.isPending} className="gap-2">
              <Save className="h-4 w-4" /> Save Today's Log
            </Button>
          </CardContent>
        </Card>

        {/* Recent history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" /> Recent History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No logs yet. Start tracking today.</p>
            ) : (
              <div className="space-y-2">
                {recentLogs.slice(0, 10).map((log) => {
                  const within = log.time_spent_minutes <= log.daily_limit_minutes;
                  const logScore = calculateScore(log);
                  return (
                    <div key={log.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", within ? "bg-emerald-400" : "bg-red-400")} />
                        <span className="text-muted-foreground">{format(new Date(log.log_date), "MMM d")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{log.time_spent_minutes}/{log.daily_limit_minutes}m</span>
                        <Badge variant="outline" className={cn(
                          "text-[10px] px-1.5",
                          logScore >= 80 ? "text-emerald-400 border-emerald-500/30" :
                          logScore >= 50 ? "text-yellow-400 border-yellow-500/30" :
                          "text-red-400 border-red-500/30"
                        )}>
                          {logScore}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
