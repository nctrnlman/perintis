"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MoveHorizontal, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toast } from "@/components/ui/toast";
import { ApplicationCard, ApplicationCardContent, type ApplicationCardData } from "./application-card";
import { getStageColor } from "@/lib/application-tracker/stage-colors";
import { updateApplicationStage } from "@/app/[locale]/(app)/application-tracker/actions";

export type KanbanApplication = ApplicationCardData;

const STAGES = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

function KanbanColumn({
  stage,
  label,
  applications,
  addLabel,
}: {
  stage: string;
  label: string;
  applications: KanbanApplication[];
  addLabel: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const color = getStageColor(stage);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-60 shrink-0 flex-col rounded-xl border border-border p-2.5 ${
        isOver ? "bg-muted/50" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 px-0.5 pb-2.5">
        <span className={`size-1.5 shrink-0 rounded-full ${color.dot}`} />
        <h3 className="flex-1 truncate text-xs font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">{applications.length}</span>
      </div>
      <SortableContext
        items={applications.map((application) => application.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2">
          {applications.map((application) => (
            <ApplicationCard key={application.id} {...application} />
          ))}
        </div>
      </SortableContext>
      <Link
        href={`/application-tracker/new?stage=${stage}`}
        aria-label={addLabel}
        className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        {addLabel}
      </Link>
    </div>
  );
}

export function KanbanBoard({
  applications,
  addLabel,
  scrollHint,
}: {
  applications: KanbanApplication[];
  addLabel: string;
  scrollHint: string;
}) {
  const t = useTranslations("applicationTracker.stages");
  const tErrors = useTranslations("applicationTracker.editor");
  const [items, setItems] = useState(applications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeApplication = items.find((application) => application.id === activeId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const nextStage = String(over.id);
    if (!(STAGES as readonly string[]).includes(nextStage)) return;

    const applicationId = String(active.id);
    const current = items.find((application) => application.id === applicationId);
    if (!current || current.stage === nextStage) return;

    setItems((prev) =>
      prev.map((application) =>
        application.id === applicationId ? { ...application, stage: nextStage } : application
      )
    );

    updateApplicationStage(applicationId, nextStage).then((result) => {
      if ("error" in result) {
        toast.add({ title: tErrors("toastDeleteError"), type: "error" });
        setItems((prev) =>
          prev.map((application) =>
            application.id === applicationId
              ? { ...application, stage: current.stage }
              : application
          )
        );
      }
    });
  }

  return (
    <DndContext
      id="application-tracker-kanban"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MoveHorizontal className="size-3.5" />
        {scrollHint}
      </p>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              label={t(stage)}
              addLabel={addLabel}
              applications={items.filter((application) => application.stage === stage)}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
      </div>
      <DragOverlay>
        {activeApplication ? (
          <div className="w-56 rotate-2">
            <ApplicationCardContent {...activeApplication} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
