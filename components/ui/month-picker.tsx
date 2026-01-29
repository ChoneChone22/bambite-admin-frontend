"use client";

import * as React from "react";
import { format, parse, startOfMonth, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MonthPickerProps {
  /** Value as YYYY-MM string (HTML month input format) */
  value?: string;
  /** Called with YYYY-MM string */
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  /** For use inside Formik: pass field name and helpers */
  name?: string;
  onBlur?: (e: React.FocusEvent) => void;
}

export function MonthPicker({
  value,
  onChange,
  placeholder = "Pick a month",
  className,
  id,
  disabled,
  name,
  onBlur,
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const monthDate = value
    ? (() => {
        const parsed = parse(value + "-01", "yyyy-MM-dd", new Date());
        return isValid(parsed) ? startOfMonth(parsed) : undefined;
      })()
    : undefined;

  const handleSelect = (d: Date | undefined) => {
    if (!d) {
      onChange?.("");
      return;
    }
    onChange?.(format(startOfMonth(d), "yyyy-MM"));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          data-empty={!value}
          className={cn(
            "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            className
          )}
          type="button"
          name={name}
          onBlur={onBlur}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value
            ? format(parse(value + "-01", "yyyy-MM-dd", new Date()), "MMMM yyyy")
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          data-calendar-dropdown
          className="!z-[100] w-fit max-w-[min(100vw,360px)] p-0 bg-background border border-border rounded-lg shadow-lg outline-none data-[state=open]:animate-none data-[state=open]:opacity-100"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Calendar
          mode="single"
          selected={monthDate}
          onSelect={handleSelect}
          defaultMonth={monthDate}
          captionLayout="dropdown"
          initialFocus
        />
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
