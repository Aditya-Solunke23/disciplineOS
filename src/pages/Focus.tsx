import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Clock, Flame } from "lucide-react";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { motion, AnimatePresence } from "framer-motion";

const POMODORO_WORK = 25;
const POMODORO_BREAK = 5;

type TimerMode = "pomodoro" | "custom";
type TimerState = "idle" | "running" | "paused" | "break";

export default function Focus() {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [customMinutes, setCustomMinutes] = useState(45);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_WORK * 60);
  const [totalSeconds, setTotalSeconds] = useState(POMODORO_WORK * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [driftWarning, setDriftWarning] = useState(false);
  const activeSessionId = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { todaySessionsQuery, startSession, completeSession } = useFocusSessions();
  const sessions = todaySessionsQuery.data ?? [];
  const completedToday = sessions.filter((s) => s.completed).length;
  const totalFocusMinutes = sessions.filter((s) => s.completed).reduce((sum, s) => sum + s.duration_minutes, 0);

  // Tab-leave detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && timerState === "running") {
        setDriftWarning(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [timerState]);

  // Timer countdown
  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]);

  const handleTimerComplete = useCallback(() => {
    if (activeSessionId.current) {
      completeSession.mutate(activeSessionId.current);
      activeSessionId.current = null;
    }
    if (mode === "pomodoro") {
      setPomodoroCount((c) => c + 1);
      setTimerState("break");
      setSecondsLeft(POMODORO_BREAK * 60);
      setTotalSeconds(POMODORO_BREAK * 60);
    } else {
      setTimerState("idle");
    }
  }, [mode, completeSession]);

  const handleStart = async () => {
    const minutes = mode === "pomodoro" ? POMODORO_WORK : customMinutes;
    const secs = minutes * 60;

    if (timerState === "paused") {
      setTimerState("running");
      return;
    }

    if (timerState === "break") {
      setSecondsLeft(POMODORO_WORK * 60);
      setTotalSeconds(POMODORO_WORK * 60);
    } else {
      setSecondsLeft(secs);
      setTotalSeconds(secs);
    }

    try {
      const result = await startSession.mutateAsync({
        duration_minutes: minutes,
        session_type: mode,
      });
      activeSessionId.current = result.id;
    } catch {}

    setTimerState("running");
    setDriftWarning(false);
  };

  const handlePause = () => setTimerState("paused");

  const handleReset = () => {
    setTimerState("idle");
    activeSessionId.current = null;
    const mins = mode === "pomodoro" ? POMODORO_WORK : customMinutes;
    setSecondsLeft(mins * 60);
    setTotalSeconds(mins * 60);
    setDriftWarning(false);
  };

  const handleModeChange = (m: string) => {
    if (timerState !== "idle") return;
    setMode(m as TimerMode);
    const mins = m === "pomodoro" ? POMODORO_WORK : customMinutes;
    setSecondsLeft(mins * 60);
    setTotalSeconds(mins * 60);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deep Work</h1>
        <p className="text-muted-foreground text-sm">Lock in. Execute. No distractions.</p>
      </div>

      <AnimatePresence>
        {driftWarning && timerState === "running" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4"
          >
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-300">You are drifting. Return to your mission.</p>
              <p className="text-xs text-yellow-400/70 mt-0.5">Tab switch detected during focus session.</p>
            </div>
            <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20" onClick={() => setDriftWarning(false)}>
              Dismiss
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Select value={mode} onValueChange={handleModeChange} disabled={timerState !== "idle"}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pomodoro">Pomodoro (25/5)</SelectItem>
                  <SelectItem value="custom">Custom Timer</SelectItem>
                </SelectContent>
              </Select>
              {mode === "custom" && timerState === "idle" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    value={customMinutes}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 1;
                      setCustomMinutes(v);
                      setSecondsLeft(v * 60);
                      setTotalSeconds(v * 60);
                    }}
                    className="w-20"
                  />
                  <Label className="text-sm text-muted-foreground">min</Label>
                </div>
              )}
            </div>

            <div className="flex justify-center mb-8">
              <div className="relative w-64 h-64">
                <svg className="w-64 h-64 -rotate-90" viewBox="0 0 256 256">
                  <circle cx="128" cy="128" r="120" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" opacity="0.3" />
                  <circle
                    cx="128" cy="128" r="120"
                    stroke={timerState === "break" ? "hsl(var(--accent))" : "hsl(var(--primary))"}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-mono font-bold tracking-wider">{formatTime(secondsLeft)}</span>
                  <span className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">
                    {timerState === "break" ? "Break" : timerState === "idle" ? "Ready" : timerState === "paused" ? "Paused" : "Focusing"}
                  </span>
                  {mode === "pomodoro" && (
                    <span className="text-xs text-muted-foreground mt-1">Session #{pomodoroCount + 1}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              {(timerState === "idle" || timerState === "break") && (
                <Button onClick={handleStart} size="lg" className="gap-2 min-w-32">
                  <Play className="h-4 w-4" />
                  {timerState === "break" ? "Next Session" : "Start"}
                </Button>
              )}
              {timerState === "running" && (
                <Button onClick={handlePause} variant="secondary" size="lg" className="gap-2 min-w-32">
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              )}
              {timerState === "paused" && (
                <Button onClick={handleStart} size="lg" className="gap-2 min-w-32">
                  <Play className="h-4 w-4" /> Resume
                </Button>
              )}
              {timerState !== "idle" && (
                <Button onClick={handleReset} variant="ghost" size="lg" className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" /> Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{totalFocusMinutes}<span className="text-sm font-normal text-muted-foreground ml-1">min</span></div>
              <p className="text-xs text-muted-foreground mt-1">{completedToday} sessions completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sessions today yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {s.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="capitalize">{s.session_type}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{s.duration_minutes}m</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
