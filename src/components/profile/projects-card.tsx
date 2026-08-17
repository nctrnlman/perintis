"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  addProject,
  deleteProject,
  updateProject,
} from "@/app/[locale]/(app)/profile/actions";

interface ProjectItem {
  id: string;
  name: string;
  client: string | null;
  role: string | null;
  bullets: string[];
  techStack: string[];
}

interface ProjectsCardProps {
  projects: ProjectItem[];
}

export function ProjectsCard({ projects }: ProjectsCardProps) {
  const t = useTranslations("profile.projects");
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingItem = projects.find((p) => p.id === editingId) ?? null;

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
        ? await updateProject(editingId, formData)
        : await addProject(formData);

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
      const result = await deleteProject(id);
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

      {projects.length === 0 && !formOpen && (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      )}

      {projects.length > 0 && (
        <div className="mt-6 space-y-4">
          {projects.map((proj) => (
            <div key={proj.id} className="rounded-2xl border border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">
                    {proj.name}
                    {proj.client ? ` – ${proj.client}` : ""}
                  </h3>
                  {proj.role && (
                    <p className="text-sm text-muted-foreground">{proj.role}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditForm(proj.id)}
                    aria-label={t("edit")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(proj.id)}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {proj.bullets.length > 0 && (
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {proj.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
              {proj.techStack.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {proj.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tech}
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
              <Label htmlFor="proj-name">{t("nameLabel")}</Label>
              <Input id="proj-name" name="name" defaultValue={editingItem?.name ?? ""} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-client">{t("clientLabel")}</Label>
              <Input id="proj-client" name="client" defaultValue={editingItem?.client ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-role">{t("roleLabel")}</Label>
              <Input id="proj-role" name="role" defaultValue={editingItem?.role ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-techStack">{t("techStackLabel")}</Label>
              <Input
                id="proj-techStack"
                name="techStack"
                defaultValue={editingItem?.techStack.join(", ") ?? ""}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-bullets">{t("bulletsLabel")}</Label>
            <textarea
              id="proj-bullets"
              name="bullets"
              defaultValue={editingItem?.bullets.join("\n") ?? ""}
              rows={4}
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
