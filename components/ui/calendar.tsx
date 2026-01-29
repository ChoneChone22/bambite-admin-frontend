"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/src/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
};

/**
 * Production-ready Calendar built on react-day-picker.
 * Uses only semantic tokens (background, foreground, border, primary, accent, muted)
 * for correct light and dark mode. No glass/backdrop effects.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  ...props
}: CalendarProps) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      className={cn(
        "rounded-lg border border-border bg-background p-3 text-foreground shadow-sm",
        "rtl:[.rdp-button_next>svg]:rotate-180 rtl:[.rdp-button_previous>svg]:rotate-180",
        className
      )}
      classNames={{
        ...defaults,
        root: cn("w-fit min-w-[280px]", defaults.root),
        months: cn("flex flex-col gap-4", defaults.months),
        month: cn("flex flex-col gap-4", defaults.month),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center relative px-9",
          defaults.month_caption
        ),
        caption_label: cn(
          "text-sm font-medium text-foreground",
          defaults.caption_label
        ),
        nav: cn(
          "flex items-center gap-1 absolute top-0 left-0 right-0 w-full justify-between px-1",
          defaults.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-9 w-9 p-0 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
          defaults.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-9 w-9 p-0 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
          defaults.button_next
        ),
        // Use mostly DayPicker defaults for dropdown month/year caption
        // to avoid overlapping hit areas (month vs year) and keep behavior correct.
        dropdown_root: cn(defaults.dropdown_root),
        dropdown: cn(defaults.dropdown),
        dropdowns: cn(defaults.dropdowns),
        months_dropdown: cn(defaults.months_dropdown),
        years_dropdown: cn(defaults.years_dropdown),
        month_grid: cn("w-full border-collapse table-fixed", defaults.month_grid),
        weekdays: cn(defaults.weekdays),
        weekday: cn(
          "w-[2.25rem] rounded-md py-1 text-[11px] font-medium text-muted-foreground",
          defaults.weekday
        ),
        weeks: cn(defaults.weeks),
        week: cn(defaults.week),
        day: cn(
          "relative p-0 text-center text-sm w-[2.25rem] align-middle",
          defaults.day
        ),
        day_button: cn(
          "h-9 w-9 rounded-md font-normal inline-flex items-center justify-center text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          defaults.day_button
        ),
        selected: cn(
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
          defaults.selected
        ),
        today: cn(
          "[&>button]:bg-accent [&>button]:text-accent-foreground",
          defaults.today
        ),
        outside: cn(
          "[&>button]:text-muted-foreground [&>button]:opacity-50",
          defaults.outside
        ),
        disabled: cn(
          "[&>button]:text-muted-foreground [&>button]:opacity-50 [&>button]:pointer-events-none",
          defaults.disabled
        ),
        hidden: cn("invisible", defaults.hidden),
        range_start: cn(
          "[&>button]:rounded-r-none [&>button]:bg-primary [&>button]:text-primary-foreground",
          defaults.range_start
        ),
        range_middle: cn(
          "[&>button]:rounded-none [&>button]:bg-accent [&>button]:text-accent-foreground",
          defaults.range_middle
        ),
        range_end: cn(
          "[&>button]:rounded-l-none [&>button]:bg-primary [&>button]:text-primary-foreground",
          defaults.range_end
        ),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...rest }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("size-4 shrink-0", chevronClassName)}
                aria-hidden
                {...rest}
              />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4 shrink-0", chevronClassName)}
                aria-hidden
                {...rest}
              />
            );
          }
          return (
            <ChevronDownIcon
              className={cn("size-4 shrink-0", chevronClassName)}
              aria-hidden
              {...rest}
            />
          );
        },
        ...props.components,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
