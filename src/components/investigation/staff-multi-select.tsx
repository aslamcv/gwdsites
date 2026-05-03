"use client"

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface StaffMultiSelectProps {
  label: string;
  options?: { id: string; name: string; designation: string }[];
  selected?: string[];
  onChange: (selected: string[]) => void;
  max?: number;
  disabled?: boolean;
}

/**
 * A multi-select component for technical staff assignment.
 * Uses a div trigger to avoid invalid nested button HTML which causes hydration errors.
 */
export function StaffMultiSelect({
  label,
  options = [],
  selected = [],
  onChange,
  max = 5,
  disabled = false,
}: StaffMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
        {label} {max > 1 && `(Max ${max})`}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            tabIndex={disabled ? -1 : 0}
            className={cn(
              "flex w-full items-center justify-between h-auto min-h-12 bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 transition-all ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              !disabled && "cursor-pointer hover:bg-slate-100/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onKeyDown={(e) => {
              if (!disabled && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpen(!open);
              }
            }}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selected.length > 0 ? (
                selected.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="mr-1 mb-1 font-bold text-[10px] bg-white border-slate-200 flex items-center gap-1 h-7"
                    onClick={(e) => {
                      if (!disabled) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {item}
                    <span
                      role="button"
                      aria-label={`Remove ${item}`}
                      tabIndex={0}
                      className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-slate-100 p-0.5 inline-flex items-center justify-center transition-colors"
                      onKeyDown={(e) => {
                        if (!disabled && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnselect(item);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        if (!disabled) {
                          e.stopPropagation();
                          handleUnselect(item);
                        }
                      }}
                    >
                      <X className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                ))
              ) : (
                <span className="text-slate-400 font-medium text-xs ml-1">Select personnel...</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2 text-slate-400" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl border-slate-200 bg-white" align="start">
          <Command className="rounded-2xl">
            <CommandInput placeholder={`Search ${label}...`} className="h-10 text-xs border-none focus:ring-0" />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-6 text-center text-xs text-slate-400">No staff matching criteria.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.name);
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.name}
                      onSelect={() => {
                        if (isSelected) {
                          handleUnselect(option.name);
                        } else if (selected.length < max) {
                          onChange([...selected, option.name]);
                        }
                        setOpen(true);
                      }}
                      className="cursor-pointer py-3"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-primary",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold uppercase truncate">{option.name}</span>
                        <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{option.designation}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
