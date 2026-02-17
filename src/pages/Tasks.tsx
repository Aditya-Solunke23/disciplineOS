import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, CheckSquare, ListTodo, Target, Loader2 } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import type { TaskInsert } from "@/hooks/useTasks";
import TaskForm from "@/components/tasks/TaskForm";
import TaskItem from "@/components/tasks/TaskItem";

const CATEGORIES = [
  { value: "all", label: "All", icon: ListTodo },
  { value: "today", label: "Today", icon: CheckSquare },
  { value: "upcoming", label: "Upcoming", icon: ListTodo },
  { value: "long-term", label: "Goals", icon: Target },
];

export default function Tasks() {
  const [category, setCategory] = useState("today");
  const [addOpen, setAddOpen] = useState(false);
  const { tasksQuery, addTask, updateTask, deleteTask, toggleComplete } = useTasks(category);

  const tasks = tasksQuery.data ?? [];
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const handleAdd = (data: TaskInsert) => {
    addTask.mutate({ ...data, category: category === "all" ? "today" : category });
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm">Plan, prioritize, and execute.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Task
        </Button>
      </div>

      <ToggleGroup type="single" value={category} onValueChange={(v) => v && setCategory(v)} className="justify-start">
        {CATEGORIES.map((c) => (
          <ToggleGroupItem key={c.value} value={c.value} variant="outline" size="sm" className="gap-1.5 text-xs">
            <c.icon className="h-3.5 w-3.5" /> {c.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {tasksQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeTasks.length === 0 && completedTasks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No tasks yet. Add one to get started.</p>
              </CardContent>
            </Card>
          )}

          {activeTasks.length > 0 && (
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={(id, completed) => toggleComplete.mutate({ id, completed })}
                  onUpdate={(data) => updateTask.mutate(data)}
                  onDelete={(id) => deleteTask.mutate(id)}
                />
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Completed ({completedTasks.length})
              </h3>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={(id, completed) => toggleComplete.mutate({ id, completed })}
                    onUpdate={(data) => updateTask.mutate(data)}
                    onDelete={(id) => deleteTask.mutate(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <TaskForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
