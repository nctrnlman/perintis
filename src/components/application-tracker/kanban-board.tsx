"use client";

import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/toast";
import { ApplicationCard } from "./application-card";
import { updateApplicationStage } from "@/app/[locale]/(app)/application-tracker/actions";

export interface KanbanApplication {
  id: string;
  token: string;
  companyName: string;
  positionTitle: string;
  stage: string;
  hasResume: boolean;
  hasCoverLetter: boolean;
  roundCount: number;
}

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
}: {
  stage: string;
  label: string;
  applications: KanbanApplication[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl border border-border p-3 ${
        isOver ? "bg-muted/50" : ""
      }`}
    >
      <div className="flex items-center justify-between px-1 pb-3">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">{applications.length}</span>
      </div>
      <SortableContext
        items={applications.map((application) => application.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              id={application.id}
              token={application.token}
              companyName={application.companyName}
              positionTitle={application.positionTitle}
              hasResume={application.hasResume}
              hasCoverLetter={application.hasCoverLetter}
              roundCount={application.roundCount}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ applications }: { applications: KanbanApplication[] }) {
  const t = useTranslations("applicationTracker.stages");
  const tErrors = useTranslations("applicationTracker.editor");
  const [items, setItems] = useState(applications);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
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
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            label={t(stage)}
            applications={items.filter((application) => application.stage === stage)}
          />
        ))}
      </div>
    </DndContext>
  );
}
