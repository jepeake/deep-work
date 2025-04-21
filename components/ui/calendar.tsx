"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      formatters={{
        formatWeekdayName: () => "",
      }}
      styles={{
        head: { display: 'none' },
        head_row: { display: 'none' },
        head_cell: { display: 'none' }
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-black dark:text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-black dark:text-white border-black/20 dark:border-white/20"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "!hidden",
        head_cell:
          "!hidden text-black dark:text-white rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-black/10 dark:bg-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 hover:text-black dark:hover:text-white focus:bg-black/10 dark:focus:bg-white/20 focus:text-black dark:focus:text-white",
        day_today: "bg-black/5 dark:bg-white/10 text-black dark:text-white",
        day_outside:
          "day-outside text-black/30 dark:text-white/50 opacity-50 aria-selected:bg-accent/50 aria-selected:text-black/30 dark:aria-selected:text-white/50 aria-selected:opacity-30",
        day_disabled: "text-black/30 dark:text-white/50 opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar } 