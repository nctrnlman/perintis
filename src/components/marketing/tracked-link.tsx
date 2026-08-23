"use client";

import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics-events";

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  cta: string;
}

export function TrackedLink({ cta, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent("marketing_cta_click", { cta });
        onClick?.(e);
      }}
    />
  );
}
