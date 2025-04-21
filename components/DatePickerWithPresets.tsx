"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePickerWithPresets({
  date,
  setDate,
}: {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white dark:bg-black border-black/20 dark:border-white/20 text-black/80 dark:text-white/80",
            !date && "text-black/50 dark:text-white/70"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white dark:bg-black border-black/20 dark:border-white/20">
        <div className="space-y-2 p-2 bg-white dark:bg-black text-black dark:text-white">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="text-black dark:text-white border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              className="text-black dark:text-white border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setDate(addDays(new Date(), 1))}
            >
              Tomorrow
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="text-black dark:text-white border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setDate(addDays(new Date(), 7))}
            >
              In a week
            </Button>
            <Button
              variant="outline"
              className="text-black dark:text-white border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setDate(undefined)}
            >
              No date
            </Button>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          className="border-t border-black/10 dark:border-white/10 text-black dark:text-white"
          formatters={{ formatWeekdayName: () => "" }}
          hidden={["head"]}
        />
      </PopoverContent>
    </Popover>
  );
} 