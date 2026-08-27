export interface ProfileCompletenessInput {
  fullName: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  targetRole: string | null;
  workExperienceCount: number;
  educationCount: number;
  skillCount: number;
}

const CHECKS: { key: string; check: (p: ProfileCompletenessInput) => boolean }[] = [
  { key: "basicInfo", check: (p) => Boolean(p.fullName && p.phone && p.location) },
  { key: "summary", check: (p) => Boolean(p.summary) },
  { key: "targetRole", check: (p) => Boolean(p.targetRole) },
  { key: "workExperience", check: (p) => p.workExperienceCount > 0 },
  { key: "education", check: (p) => p.educationCount > 0 },
  { key: "skills", check: (p) => p.skillCount > 0 },
];

export interface ProfileCompletenessResult {
  percentage: number;
  missing: string[];
}

export function computeProfileCompleteness(
  input: ProfileCompletenessInput
): ProfileCompletenessResult {
  const completedCount = CHECKS.filter((c) => c.check(input)).length;
  const missing = CHECKS.filter((c) => !c.check(input)).map((c) => c.key);
  const percentage = Math.round((completedCount / CHECKS.length) * 100);

  return { percentage, missing };
}
