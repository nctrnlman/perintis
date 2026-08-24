"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { FileEdit, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface ApplicationCardProps {
  id: string;
  token: string;
  companyName: string;
  positionTitle: string;
  hasResume: boolean;
  hasCoverLetter: boolean;
  roundCount: number;
}

export function ApplicationCard({
  id,
  token,
  companyName,
  positionTitle,
  hasResume,
  hasCoverLetter,
  roundCount,
}: ApplicationCardProps) {
  const t = useTranslations("applicationTracker.card");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link
        href={`/application-tracker/${token}`}
        className="block rounded-2xl border border-border bg-background p-4 transition-transform hover:scale-[1.02]"
      >
        <p className="font-medium">{companyName}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{positionTitle}</p>
        {(hasResume || hasCoverLetter || roundCount > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {hasResume && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <FileEdit className="size-3" />
              </span>
            )}
            {hasCoverLetter && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <Mail className="size-3" />
              </span>
            )}
            {roundCount > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {t("roundsCount", { count: roundCount })}
              </span>
            )}
          </div>
        )}
      </Link>
    </div>
  );
}
