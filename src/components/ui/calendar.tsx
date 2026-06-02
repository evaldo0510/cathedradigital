import { Icons } from '@/constants';
import * as React from "react";

import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-spacing-sm", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-spacing-md sm:space-x-spacing-md sm:space-y-0",
        month: "space-y-spacing-md",
        caption: "flex justify-center pt-spacing-2xs relative items-center",
        caption_label: "text-premium-sm font-medium",
        nav: "space-x-spacing-2xs flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-spacing-lg w-spacing-lg bg-transparent p-spacing-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-spacing-2xs",
        nav_button_next: "absolute right-spacing-2xs",
        table: "w-full border-collapse space-y-spacing-2xs",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-premium-full w-spacing-xl font-normal text-[0.8rem]",
        row: "flex w-full mt-spacing-xs",
        cell: "h-spacing-xl w-spacing-xl text-center text-premium-sm p-spacing-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-spacing-xl w-spacing-xl p-spacing-0 font-normal aria-selected:opacity-100"),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <Icons.ChevronLeft className="h-spacing-md w-spacing-md" />,
        IconRight: ({ ..._props }) => <Icons.ChevronRight className="h-spacing-md w-spacing-md" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
