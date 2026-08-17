"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  accept: string;
  maxSizeBytes: number;
  onFileSelected: (file: File) => void;
  label: string;
  hint: string;
  errorText?: string | null;
}

export function UploadDropzone({
  accept,
  onFileSelected,
  label,
  hint,
  errorText,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-12 text-center transition-colors",
          isDragging && "border-primary bg-muted"
        )}
      >
        <UploadCloud className="size-8 text-muted-foreground" />
        <p className="mt-4 text-sm font-medium">{fileName ?? label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {errorText && <p className="mt-2 text-sm text-destructive">{errorText}</p>}
    </div>
  );
}
