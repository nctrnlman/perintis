"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  addEducation,
  deleteEducation,
  updateEducation,
} from "@/app/[locale]/(app)/profile/actions";

interface EducationItem {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: Date;
  endDate: Date | null;
}

interface EducationCardProps {
  educations: EducationItem[];
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function EducationCard({ educations }: EducationCardProps) {
  const t = useTranslations("profile.education");
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingItem = educations.find((e) => e.id === editingId) ?? null;

  function openAddForm() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditForm(id: string) {
    setEditingId(id);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editingId
        ? await updateEducation(editingId, formData)
        : await addEducation(formData);

      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }

      toast.add({
        title: editingId ? t("toastUpdateSuccess") : t("toastAddSuccess"),
        type: "success",
      });
      closeForm();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteEducation(id);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        {!formOpen && (
          <Button variant="outline" size="sm" onClick={openAddForm}>
            <Plus className="size-4" />
            {t("addButton")}
          </Button>
        )}
      </div>

      {educations.length === 0 && !formOpen && (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      )}

      {educations.length > 0 && (
        <div className="mt-6 space-y-4">
          {educations.map((edu) => (
            <div key={edu.id} className="rounded-2xl border border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{edu.institution}</h3>
                  {(edu.degree || edu.fieldOfStudy) && (
                    <p className="text-sm text-muted-foreground">
                      {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMonthYear(edu.startDate)}
                    {edu.endDate ? ` – ${formatMonthYear(edu.endDate)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditForm(edu.id)}
                    aria-label={t("edit")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(edu.id)}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <form
          action={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-border p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edu-institution">{t("institutionLabel")}</Label>
              <Input
                id="edu-institution"
                name="institution"
                defaultValue={editingItem?.institution ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edu-degree">{t("degreeLabel")}</Label>
              <Input id="edu-degree" name="degree" defaultValue={editingItem?.degree ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edu-field">{t("fieldOfStudyLabel")}</Label>
              <Input
                id="edu-field"
                name="fieldOfStudy"
                defaultValue={editingItem?.fieldOfStudy ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edu-start">{t("startDateLabel")}</Label>
              <Input
                id="edu-start"
                name="startDate"
                type="date"
                defaultValue={toDateInputValue(editingItem?.startDate ?? null)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edu-end">{t("endDateLabel")}</Label>
              <Input
                id="edu-end"
                name="endDate"
                type="date"
                defaultValue={toDateInputValue(editingItem?.endDate ?? null)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
