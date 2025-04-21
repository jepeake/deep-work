"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  BarChart2,
  Plus,
  X,
  PieChartIcon,
  BarChartIcon,
  User,
  LogOut,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import TaskList from "@/components/TaskList";
import {
  getLocalWorkTypes,
  saveLocalWorkType,
  removeLocalWorkType,
  getLocalStudySessions,
  saveLocalStudySession,
  LocalWorkType,
  LocalStudySession
} from "@/lib/localStorage";

type WorkType = {
  id: string;
  label: string;
};

type StudySession = {
  date: string;
  duration: number;
  workType: string;
};

export function FlowAppComponent({ isDarkMode }: { isDarkMode: boolean }) {
  const [time, setTime] = useState(60 * 60);
  const [isActive, setIsActive] = useState(false);
  const [inputTime, setInputTime] = useState("60");
  const [studyHistory, setStudyHistory] = useState<StudySession[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM"),
  );
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [selectedWorkTypeId, setSelectedWorkTypeId] = useState<string>("");
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [newWorkType, setNewWorkType] = useState("");
  const [pausedTime, setPausedTime] = useState<number | null>(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);

  const [year, month] = selectedMonth.split("-");

  const firstDayOfMonth = startOfMonth(
    new Date(parseInt(year), parseInt(month) - 1),
  );
  const startDayOfWeek = firstDayOfMonth.getDay();

  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => (
    <div
      key={`empty-${i}`}
      className="text-center p-2 rounded-md bg-transparent"
    ></div>
  ));

  const { data: session, status } = useSession();
  const router = useRouter();
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Check for guest mode on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guestMode = localStorage.getItem('guestMode') === 'true';
      setIsGuestMode(guestMode);
    }
  }, []);

  // Only redirect to signin if not in guest mode and not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && !isGuestMode) {
      router.push("/signin");
    }
  }, [status, router, isGuestMode]);

  // Load data based on auth state
  useEffect(() => {
    const loadData = async () => {
      if (status === "authenticated") {
        // Load from API if authenticated
        const [wtRes, shRes] = await Promise.all([
          fetch("/api/work-types"),
          fetch("/api/study-sessions"),
        ]);
        if (wtRes.ok) {
          const wtData: WorkType[] = await wtRes.json();
          setWorkTypes(wtData);
        }
        if (shRes.ok) {
          const shData: StudySession[] = await shRes.json();
          setStudyHistory(shData);
        }
      } else if (isGuestMode) {
        // Load from localStorage if in guest mode
        const localWorkTypes = getLocalWorkTypes();
        setWorkTypes(localWorkTypes);
        
        const localStudySessions = getLocalStudySessions();
        const formattedSessions = localStudySessions.map(session => {
          const workType = localWorkTypes.find(wt => wt.id === session.workTypeId);
          return {
            date: session.date,
            duration: session.duration,
            workType: workType?.label || "",
          };
        });
        setStudyHistory(formattedSessions);
      }
    };
    
    loadData();
  }, [status, isGuestMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
      if (sessionStartTime !== null) {
        const actualDuration = Math.round(
          (Date.now() - sessionStartTime) / 60000,
        );
        const selectedWorkType = workTypes.find(wt => wt.id === selectedWorkTypeId);
        const newSession: StudySession = {
          date: new Date().toISOString(),
          duration: actualDuration,
          workType: selectedWorkType?.label || "",
        };
        setStudyHistory((prev) => [...prev, newSession]);
        
        if (status === "authenticated") {
          // Save to API if authenticated
          fetch("/api/study-sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: newSession.date,
              duration: newSession.duration,
              workTypeId: selectedWorkTypeId,
            }),
          });
        } else if (isGuestMode) {
          // Save to localStorage if in guest mode
          saveLocalStudySession({
            date: newSession.date,
            duration: newSession.duration,
            workTypeId: selectedWorkTypeId,
          });
        }
      }
      setSessionStartTime(null);
      setPausedTime(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time, sessionStartTime, selectedWorkTypeId, workTypes, status, isGuestMode]);

  const toggleTimer = useCallback(() => {
    if (!isActive) {
      if (pausedTime) {
        setTime(pausedTime);
        setPausedTime(null);
      } else {
        setTime(parseInt(inputTime, 10) * 60);
      }
      setSessionStartTime(Date.now());
    } else {
      setPausedTime(time);
      setSessionStartTime(null);
    }
    setIsActive(!isActive);
  }, [isActive, inputTime, time, pausedTime]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTime(parseInt(inputTime, 10) * 60);
    setSessionStartTime(null);
    setPausedTime(null);
  }, [inputTime]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getChartData = useCallback(() => {
    const [year, month] = selectedMonth.split("-");
    const startDate = startOfMonth(
      new Date(parseInt(year), parseInt(month) - 1),
    );
    const endDate = endOfMonth(startDate);
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    return daysInMonth.map((day) => {
      const sessionsForDay = studyHistory.filter((session) =>
        isSameDay(new Date(session.date), day),
      );
      const durations = workTypes.reduce(
        (acc, workType) => {
          acc[workType.label] =
            sessionsForDay
              .filter((session) => session.workType === workType.label)
              .reduce((sum, session) => sum + session.duration, 0) / 60; // Convert to hours
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        date: format(day, "dd"),
        ...durations,
        total: Object.values(durations).reduce(
          (sum, duration) => sum + duration,
          0,
        ),
      };
    });
  }, [selectedMonth, studyHistory, workTypes]);

  const chartData = useMemo(() => getChartData(), [getChartData]);

  const handleMonthChange = useCallback((value: string) => {
    setSelectedMonth(value);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setSelectedMonth(format(subMonths(new Date(selectedMonth), 1), "yyyy-MM"));
  }, [selectedMonth]);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth(format(addMonths(new Date(selectedMonth), 1), "yyyy-MM"));
  }, [selectedMonth]);

  const addWorkType = useCallback(async () => {
    if (newWorkType && !workTypes.some(wt => wt.label === newWorkType)) {
      if (status === "authenticated") {
        // Add to API if authenticated
        const res = await fetch("/api/work-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: newWorkType }),
        });
        if (res.ok) {
          const createdWorkType = await res.json();
          setWorkTypes((prev) => [...prev, createdWorkType]);
          setNewWorkType("");
        }
      } else if (isGuestMode) {
        // Add to localStorage if in guest mode
        const createdWorkType = saveLocalWorkType(newWorkType);
        setWorkTypes((prev) => [...prev, createdWorkType]);
        setNewWorkType("");
      }
    }
  }, [newWorkType, workTypes, status, isGuestMode]);

  const removeWorkType = useCallback(async (workTypeId: string) => {
    if (status === "authenticated") {
      // Remove from API if authenticated
      const res = await fetch(`/api/work-types/${workTypeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setWorkTypes((prev) => prev.filter((type) => type.id !== workTypeId));
      }
    } else if (isGuestMode) {
      // Remove from localStorage if in guest mode
      removeLocalWorkType(workTypeId);
      setWorkTypes((prev) => prev.filter((type) => type.id !== workTypeId));
    }
  }, [status, isGuestMode]);

  const getWorkBreakdown = useCallback(() => {
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);

    const relevantSessions = studyHistory.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    return workTypes
      .map((workType) => ({
        name: workType.label,
        value:
          relevantSessions
            .filter((session) => session.workType === workType.label)
            .reduce((sum, session) => sum + session.duration, 0) / 60, // Convert to hours
      }))
      .filter((item) => item.value > 0);
  }, [studyHistory, workTypes]);

  const workBreakdown = useMemo(() => getWorkBreakdown(), [getWorkBreakdown]);

  const totalTimeWorked = useMemo(() => {
    return workBreakdown.reduce((total, item) => total + item.value, 0);
  }, [workBreakdown]);

  const averageTimePerDay = useMemo(() => {
    if (studyHistory.length === 0) return 0;

    const sortedHistory = [...studyHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const firstStudyDay = new Date(sortedHistory[0].date);
    const lastStudyDay = new Date(sortedHistory[sortedHistory.length - 1].date);
    const totalDays =
      Math.floor(
        (lastStudyDay.getTime() - firstStudyDay.getTime()) / (1000 * 3600 * 24),
      ) + 1;
    const totalHours = sortedHistory.reduce(
      (sum, session) => sum + session.duration / 60,
      0,
    );

    return totalHours / totalDays;
  }, [studyHistory]);

  const currentDate = new Date();
  const currentMonth = format(currentDate, "yyyy-MM");

  useEffect(() => {
    if (status !== "authenticated") return;
    
    const fetchWorkTypes = async () => {
      try {
        const response = await fetch("/api/work-types");
        if (response.ok) {
          const data = await response.json();
          setWorkTypes(data);
          if (data.length > 0 && !selectedWorkTypeId) {
            setSelectedWorkTypeId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch work types:", error);
      }
    };
    
    fetchWorkTypes();
  }, [status, selectedWorkTypeId]);

  const handleAddWorkType = useCallback(async (label: string) => {
    try {
      // First check if it already exists
      if (workTypes.some(wt => wt.label.toLowerCase() === label.toLowerCase())) {
        // If already exists locally, just return the existing work type
        const existingType = workTypes.find((wt: WorkType) => wt.label.toLowerCase() === label.toLowerCase());
        return existingType;
      }
      
      if (status === "authenticated") {
        // Add to API if authenticated
        const res = await fetch("/api/work-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label }),
        });
        
        if (res.ok) {
          const createdWorkType = await res.json();
          
          // Update state with the new work type
          setWorkTypes(prev => [...prev, createdWorkType]);
          
          // If no work type is currently selected, select this new one for the timer
          if (!selectedWorkTypeId) {
            setSelectedWorkTypeId(createdWorkType.id);
          }
          
          return createdWorkType;
        } else if (res.status === 400) {
          // If the work type already exists on the server but not in our local state,
          // we need to fetch the work types to get the existing one
          const typesRes = await fetch("/api/work-types");
          if (typesRes.ok) {
            const allTypes = await typesRes.json();
            setWorkTypes(allTypes);
            
            // Find the newly fetched work type with the matching label
            const existingType = allTypes.find((wt: WorkType) => wt.label.toLowerCase() === label.toLowerCase());
            if (existingType) {
              return existingType;
            }
          }
        }
      } else if (isGuestMode) {
        // Add to localStorage if in guest mode
        const createdWorkType = saveLocalWorkType(label);
        setWorkTypes(prev => [...prev, createdWorkType]);
        
        // If no work type is currently selected, select this new one for the timer
        if (!selectedWorkTypeId) {
          setSelectedWorkTypeId(createdWorkType.id);
        }
        
        return createdWorkType;
      }
    } catch (error) {
      console.error("Failed to create work type:", error);
    }
  }, [workTypes, selectedWorkTypeId, status, isGuestMode]);

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
        <header className="container max-w-full mx-auto pt-4 px-4 sm:px-6">
          <div className="flex justify-between items-center mb-8">
            {session?.user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-black/70" />
                  <span className="text-sm font-medium">{session.user.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/signin' })}
                  className="flex items-center gap-1 border-black/10 text-black/70 hover:bg-black/5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </Button>
              </div>
            )}
            {isGuestMode && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-black/70" />
                  <span className="text-sm font-medium">Guest Mode</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('guestMode');
                    router.push('/signin');
                  }}
                  className="flex items-center gap-1 border-black/10 text-black/70 hover:bg-black/5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign in</span>
                </Button>
              </div>
            )}
          </div>
        </header>
        <main className="container max-w-full mx-auto p-4 sm:p-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Card className="overflow-hidden bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl h-full">
                <CardHeader className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
                  <Clock className="h-5 w-5 text-black/70 dark:text-white/70" />
                </CardHeader>
                <CardContent className="p-6 md:p-8 flex flex-col justify-between h-[calc(100%-60px)]">
                  <div className="flex flex-col items-center gap-6">
                    <div
                      className="text-5xl sm:text-6xl md:text-7xl font-extralight tracking-tighter timer-display"
                      aria-live="polite"
                    >
                      {formatTime(time)}
                    </div>
                    <div className="flex flex-col items-center gap-5 w-full mt-2 max-w-md mx-auto">
                      <div className="flex items-center justify-center gap-2 w-full">
                        <Input
                          type="number"
                          value={inputTime}
                          onChange={(e) => setInputTime(e.target.value)}
                          placeholder="Minutes"
                          className="w-36 sm:w-40 text-center text-base font-normal border border-black/20 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black/30 dark:focus:border-white/30 dark:bg-black/30 dark:text-white"
                          min="1"
                          aria-label="Set timer duration in minutes"
                        />
                        <span className="text-sm text-black/60 dark:text-white/60 font-medium">
                          minutes
                        </span>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between bg-white dark:bg-black border-black/20 dark:border-white/20 text-black/80 dark:text-white/80 hover:bg-white dark:hover:bg-black rounded-lg font-medium py-5 px-4"
                          >
                            {selectedWorkTypeId ? (
                              workTypes.find(wt => wt.id === selectedWorkTypeId)?.label || "Select Work Type"
                            ) : "Select Work Type"}
                            <ChevronRight className="h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg p-4">
                          <div className="grid gap-4">
                            <div>
                              <h4 className="font-medium text-base leading-none text-black dark:text-white mb-1.5">
                                Work Types
                              </h4>
                              <p className="text-xs text-black/60 dark:text-white/60">
                                Select or manage your work types.
                              </p>
                            </div>
                            <div className="grid gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                              {workTypes.map((type) => (
                                <div
                                  key={type.id}
                                  className="flex items-center justify-between group"
                                >
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 font-normal rounded-lg text-sm"
                                    onClick={() => setSelectedWorkTypeId(type.id)}
                                  >
                                    {type.label}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeWorkType(type.id)}
                                    className="text-black/40 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-1">
                              <Input
                                placeholder="New work type"
                                value={newWorkType}
                                onChange={(e) => setNewWorkType(e.target.value)}
                                className="flex-1 bg-white dark:bg-black/50 border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg text-sm"
                              />
                              <Button
                                onClick={addWorkType}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        onClick={toggleTimer}
                        className={`w-full py-5 text-base font-medium rounded-lg border-0 text-white transition-colors duration-300 ${
                          isActive
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {isActive ? "Pause" : "Start"}
                      </Button>
                      <Button
                        onClick={resetTimer}
                        variant="outline"
                        className="w-full py-5 text-base font-medium rounded-lg border border-black/20 dark:border-white/20 text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
              <Card className="overflow-hidden bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl h-full">
                <CardHeader className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
                  <Calendar className="h-5 w-5 text-black/70 dark:text-white/70" />
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <Button
                      onClick={handlePrevMonth}
                      variant="outline"
                      className="p-2 bg-transparent border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                      disabled={
                        selectedMonth ===
                        format(
                          new Date(currentDate.getFullYear(), 0),
                          "yyyy-MM",
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Select
                      value={selectedMonth}
                      onValueChange={handleMonthChange}
                    >
                      <SelectTrigger className="w-[180px] bg-transparent border border-black/10 dark:border-white/10 text-black/90 dark:text-white/90 rounded-lg">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black/90 border border-black/10 dark:border-white/10 rounded-lg">
                        {Array.from(
                          { length: currentDate.getMonth() + 1 },
                          (_, i) => {
                            const date = new Date(
                              currentDate.getFullYear(),
                              i,
                              1,
                            );
                            return (
                              <SelectItem
                                key={i}
                                value={format(date, "yyyy-MM")}
                                className="text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5"
                              >
                                {format(date, "MMMM yyyy")}
                              </SelectItem>
                            );
                          },
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleNextMonth}
                      variant="outline"
                      className="p-2 bg-transparent border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                      disabled={selectedMonth === currentMonth}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {/* Days of the week headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="text-center font-medium text-black/60 dark:text-white/60 text-xs py-1"
                        >
                          {day}
                        </div>
                      ),
                    )}

                    {/* Padding days */}
                    {paddingDays}

                    {/* Calendar days */}
                    {chartData.map((day, index) => {
                      const [year, month] = selectedMonth.split("-");
                      const currentDay = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day.date),
                      );
                      const isCurrentDay =
                        currentDay.toDateString() === new Date().toDateString();
                      const hasActivity = day.total > 0;
                      const intensity = Math.min(day.total / 4, 1); // Scale intensity based on hours, max at 4hrs

                      return (
                        <div
                          key={index}
                          className={`text-center p-2.5 rounded-lg transition-all duration-200 ${
                            isCurrentDay
                              ? "ring-1 ring-black dark:ring-white bg-white/10 dark:bg-black/10 text-black dark:text-white"
                              : hasActivity
                                ? `bg-green-${Math.floor(intensity * 400)}/10 hover:bg-green-${Math.floor(intensity * 400)}/20 text-black dark:text-white`
                                : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70"
                          }`}
                        >
                          <div className={`font-medium ${isCurrentDay ? "text-black dark:text-white" : ""}`}>{day.date}</div>
                          {hasActivity && (
                            <div className="text-xs mt-1 font-medium text-green-600 dark:text-green-400">
                              {day.total.toFixed(1)}h
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5 text-center">
                    <p className="text-sm font-medium text-black/60 dark:text-white/60">
                      Total:{" "}
                      <span className="text-black/90 dark:text-white/90 font-semibold">
                        {chartData
                          .reduce((sum, day) => sum + day.total, 0)
                          .toFixed(2)}{" "}
                        hours
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              className="md:col-span-2"
            >
              <Card className="overflow-hidden bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl">
                <CardHeader className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
                  <BarChart2 className="h-5 w-5 text-black/70 dark:text-white/70" />
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid stroke={isDarkMode ? "#ffffff20" : "#00000010"} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          interval={0}
                          angle={0}
                          textAnchor="middle"
                          height={50}
                          tick={{
                            fontSize: 12,
                            fill: isDarkMode ? "#ffffffaa" : "#000000aa",
                          }}
                          axisLine={{ stroke: isDarkMode ? "#ffffff20" : "#00000020" }}
                          tickLine={{ stroke: isDarkMode ? "#ffffff20" : "#00000020" }}
                        />
                        <YAxis
                          tick={{ 
                            fill: isDarkMode ? "#ffffffaa" : "#000000aa",
                            fontSize: 12 
                          }}
                          axisLine={{ stroke: isDarkMode ? "#ffffff20" : "#00000020" }}
                          tickLine={{ stroke: isDarkMode ? "#ffffff20" : "#00000020" }}
                          label={{
                            value: "Hours",
                            angle: -90,
                            position: "insideLeft",
                            style: { 
                              fill: isDarkMode ? "#ffffffaa" : "#000000aa",
                              fontSize: 12,
                              fontWeight: 500,
                              textAnchor: "middle"
                            },
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDarkMode ? "#000000ee" : "#ffffffee",
                            borderColor: isDarkMode ? "#ffffff20" : "#00000020",
                            color: "#10b981",
                            borderRadius: "8px",
                            padding: "10px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                            fontSize: "12px"
                          }}
                          itemStyle={{
                            padding: "2px 0",
                            color: "#10b981"
                          }}
                          labelStyle={{
                            fontWeight: "bold",
                            marginBottom: "6px",
                            color: "#10b981"
                          }}
                        />
                        <Bar 
                          dataKey="total" 
                          fill="#ffffff"
                          radius={[4, 4, 0, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
              className="md:col-span-1"
            >
              <Card className="overflow-hidden bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl h-full">
                <CardHeader className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
                  <PieChartIcon className="h-5 w-5 text-black/70 dark:text-white/70" />
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={workBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                          fill="#ffffff"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {workBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill="#ffffff"
                              stroke={isDarkMode ? "#000000" : "#333333"}
                              strokeWidth={1}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDarkMode ? "#000000ee" : "#ffffffee",
                            borderColor: isDarkMode ? "#ffffff20" : "#00000020",
                            color: "#10b981",
                            borderRadius: "8px",
                            padding: "10px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                            fontSize: "12px"
                          }}
                          itemStyle={{
                            padding: "2px 0",
                            color: "#10b981"
                          }}
                          labelStyle={{
                            fontWeight: "bold",
                            marginBottom: "6px",
                            color: "#10b981"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
              className="md:col-span-1"
            >
              <Card className="overflow-hidden bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl h-full">
                <CardHeader className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
                  <BarChartIcon className="h-5 w-5 text-black/70 dark:text-white/70" />
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-8">
                    <div className="flex flex-col">
                      <h4 className="text-sm font-medium text-black/50 dark:text-white/50 mb-1">
                        Total
                      </h4>
                      <p className="text-3xl font-bold text-black dark:text-white flex items-baseline">
                        {totalTimeWorked.toFixed(2)} 
                        <span className="text-sm font-medium text-black/50 dark:text-white/50 ml-1">hours</span>
                      </p>
                      <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full mt-3">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min(totalTimeWorked / 50 * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-medium text-black/50 dark:text-white/50 mb-1">
                        Average Per Day
                      </h4>
                      <p className="text-3xl font-bold text-black dark:text-white flex items-baseline">
                        {averageTimePerDay.toFixed(2)}
                        <span className="text-sm font-medium text-black/50 dark:text-white/50 ml-1">hours</span>
                      </p>
                      <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full mt-3">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${Math.min(averageTimePerDay / 8 * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
            className="mt-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black">Tasks</h2>
              <Button 
                onClick={() => setShowAddTaskForm(true)}
                className="bg-black hover:bg-black/80 text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> New Task
              </Button>
            </div>
            <TaskList 
              workTypes={workTypes} 
              onAddWorkType={handleAddWorkType} 
              showAddTaskForm={showAddTaskForm}
              onAddTaskFormClose={() => setShowAddTaskForm(false)}
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
