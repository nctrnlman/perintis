export const proficiencyOptions: Record<"id" | "en", string[]> = {
  id: ["Dasar", "Menengah", "Lanjutan", "Mahir", "Native"],
  en: ["Basic", "Intermediate", "Advanced", "Fluent", "Native"],
};

export const skillCategoryOptions: Record<"id" | "en", string[]> = {
  id: ["Teknis", "Soft Skill", "Bahasa", "Tools", "Desain"],
  en: ["Technical", "Soft Skill", "Language", "Tools", "Design"],
};

export function toComboboxOptions(values: string[]): { value: string; label: string }[] {
  return values.map((v) => ({ value: v, label: v }));
}
