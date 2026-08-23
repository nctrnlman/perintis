"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { RichTextEditor } from "@/components/resume-builder/rich-text-editor";
import { useAutoSaveForm } from "@/hooks/use-auto-save-form";
import { SaveStatus } from "@/components/profile/save-status";
import {
  addWorkExperience,
  deleteWorkExperience,
  updateWorkExperience,
} from "@/app/[locale]/(app)/profile/actions";
import { trackEvent } from "@/lib/analytics-events";

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

function ExperienceFields({
  item,
  onFieldChange,
}: {
  item: WorkExperienceItem | null;
  onFieldChange?: () => void;
}) {
  const t = useTranslations("profile.workExperience");
  const [description, setDescription] = useState(item?.description ?? "");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="we-title">{t("titleLabel")}</Label>
          <Input id="we-title" name="title" defaultValue={item?.title ?? ""} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="we-company">{t("companyLabel")}</Label>
          <Input id="we-company" name="company" defaultValue={item?.company ?? ""} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="we-location">{t("locationLabel")}</Label>
          <Input id="we-location" name="location" defaultValue={item?.location ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="we-skills">{t("skillsUsedLabel")}</Label>
          <Input
            id="we-skills"
            name="skillsUsed"
            defaultValue={item?.skillsUsed.join(", ") ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="we-start">{t("startDateLabel")}</Label>
          <Input
            id="we-start"
            name="startDate"
            type="date"
            defaultValue={toDateInputValue(item?.startDate ?? null)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="we-end">{t("endDateLabel")}</Label>
          <Input
            id="we-end"
            name="endDate"
            type="date"
            defaultValue={toDateInputValue(item?.endDate ?? null)}
          />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">{t("stillWorkingLabel")}</p>
      </div>
      <div className="space-y-1.5">
        <Label>{t("descriptionLabel")}</Label>
        <RichTextEditor
          value={description}
          onChange={(html) => {
            setDescription(html);
            onFieldChange?.();
          }}
          boldLabel={t("boldLabel")}
          italicLabel={t("italicLabel")}
          bulletListLabel={t("bulletListLabel")}
          orderedListLabel={t("orderedListLabel")}
          strikeLabel={t("strikeLabel")}
          codeLabel={t("codeLabel")}
          horizontalRuleLabel={t("horizontalRuleLabel")}
          allowExtendedFormatting
        />
        <input type="hidden" name="description" value={description} readOnly />
      </div>
    </>
  );
}

function EditExperienceForm({ item, onClose }: { item: WorkExperienceItem; onClose: () => void }) {
  const t = useTranslations("profile.workExperience");
  const { formRef, status, handleChange } = useAutoSaveForm((formData) =>
    updateWorkExperience(item.id, formData)
  );

  return (
    <form
      ref={formRef}
      onChange={handleChange}
      className="mt-6 space-y-4 rounded-2xl border border-border p-6"
    >
      <div className="flex items-center justify-end">
        <SaveStatus status={status} />
      </div>
      <ExperienceFields item={item} onFieldChange={handleChange} />
      <Button type="button" variant="outline" onClick={onClose}>
        {t("close")}
      </Button>
    </form>
  );
}

export function WorkExperienceCard({ experiences }: WorkExperienceCardProps) {
  const t = useTranslations("profile.workExperience");
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  function handleAddSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addWorkExperience(formData);

      if ("error" in result) {
        trackEvent("profile_section_update_failed", { section: "work_experience", action: "add" });
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }

      trackEvent("profile_section_updated", { section: "work_experience", action: "add" });
      toast.add({ title: t("toastAddSuccess"), type: "success" });
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
      trackEvent("profile_section_updated", { section: "work_experience", action: "delete" });
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
                <div
                  className="mt-3 text-sm text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_hr]:my-2 [&_hr]:border-border [&_li_p]:inline [&_ol]:my-0 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:space-y-0.5 [&_ol]:pl-5 [&_p]:m-0 [&_ul]:my-0 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:space-y-0.5 [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: exp.description }}
                />
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

              {editingId === exp.id && (
                <EditExperienceForm key={exp.id} item={exp} onClose={closeForm} />
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && editingId === null && (
        <form
          action={handleAddSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-border p-6"
        >
          <ExperienceFields item={null} />
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
