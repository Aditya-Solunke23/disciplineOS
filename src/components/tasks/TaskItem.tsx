import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import TaskForm from "./TaskForm";
import type { Task, TaskInsert } from "@/hooks/useTasks";
import { format } from "date-fns";

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  medium: { label: "Medium", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  low: { label: "Low", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

type Props = {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onUpdate: (data: Partial<Task> & { id: string }) => void;
  onDelete: (id: string) => void;
};

export default function TaskItem({ task, onToggle, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const prio = priorityConfig[task.priority] ?? priorityConfig.medium;

  const handleUpdate = (data: TaskInsert) => {
    onUpdate({ id: task.id, ...data });
    setEditing(false);
  };

  return (
    <>
      <div className={cn(
        "group flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3 transition-all hover:border-border hover:bg-card",
        task.completed && "opacity-50"
      )}>
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) => onToggle(task.id, !!checked)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>
              {task.title}
            </span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", prio.className)}>
              {prio.label}
            </Badge>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), "MMM d")}
              </span>
            )}
            {task.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.estimated_minutes}m
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <TaskForm initial={task} onSubmit={handleUpdate} onCancel={() => setEditing(false)} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </>
  );
}
