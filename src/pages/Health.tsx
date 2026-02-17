import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Heart, Droplets, StretchHorizontal, Dumbbell, Plus, Minus, TrendingUp, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useHealthLogs, WATER_GOAL, STRETCH_GOAL, EXERCISE_GOAL, EXERCISE_TYPES } from "@/hooks/useHealthLogs";
import { useHealthNotifications, type ReminderType } from "@/hooks/useHealthNotifications";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Health() {
  const { logs, todayLog, isLoading, upsertLog, today } = useHealthLogs();
  const { config, updateConfig, permission, requestPermission } = useHealthNotifications();
  const [exerciseType, setExerciseType] = useState("");
  const [exerciseMin, setExerciseMin] = useState("");
  const [stretchMin, setStretchMin] = useState("");
  const [notes, setNotes] = useState("");

  const water = todayLog?.water_glasses ?? 0;
  const stretch = todayLog?.stretching_minutes ?? 0;
  const exercise = todayLog?.exercise_minutes ?? 0;

  const addWater = (delta: number) => {
    const next = Math.max(0, water + delta);
    upsertLog.mutate({ water_glasses: next, stretching_minutes: stretch, exercise_minutes: exercise });
  };

  const logExercise = () => {
    const mins = parseInt(exerciseMin) || 0;
    if (mins <= 0) return;
    upsertLog.mutate(
      { exercise_minutes: exercise + mins, exercise_type: exerciseType || null, water_glasses: water, stretching_minutes: stretch },
      { onSuccess: () => { setExerciseMin(""); toast({ title: "Exercise logged!" }); } }
    );
  };

  const logStretching = () => {
    const mins = parseInt(stretchMin) || 0;
    if (mins <= 0) return;
    upsertLog.mutate(
      { stretching_minutes: stretch + mins, water_glasses: water, exercise_minutes: exercise },
      { onSuccess: () => { setStretchMin(""); toast({ title: "Stretching logged!" }); } }
    );
  };

  // Chart data – last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const log = logs.find((l) => l.log_date === d);
    return {
      day: format(subDays(new Date(), 6 - i), "EEE"),
      Water: log?.water_glasses ?? 0,
      Stretch: log?.stretching_minutes ?? 0,
      Exercise: log?.exercise_minutes ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Health & Discipline</h1>
        <p className="text-muted-foreground text-sm">Take care of your body to fuel your mind.</p>
      </div>

      {/* Today's Progress */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Water */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Water Intake</CardTitle>
              <Droplets className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold font-mono">{water} <span className="text-base font-normal text-muted-foreground">/ {WATER_GOAL} glasses</span></div>
              <Progress value={Math.min((water / WATER_GOAL) * 100, 100)} className="h-2" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => addWater(-1)} disabled={water <= 0}><Minus className="h-4 w-4" /></Button>
                <Button size="sm" onClick={() => addWater(1)}><Plus className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stretching */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stretching</CardTitle>
              <StretchHorizontal className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold font-mono">{stretch} <span className="text-base font-normal text-muted-foreground">/ {STRETCH_GOAL} min</span></div>
              <Progress value={Math.min((stretch / STRETCH_GOAL) * 100, 100)} className="h-2" />
              <div className="flex gap-2">
                <Input type="number" placeholder="Minutes" value={stretchMin} onChange={(e) => setStretchMin(e.target.value)} className="w-24" />
                <Button size="sm" onClick={logStretching}>Log</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Exercise */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Exercise</CardTitle>
              <Dumbbell className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold font-mono">{exercise} <span className="text-base font-normal text-muted-foreground">/ {EXERCISE_GOAL} min</span></div>
              <Progress value={Math.min((exercise / EXERCISE_GOAL) * 100, 100)} className="h-2" />
              <div className="flex gap-2">
                <Select value={exerciseType} onValueChange={setExerciseType}>
                  <SelectTrigger className="w-28"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{EXERCISE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="Min" value={exerciseMin} onChange={(e) => setExerciseMin(e.target.value)} className="w-20" />
                <Button size="sm" onClick={logExercise}>Log</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* 7-day chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> 7-Day Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Legend />
                  <Bar dataKey="Water" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Stretch" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Exercise" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Health Reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {permission !== "granted" && (
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm text-muted-foreground">Enable browser notifications for health reminders</p>
                <Button size="sm" onClick={async () => {
                  const perm = await requestPermission();
                  if (perm === "granted") toast({ title: "Notifications enabled!" });
                  else toast({ title: "Notifications blocked", description: "Please allow notifications in your browser settings.", variant: "destructive" });
                }}>Enable</Button>
              </div>
            )}
            {(["water", "stretch", "exercise"] as ReminderType[]).map((type) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config[type].enabled}
                    onCheckedChange={(checked) => updateConfig(type, { enabled: checked })}
                    disabled={permission !== "granted"}
                  />
                  <div>
                    <p className="text-sm font-medium capitalize">{type} reminder</p>
                    <p className="text-xs text-muted-foreground">Every {config[type].intervalMinutes} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={5}
                    max={180}
                    value={config[type].intervalMinutes}
                    onChange={(e) => updateConfig(type, { intervalMinutes: parseInt(e.target.value) || 30 })}
                    className="w-20"
                    disabled={permission !== "granted"}
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Notes */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Daily Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="How are you feeling today? Any health observations..."
              value={notes || todayLog?.notes || ""}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              size="sm"
              onClick={() => {
                upsertLog.mutate(
                  { notes, water_glasses: water, stretching_minutes: stretch, exercise_minutes: exercise },
                  { onSuccess: () => toast({ title: "Notes saved!" }) }
                );
              }}
            >
              Save Notes
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
