"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";

interface GreetingHeaderProps {
  name: string | null;
}

function getGreetingKey(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "afternoon";
  if (hour >= 15 && hour < 18) return "evening";
  return "night";
}

export function GreetingHeader({ name }: GreetingHeaderProps) {
  const t = useTranslations("dashboard.greeting");
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

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h1 className="text-2xl font-semibold">
        {now ? t(getGreetingKey(now.getHours())) : ""}
        {name ? `, ${name}` : ""}
      </h1>
      {now && (
        <p className="text-sm text-muted-foreground">
          {format.dateTime(now, { dateStyle: "full" })} &middot;{" "}
          {format.dateTime(now, { timeStyle: "short" })}
        </p>
      )}
    </div>
  );
}
