import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart3, Timer, CheckSquare, BookOpen, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const focusConfig = {
  minutes: { label: "Focus (min)", color: "hsl(var(--chart-1))" },
};

const tasksConfig = {
  completed: { label: "Completed", color: "hsl(var(--chart-1))" },
  added: { label: "Added", color: "hsl(var(--chart-2))" },
};

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function formatDateLabel(dateStr: string) {
  return format(parseISO(dateStr), "MMM d");
}

export default function Analytics() {
  const { focusQuery, tasksQuery, readingQuery } = useAnalyticsData(14);

  const focusData = focusQuery.data ?? [];
  const tasksData = tasksQuery.data ?? [];
  const books = readingQuery.data ?? [];

  const totalFocus = focusData.reduce((s, d) => s + d.minutes, 0);
  const totalCompleted = tasksData.reduce((s, d) => s + d.completed, 0);
  const totalPages = books.reduce((s, b) => s + b.current_page, 0);

  const bookPieData = books
    .filter((b) => b.current_page > 0)
    .map((b) => ({
      name: b.title.length > 20 ? b.title.slice(0, 18) + "…" : b.title,
      value: b.current_page,
      total: b.total_pages,
    }));

  const isLoading = focusQuery.isLoading || tasksQuery.isLoading || readingQuery.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">Data-driven self improvement — last 14 days.</p>
      </div>

      {/* Summary cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Focus</CardTitle>
              <Timer className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold font-mono">
                    {Math.floor(totalFocus / 60)}h {totalFocus % 60}m
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Deep work logged</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasks Done</CardTitle>
              <CheckSquare className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-3xl font-bold font-mono">{totalCompleted}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tasks completed</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pages Read</CardTitle>
              <BookOpen className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-3xl font-bold font-mono">{totalPages}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across {books.length} book{books.length !== 1 ? "s" : ""}</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Focus Area Chart */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Timer className="h-5 w-5 text-chart-1" /> Focus Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : focusData.every((d) => d.minutes === 0) ? (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                  No focus sessions yet — start one to see data here.
                </div>
              ) : (
                <ChartContainer config={focusConfig} className="h-[250px] w-full">
                  <AreaChart data={focusData}>
                    <defs>
                      <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <ChartTooltip
                      content={<ChartTooltipContent labelFormatter={(v) => formatDateLabel(v as string)} />}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="hsl(var(--chart-1))"
                      fill="url(#focusGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks Bar Chart */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckSquare className="h-5 w-5 text-chart-2" /> Tasks Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : tasksData.every((d) => d.completed === 0 && d.added === 0) ? (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                  No task activity yet — create tasks to see data here.
                </div>
              ) : (
                <ChartContainer config={tasksConfig} className="h-[250px] w-full">
                  <BarChart data={tasksData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="fill-muted-foreground" />
                    <ChartTooltip
                      content={<ChartTooltipContent labelFormatter={(v) => formatDateLabel(v as string)} />}
                    />
                    <Bar dataKey="completed" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="added" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Reading Progress */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-chart-3" /> Reading Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : books.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  No books added yet — head to Reading to add one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Book progress bars */}
                  <div className="space-y-4">
                    {books.map((book) => {
                      const pct = book.total_pages > 0 ? Math.round((book.current_page / book.total_pages) * 100) : 0;
                      return (
                        <div key={book.title} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium truncate max-w-[200px]">{book.title}</span>
                            <span className="text-muted-foreground font-mono text-xs">
                              {book.current_page}/{book.total_pages} ({pct}%)
                            </span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })}
                  </div>

                  {/* Pie chart */}
                  {bookPieData.length > 0 && (
                    <ChartContainer
                      config={Object.fromEntries(
                        bookPieData.map((b, i) => [
                          b.name,
                          { label: b.name, color: PIE_COLORS[i % PIE_COLORS.length] },
                        ])
                      )}
                      className="h-[200px] w-full"
                    >
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={bookPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          strokeWidth={2}
                        >
                          {bookPieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
