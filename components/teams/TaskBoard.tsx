"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, Loader2, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask, setTaskStatus, deleteTask } from "@/app/teams/actions";
import { cn } from "@/lib/utils";
import type { TaskStatus, Priority } from "@prisma/client";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
  assignee: { id: string; student: { firstName: string; lastName: string } } | null;
};
type Member = {
  id: string;
  student: { firstName: string; lastName: string };
};

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "To do" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "REVIEW", label: "Review" },
  { status: "DONE", label: "Done" },
];

const PRIO_COLOR: Record<Priority, string> = {
  LOW: "text-mute-1",
  MEDIUM: "text-info",
  HIGH: "text-warning",
  URGENT: "text-destructive",
};

interface Props {
  teamId: string;
  tasks: Task[];
  members: Member[];
}

export function TaskBoard({ teamId, tasks, members }: Props) {
  const [open, setOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || !e.active) return;
    const taskId = String(e.active.id);
    const newStatus = String(e.over.id) as TaskStatus;
    const t = tasks.find((x) => x.id === taskId);
    if (!t || t.status === newStatus) return;
    setTaskStatus(taskId, newStatus)
      .then(() => toast.success("Moved"))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-section-header">Tasks</h3>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus size={13} /> New task
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.status);
            return (
              <Column
                key={col.status}
                status={col.status}
                label={col.label}
                count={items.length}
              >
                {items.length === 0 ? (
                  <div className="text-[11.5px] text-mute-2 px-1 py-2">—</div>
                ) : (
                  items.map((t) => <TaskCard key={t.id} task={t} teamId={teamId} />)
                )}
              </Column>
            );
          })}
        </div>
      </DndContext>

      {tasks.filter((t) => t.status === "BLOCKED").length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-[var(--radius-sm)] p-3">
          <h4 className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-destructive mb-2">
            Blocked
          </h4>
          <div className="space-y-1.5">
            {tasks
              .filter((t) => t.status === "BLOCKED")
              .map((t) => (
                <TaskCard key={t.id} task={t} teamId={teamId} />
              ))}
          </div>
        </div>
      )}

      <NewTaskDialog
        open={open}
        onOpenChange={setOpen}
        teamId={teamId}
        members={members}
      />
    </div>
  );
}

function Column({
  status,
  label,
  count,
  children,
}: {
  status: TaskStatus;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-mute-4/40 border border-border rounded-[var(--radius-sm)] p-2 min-h-32 transition-colors",
        isOver && "ring-2 ring-brand-dim bg-brand-bg/40"
      )}
    >
      <div className="flex items-center justify-between px-1 py-1 mb-1">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-mute-1">
          {label}
        </span>
        <span className="text-[10.5px] font-bold text-mute-2">{count}</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function TaskCard({ task, teamId }: { task: Task; teamId: string }) {
  const [isPending, startTransition] = useTransition();
  const drag = useDraggable({ id: task.id });

  function changeStatus(s: TaskStatus) {
    startTransition(async () => {
      try {
        await setTaskStatus(task.id, s);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this task?")) return;
    startTransition(async () => {
      try {
        await deleteTask(task.id);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const style: React.CSSProperties = drag.transform
    ? {
        transform: `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)`,
        opacity: drag.isDragging ? 0.4 : 1,
        zIndex: drag.isDragging ? 30 : undefined,
      }
    : {};

  return (
    <div
      ref={drag.setNodeRef}
      style={style}
      className="bg-card border border-border rounded-[var(--radius-sm)] p-2.5 space-y-1.5 group hover:shadow-card transition-shadow"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...drag.listeners}
          {...drag.attributes}
          className="text-mute-2 hover:text-foreground cursor-grab active:cursor-grabbing -ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Drag task"
        >
          <GripVertical size={11} />
        </button>
        <span
          className={cn("text-[10.5px] font-bold uppercase mt-0.5", PRIO_COLOR[task.priority])}
        >
          {task.priority}
        </span>
        <span className="text-[12.5px] font-semibold leading-tight flex-1">
          {task.title}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="opacity-0 group-hover:opacity-100 text-mute-2 hover:text-destructive transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>
      {task.description && (
        <p className="text-[11.5px] text-mute-1 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-[10.5px] text-mute-1">
        <span>
          {task.assignee
            ? `${task.assignee.student.firstName} ${task.assignee.student.lastName[0]}.`
            : "Unassigned"}
        </span>
        {task.dueDate && (
          <span className="font-mono">{format(task.dueDate, "MMM d")}</span>
        )}
      </div>
      <Select
        value={task.status}
        onValueChange={(v) => changeStatus(v as TaskStatus)}
      >
        <SelectTrigger className="h-7 text-[11px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODO">To do</SelectItem>
          <SelectItem value="IN_PROGRESS">In progress</SelectItem>
          <SelectItem value="REVIEW">Review</SelectItem>
          <SelectItem value="DONE">Done</SelectItem>
          <SelectItem value="BLOCKED">Blocked</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function NewTaskDialog({
  open,
  onOpenChange,
  teamId,
  members,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teamId: string;
  members: Member[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setAssigneeId("");
    setDueDate("");
  }

  function handleSave() {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    startTransition(async () => {
      try {
        await createTask({
          teamId,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
        });
        toast.success("Task added");
        reset();
        onOpenChange(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.student.firstName} {m.student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={13} className="animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
