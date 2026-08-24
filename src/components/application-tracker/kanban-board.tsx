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
import { useTranslations } from "next-intl";
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
  emptyLabel,
}: {
  stage: string;
  label: string;
  applications: KanbanApplication[];
  emptyLabel: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const color = getStageColor(stage);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl border border-border p-3 ${
        isOver ? "bg-muted/50" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-1 pb-3">
        <span className={`size-1.5 shrink-0 rounded-full ${color.dot}`} />
        <h3 className="flex-1 text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">{applications.length}</span>
      </div>
      <SortableContext
        items={applications.map((application) => application.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2">
          {applications.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              {emptyLabel}
            </p>
          )}
          {applications.map((application) => (
            <ApplicationCard key={application.id} {...application} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ applications }: { applications: KanbanApplication[] }) {
  const t = useTranslations("applicationTracker.stages");
  const tCard = useTranslations("applicationTracker.card");
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
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            label={t(stage)}
            emptyLabel={tCard("columnEmpty")}
            applications={items.filter((application) => application.stage === stage)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApplication ? (
          <div className="w-64 rotate-2">
            <ApplicationCardContent {...activeApplication} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
