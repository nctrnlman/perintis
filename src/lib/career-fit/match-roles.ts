export interface RoleArchetype {
  id: string;
  title: string;
  category: string;
  commonSkills: string[];
}

export interface RoleMatch {
  roleId: string;
  title: string;
  category: string;
  tier: "STRONG" | "GOOD" | "WORTH_EXPLORING";
  matchedSkills: string[];
  missingSkills: string[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function tierForCoverage(coverage: number): RoleMatch["tier"] | null {
  if (coverage >= 0.6) return "STRONG";
  if (coverage >= 0.35) return "GOOD";
  if (coverage >= 0.15) return "WORTH_EXPLORING";
  return null;
}

export function matchRoles(userSkills: string[], roles: RoleArchetype[]): RoleMatch[] {
  const normalizedUserSkills = new Set(userSkills.map(normalize));

  const scored = roles.map((role) => {
    const matchedSkills = role.commonSkills.filter((skill) =>
      normalizedUserSkills.has(normalize(skill))
    );
    const missingSkills = role.commonSkills.filter(
      (skill) => !normalizedUserSkills.has(normalize(skill))
    );
    const coverage =
      role.commonSkills.length === 0 ? 0 : matchedSkills.length / role.commonSkills.length;
    const tier = tierForCoverage(coverage);

    return { role, matchedSkills, missingSkills, coverage, tier };
  });

  return scored
    .filter((entry): entry is typeof entry & { tier: RoleMatch["tier"] } => entry.tier !== null)
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 5)
    .map((entry) => ({
      roleId: entry.role.id,
      title: entry.role.title,
      category: entry.role.category,
      tier: entry.tier,
      matchedSkills: entry.matchedSkills,
      missingSkills: entry.missingSkills,
    }));
}
