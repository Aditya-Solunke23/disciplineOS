import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Wallet, Plus, TrendingUp, TrendingDown, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useFinances, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/hooks/useFinances";
import { format, parseISO, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { motion } from "framer-motion";

const PIE_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))",
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Finances() {
  const { transactionsQuery, addTransaction, deleteTransaction } = useFinances();
  const transactions = transactionsQuery.data ?? [];

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    addTransaction.mutate(
      {
        amount: parseFloat(amount),
        transaction_type: type,
        category: category || "Other",
        description: description || undefined,
        transaction_date: date,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setAmount("");
          setCategory("");
          setDescription("");
          setDate(format(new Date(), "yyyy-MM-dd"));
        },
      }
    );
  };

  // Current month stats
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().slice(0, 10);
  const monthEnd = endOfMonth(now).toISOString().slice(0, 10);

  const monthTxs = useMemo(
    () => transactions.filter((t) => t.transaction_date >= monthStart && t.transaction_date <= monthEnd),
    [transactions, monthStart, monthEnd]
  );

  const totalIncome = monthTxs.filter((t) => t.transaction_type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = monthTxs.filter((t) => t.transaction_type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  // Category breakdown for expenses
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxs
      .filter((t) => t.transaction_type === "expense")
      .forEach((t) => {
        const cat = t.category || "Other";
        map[cat] = (map[cat] || 0) + Number(t.amount);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [monthTxs]);

  // Last 7 days spending
  const dailySpending = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      days[format(subDays(now, i), "yyyy-MM-dd")] = 0;
    }
    transactions
      .filter((t) => t.transaction_type === "expense")
      .forEach((t) => {
        if (days[t.transaction_date] !== undefined) {
          days[t.transaction_date] += Number(t.amount);
        }
      });
    return Object.entries(days).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));
  }, [transactions]);

  // Monthly growth chart – last 6 months
  const monthlyGrowth = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const monthDate = subMonths(now, 5 - i);
      const ms = startOfMonth(monthDate).toISOString().slice(0, 10);
      const me = endOfMonth(monthDate).toISOString().slice(0, 10);
      const monthTx = transactions.filter((t) => t.transaction_date >= ms && t.transaction_date <= me);
      const inc = monthTx.filter((t) => t.transaction_type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const exp = monthTx.filter((t) => t.transaction_type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      return {
        month: format(monthDate, "MMM"),
        Income: Math.round(inc),
        Expenses: Math.round(exp),
        Net: Math.round(inc - exp),
      };
    });
  }, [transactions]);

  const pieConfig = Object.fromEntries(
    expenseByCategory.map((c, i) => [c.name, { label: c.name, color: PIE_COLORS[i % PIE_COLORS.length] }])
  );

  const barConfig = { amount: { label: "Spent", color: "hsl(var(--chart-5))" } };
  const lineConfig = {
    Income: { label: "Income", color: "hsl(var(--chart-1))" },
    Expenses: { label: "Expenses", color: "hsl(var(--chart-5))" },
    Net: { label: "Net", color: "hsl(var(--chart-2))" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Tracker</h1>
          <p className="text-muted-foreground text-sm">Control your money, control your life.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Transaction</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={type === "expense" ? "default" : "outline"}
                  onClick={() => { setType("expense"); setCategory(""); }}
                  className="w-full"
                >
                  <ArrowDownRight className="h-4 w-4 mr-1" /> Expense
                </Button>
                <Button
                  variant={type === "income" ? "default" : "outline"}
                  onClick={() => { setType("income"); setCategory(""); }}
                  className="w-full"
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" /> Income
                </Button>
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button onClick={handleSubmit} disabled={addTransaction.isPending || !amount} className="w-full">
                {addTransaction.isPending ? "Saving…" : "Save Transaction"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground mt-1">{format(now, "MMMM yyyy")}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-chart-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground mt-1">{format(now, "MMMM yyyy")}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <Wallet className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${balance >= 0 ? "text-chart-1" : "text-destructive"}`}>
                ${Math.abs(balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{balance >= 0 ? "Net positive" : "Net negative"}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{savingsRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">{savingsRate >= 20 ? "Great discipline!" : "Aim for 20%+"}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spending Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-chart-5" /> Last 7 Days Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailySpending.every((d) => d.amount === 0) ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No spending logged recently.</div>
            ) : (
              <ChartContainer config={barConfig} className="h-[220px] w-full">
                <BarChart data={dailySpending}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(parseISO(v), "EEE")} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => format(parseISO(v as string), "MMM d")} />} />
                  <Bar dataKey="amount" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-chart-3" /> Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No expenses this month.</div>
            ) : (
              <div className="flex items-center gap-4">
                <ChartContainer config={pieConfig} className="h-[220px] flex-1">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} strokeWidth={2}>
                      {expenseByCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-1.5 text-xs min-w-[100px]">
                  {expenseByCategory.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground truncate">{c.name}</span>
                      <span className="font-mono ml-auto">${c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-chart-1" /> Monthly Growth (6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyGrowth.every((m) => m.Income === 0 && m.Expenses === 0) ? (
            <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">No data yet — add some transactions.</div>
          ) : (
            <ChartContainer config={lineConfig} className="h-[260px] w-full">
              <LineChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="Income" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Expenses" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Net" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Transaction list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No transactions yet — add one above.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {transactions.slice(0, 50).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-md ${tx.transaction_type === "income" ? "bg-chart-1/10 text-chart-1" : "bg-chart-5/10 text-chart-5"}`}>
                      {tx.transaction_type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || tx.category || tx.transaction_type}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {tx.category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{tx.category}</Badge>}
                        <span className="text-xs text-muted-foreground">{format(parseISO(tx.transaction_date), "MMM d")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono font-semibold text-sm ${tx.transaction_type === "income" ? "text-chart-1" : "text-foreground"}`}>
                      {tx.transaction_type === "income" ? "+" : "-"}${Number(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteTransaction.mutate(tx.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
