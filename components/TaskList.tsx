"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, Trash2, X, Tag, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkTypeSelect } from "@/components/WorkTypeSelect";
import { DatePickerWithPresets } from "@/components/DatePickerWithPresets";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  workTypeId: string;
  workType: {
    id: string;
    label: string;
  };
};

type WorkType = {
  id: string;
  label: string;
};

export default function TaskList({
  workTypes,
  className,
  onAddWorkType,
  showAddTaskForm = false,
  onAddTaskFormClose,
}: {
  workTypes: WorkType[];
  className?: string;
  onAddWorkType?: (label: string) => void;
  showAddTaskForm?: boolean;
  onAddTaskFormClose?: () => void;
}) {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [selectedWorkTypeId, setSelectedWorkTypeId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isAddingTask, setIsAddingTask] = useState(showAddTaskForm);
  const [error, setError] = useState("");

  // Update isAddingTask when showAddTaskForm prop changes
  useEffect(() => {
    if (showAddTaskForm) {
      setIsAddingTask(true);
    }
  }, [showAddTaskForm]);

  // Load tasks on mount and when user signs in
  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks();
    }
  }, [status]);

  // Select first workType by default when available
  useEffect(() => {
    if (workTypes.length > 0 && !selectedWorkTypeId) {
      setSelectedWorkTypeId(workTypes[0].id);
    }
  }, [workTypes, selectedWorkTypeId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !selectedWorkTypeId) return;

    try {
      setError("");
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.trim(),
          workTypeId: selectedWorkTypeId,
          dueDate: selectedDate ? selectedDate.toISOString() : null,
        }),
      });

      if (res.ok) {
        const createdTask = await res.json();
        setTasks((prev) => [createdTask, ...prev]);
        setNewTask("");
        setSelectedDate(undefined);
        setIsAddingTask(false);
        if (onAddTaskFormClose) onAddTaskFormClose();
      } else {
        const error = await res.json();
        setError(error.message || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      setError("An unexpected error occurred");
    }
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const newStatus = !task.completed;
      
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed: newStatus } : t
        )
      );

      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          completed: newStatus,
        }),
      });

      if (!res.ok) {
        // Revert on error
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, completed: task.completed } : t
          )
        );
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      // Optimistic delete
      setTasks((prev) => prev.filter((t) => t.id !== id));

      const res = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Restore on error
        await fetchTasks();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      await fetchTasks();
    }
  };

  // Group tasks by work type for display
  const tasksByWorkType = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const workTypeId = task.workType.id;
      if (!grouped[workTypeId]) {
        grouped[workTypeId] = [];
      }
      grouped[workTypeId].push(task);
    });
    
    return grouped;
  }, [tasks]);

  const addWorkType = async (label: string) => {
    try {
      // If parent provided an onAddWorkType function, use it
      if (onAddWorkType) {
        const createdWorkType = await onAddWorkType(label);
        
        // If createdWorkType was returned, use it directly
        if (createdWorkType) {
          setSelectedWorkTypeId(createdWorkType.id);
          return;
        }
      }
      
      // Fallback to direct API call if parent handler wasn't provided or didn't return a result
      const res = await fetch("/api/work-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      
      if (res.ok) {
        const createdWorkType = await res.json();
        setSelectedWorkTypeId(createdWorkType.id);
        await fetchTasks();
      }
    } catch (error) {
      console.error("Failed to create work type:", error);
    }
  };

  if (status !== "authenticated") {
    return <p className="text-center text-sm py-4">Sign in to manage tasks</p>;
  }

  return (
    <Card className={`overflow-hidden bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl ${className}`}>
      <CardContent className="p-6 pt-8">
        <AnimatePresence>
          {isAddingTask && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 space-y-4"
              onSubmit={addTask}
            >
              <div className="flex flex-col space-y-4">
                <Input
                  type="text"
                  placeholder="Add your task here..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="bg-white dark:bg-black border-black/20 dark:border-white/20 text-black/80 dark:text-white/80 rounded-lg focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black/30 dark:focus:border-white/30"
                  required
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <WorkTypeSelect
                    workTypes={workTypes}
                    selectedWorkTypeId={selectedWorkTypeId}
                    setSelectedWorkTypeId={(id) => {
                      setSelectedWorkTypeId(id);
                      setError(""); // Clear any previous error when changing work type
                    }}
                    onAddWorkType={addWorkType}
                  />
                  
                  <DatePickerWithPresets
                    date={selectedDate}
                    setDate={setSelectedDate}
                  />
                </div>
              </div>
              
              {error && (
                <p className="text-red-500 text-xs">{error}</p>
              )}
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingTask(false);
                    setError("");
                    if (onAddTaskFormClose) onAddTaskFormClose();
                  }}
                  className="text-black/70 dark:text-white/70 border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  size="sm"
                  className="bg-black hover:bg-black/80 text-white rounded-lg"
                >
                  Add Task
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black/50 dark:text-white/50">No tasks yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(tasksByWorkType).map(([workTypeId, tasks]) => {
              const workType = workTypes.find(wt => wt.id === workTypeId);
              if (!workType) return null;
              
              return (
                <div key={workTypeId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-black/50 dark:text-white/50" />
                    <h4 className="text-sm font-medium text-black/70 dark:text-white/70 border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md">{workType.label}</h4>
                  </div>
                  <ul className="space-y-1.5">
                    <AnimatePresence>
                      {tasks.map(task => (
                        <motion.li 
                          key={task.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`flex items-center gap-3 p-2.5 rounded-lg ${task.completed ? 'opacity-50 bg-black/5 dark:bg-white/5' : 'bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20'} transition-colors duration-200`}
                        >
                          <Checkbox 
                            checked={task.completed} 
                            onCheckedChange={() => toggleTaskCompletion(task)}
                            className="border-black/30 dark:border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                          <span className={`flex-1 text-sm font-medium ${task.completed ? 'line-through text-black/40 dark:text-white/40' : 'text-black/90 dark:text-white/90'}`}>
                            {task.title}
                          </span>
                          
                          {task.dueDate && (
                            <span className="text-xs text-black/70 dark:text-white/70 flex items-center bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full border border-black/20 dark:border-white/20">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {format(new Date(task.dueDate), "MMM d")}
                            </span>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                            className="h-7 w-7 p-0 rounded-full text-black/40 hover:text-red-500 hover:bg-black/5 dark:text-white/40 dark:hover:text-red-400 dark:hover:bg-white/5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              );
            })}

            {!isAddingTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingTask(true)}
                className="mt-4 w-full text-black/70 dark:text-white/70 border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg py-5 taskList-add-button"
              >
                <Plus className="h-4 w-4 mr-2" /> Add another task
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 