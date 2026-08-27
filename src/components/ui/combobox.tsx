"use client";

import { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  customValueLabel?: (query: string) => string;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  emptyLabel = "Tidak ditemukan.",
  customValueLabel = (query) => `Gunakan "${query}"`,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const trimmedQuery = query.trim();
  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(trimmedQuery.toLowerCase())
  );
  const showCustomOption =
    trimmedQuery.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === trimmedQuery.toLowerCase());

  function handleSelect(next: string) {
    onChange(next);
    setQuery("");
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-transparent px-3.5 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <span className={cn("truncate text-left", !value && "text-muted-foreground")}>
          {selected?.label ?? value ?? placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          <CommandList>
            {filteredOptions.map((option) => (
              <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                <Check className={cn("size-4", option.value === value ? "opacity-100" : "opacity-0")} />
                {option.label}
              </CommandItem>
            ))}
            {showCustomOption && (
              <CommandItem onSelect={() => handleSelect(trimmedQuery)}>
                <Plus className="size-4" />
                {customValueLabel(trimmedQuery)}
              </CommandItem>
            )}
            {filteredOptions.length === 0 && !showCustomOption && (
              <CommandEmpty>{emptyLabel}</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
