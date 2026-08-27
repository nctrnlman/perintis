"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFormatter, useTranslations } from "next-intl";
import { FileEdit, Mail, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getStageColor } from "@/lib/application-tracker/stage-colors";

export interface ApplicationCardData {
  id: string;
  token: string;
  companyName: string;
  positionTitle: string;
  stage: string;
  location: string | null;
  updatedAt: Date;
  hasResume: boolean;
  hasCoverLetter: boolean;
  roundCount: number;
}

export function ApplicationCardContent({
  companyName,
  positionTitle,
  stage,
  location,
  updatedAt,
  hasResume,
  hasCoverLetter,
  roundCount,
  dragging = false,
}: Omit<ApplicationCardData, "id" | "token"> & { dragging?: boolean }) {
  const t = useTranslations("applicationTracker.card");
  const format = useFormatter();
  const color = getStageColor(stage);

  return (
    <div
      className={`rounded-xl border border-border bg-background p-3 transition-transform ${
        dragging ? "shadow-lg" : "hover:scale-[1.02]"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`size-1.5 shrink-0 rounded-full ${color.dot}`} />
        <p className="truncate text-sm font-medium">{companyName}</p>
      </div>
      <p className="mt-0.5 truncate pl-3 text-xs text-muted-foreground">{positionTitle}</p>

      {(hasResume || hasCoverLetter || roundCount > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-3">
          {hasResume && (
            <span className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              <FileEdit className="size-3" />
            </span>
          )}
          {hasCoverLetter && (
            <span className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              <Mail className="size-3" />
            </span>
          )}
          {roundCount > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {t("roundsCount", { count: roundCount })}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 pl-3 text-[0.7rem] text-muted-foreground/80">
        {location && (
          <span className="flex min-w-0 items-center gap-0.5 truncate">
            <MapPin className="size-2.5 shrink-0" />
            <span className="truncate">{location}</span>
          </span>
        )}
        <span className="ml-auto shrink-0">{format.relativeTime(updatedAt)}</span>
      </div>
    </div>
  );
}

export function ApplicationCard(props: ApplicationCardData) {
  const { id, token } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/application-tracker/${token}`} className="block">
        <ApplicationCardContent {...props} />
      </Link>
    </div>
  );
}
