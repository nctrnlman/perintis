"use client";

import { useEffect, useState } from "react";
import { useFormatter } from "next-intl";

export function HeaderClock() {
  const format = useFormatter();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setNow(new Date()), 0);
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  if (!now) return null;

  return (
    <p className="hidden text-sm text-muted-foreground md:block">
      {format.dateTime(now, { dateStyle: "full" })} &middot; {format.dateTime(now, { timeStyle: "short" })}
    </p>
  );
}
