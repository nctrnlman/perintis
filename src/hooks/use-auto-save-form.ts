"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type SaveResult = { success: true } | { error: string };

/**
 * Debounced auto-save for uncontrolled forms. Attach `handleChange` to the
 * form's onChange (React bubbles input/textarea change events through it),
 * attach `formRef` to the form element. No submit button needed.
 */
export function useAutoSaveForm(save: (formData: FormData) => Promise<SaveResult>, delay = 800) {
  const formRef = useRef<HTMLFormElement>(null);
  const saveRef = useRef(save);
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const handleChange = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (savedTimer.current) clearTimeout(savedTimer.current);

    debounceTimer.current = setTimeout(() => {
      const form = formRef.current;
      if (!form) return;
      const formData = new FormData(form);
      setStatus("saving");
      saveRef.current(formData).then((result) => {
        if ("error" in result) {
          setStatus("error");
          return;
        }
        setStatus("saved");
        savedTimer.current = setTimeout(() => setStatus("idle"), 2000);
      });
    }, delay);
  }, [delay]);

  return { formRef, status, handleChange };
}
