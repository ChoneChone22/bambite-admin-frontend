"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
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

export interface DatePickerProps {
  /** Value as YYYY-MM-DD string (HTML date input format) */
  value?: string;
  /** Called with YYYY-MM-DD string */
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  /** For use inside Formik: pass field name and helpers */
  name?: string;
  onBlur?: (e: React.FocusEvent) => void;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  id,
  disabled,
  name,
  onBlur,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = value
    ? (() => {
        const parsed = parse(value, "yyyy-MM-dd", new Date());
        return isValid(parsed) ? parsed : undefined;
      })()
    : undefined;

  const handleSelect = (d: Date | undefined) => {
    if (!d) {
      onChange?.("");
      return;
    }
    onChange?.(format(d, "yyyy-MM-dd"));
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
          {value ? format(parse(value, "yyyy-MM-dd", new Date()), "PPP") : placeholder}
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
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
