"use client";

import { useRef } from "react";
import { Bold } from "lucide-react";
import { parseBoldSegments } from "@/lib/resume-builder/parse-bold-text";

interface RichTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  boldLabel: string;
}

export function RichTextarea({ id, value, onChange, rows = 3, boldLabel }: RichTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleBold() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    onChange(`${before}**${selected}**${after}`);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + 2;
      textarea.setSelectionRange(cursorStart, cursorStart + selected.length);
    });
  }

  const segments = parseBoldSegments(value);
  const hasContent = value.trim().length > 0;

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleBold}
        aria-label={boldLabel}
        className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bold className="size-3.5" />
      </button>
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {hasContent && (
        <p className="text-xs text-muted-foreground">
          {segments.map((segment, index) =>
            segment.bold ? (
              <strong key={index} className="font-semibold text-foreground">
                {segment.text}
              </strong>
            ) : (
              <span key={index}>{segment.text}</span>
            )
          )}
        </p>
      )}
    </div>
  );
}
