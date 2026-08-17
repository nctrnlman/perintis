"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  addWorkExperience,
  deleteWorkExperience,
  updateWorkExperience,
} from "@/app/[locale]/(app)/profile/actions";

interface WorkExperienceItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  description: string | null;
  skillsUsed: string[];
}

interface WorkExperienceCardProps {
  experiences: WorkExperienceItem[];
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function WorkExperienceCard({ experiences }: WorkExperienceCardProps) {
  const t = useTranslations("profile.workExperience");
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingItem = experiences.find((e) => e.id === editingId) ?? null;

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
        ? await updateWorkExperience(editingId, formData)
        : await addWorkExperience(formData);

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
      const result = await deleteWorkExperience(id);
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

      {experiences.length === 0 && !formOpen && (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      )}

      {experiences.length > 0 && (
        <div className="mt-6 space-y-4">
          {experiences.map((exp) => (
            <div key={exp.id} className="rounded-2xl border border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{exp.title}</h3>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMonthYear(exp.startDate)} – {exp.endDate ? formatMonthYear(exp.endDate) : t("present")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditForm(exp.id)}
                    aria-label={t("edit")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(exp.id)}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {exp.description && (
                <p className="mt-3 text-sm text-muted-foreground">{exp.description}</p>
              )}
              {exp.skillsUsed.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {exp.skillsUsed.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
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
              <Label htmlFor="we-title">{t("titleLabel")}</Label>
              <Input id="we-title" name="title" defaultValue={editingItem?.title ?? ""} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="we-company">{t("companyLabel")}</Label>
              <Input
                id="we-company"
                name="company"
                defaultValue={editingItem?.company ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="we-location">{t("locationLabel")}</Label>
              <Input id="we-location" name="location" defaultValue={editingItem?.location ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="we-skills">{t("skillsUsedLabel")}</Label>
              <Input
                id="we-skills"
                name="skillsUsed"
                defaultValue={editingItem?.skillsUsed.join(", ") ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="we-start">{t("startDateLabel")}</Label>
              <Input
                id="we-start"
                name="startDate"
                type="date"
                defaultValue={toDateInputValue(editingItem?.startDate ?? null)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="we-end">{t("endDateLabel")}</Label>
              <Input
                id="we-end"
                name="endDate"
                type="date"
                defaultValue={toDateInputValue(editingItem?.endDate ?? null)}
              />
              <p className="text-xs text-muted-foreground">{t("stillWorkingLabel")}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="we-description">{t("descriptionLabel")}</Label>
            <textarea
              id="we-description"
              name="description"
              defaultValue={editingItem?.description ?? ""}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
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
