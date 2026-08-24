"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setHour(new Date().getHours()), 0);
    const interval = setInterval(() => setHour(new Date().getHours()), 30_000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        {hour !== null ? t(getGreetingKey(hour)) : ""}
        {name ? `, ${name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
    </div>
  );
}
