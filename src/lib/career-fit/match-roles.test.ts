import { describe, expect, it } from "vitest";
import { matchRoles, type RoleArchetype } from "./match-roles";

const FIVE_SKILL_ROLE: RoleArchetype = {
  id: "five-skill-role",
  title: "Five Skill Role",
  category: "Test",
  commonSkills: ["Skill A", "Skill B", "Skill C", "Skill D", "Skill E"],
};

const SEVEN_SKILL_ROLE: RoleArchetype = {
  id: "seven-skill-role",
  title: "Seven Skill Role",
  category: "Test",
  commonSkills: ["S1", "S2", "S3", "S4", "S5", "S6", "S7"],
};

describe("matchRoles", () => {
  it("returns an empty array when the user has no skills", () => {
    expect(matchRoles([], [FIVE_SKILL_ROLE])).toEqual([]);
  });

  it("drops a role whose coverage is below 0.15", () => {
    const result = matchRoles(["S1"], [SEVEN_SKILL_ROLE]); // 1/7 ≈ 0.143
    expect(result).toEqual([]);
  });

  it("tiers a role as WORTH_EXPLORING at 0.2 coverage", () => {
    const result = matchRoles(["Skill A"], [FIVE_SKILL_ROLE]); // 1/5 = 0.2
    expect(result[0].tier).toBe("WORTH_EXPLORING");
  });

  it("tiers a role as GOOD at 0.4 coverage", () => {
    const result = matchRoles(["Skill A", "Skill B"], [FIVE_SKILL_ROLE]); // 2/5 = 0.4
    expect(result[0].tier).toBe("GOOD");
  });

  it("tiers a role as STRONG at 0.6 coverage", () => {
    const result = matchRoles(["Skill A", "Skill B", "Skill C"], [FIVE_SKILL_ROLE]); // 3/5 = 0.6
    expect(result[0].tier).toBe("STRONG");
  });

  it("matches skills case-insensitively", () => {
    const result = matchRoles(["skill a", "SKILL B", "Skill C"], [FIVE_SKILL_ROLE]);
    expect(result[0].matchedSkills).toEqual(["Skill A", "Skill B", "Skill C"]);
  });

  it("reports matchedSkills and missingSkills correctly", () => {
    const result = matchRoles(["Skill A", "Skill B", "Skill C"], [FIVE_SKILL_ROLE]);
    expect(result[0].matchedSkills).toEqual(["Skill A", "Skill B", "Skill C"]);
    expect(result[0].missingSkills).toEqual(["Skill D", "Skill E"]);
  });

  it("caps results at the top 5 by coverage", () => {
    const roles: RoleArchetype[] = Array.from({ length: 7 }, (_, i) => ({
      id: `role-${i}`,
      title: `Role ${i}`,
      category: "Test",
      commonSkills: ["Common Skill"],
    }));
    const result = matchRoles(["Common Skill"], roles);
    expect(result).toHaveLength(5);
  });

  it("does not pad results when fewer than 5 roles qualify", () => {
    const result = matchRoles(["Skill A", "Skill B", "Skill C"], [FIVE_SKILL_ROLE]);
    expect(result).toHaveLength(1);
  });

  it("sorts results by coverage descending", () => {
    const lowMatch: RoleArchetype = {
      id: "low",
      title: "Low",
      category: "Test",
      commonSkills: ["Skill A", "Skill B", "Skill C", "Skill D"],
    }; // 1/4 = 0.25
    const highMatch: RoleArchetype = {
      id: "high",
      title: "High",
      category: "Test",
      commonSkills: ["Skill A"],
    }; // 1/1 = 1.0
    const result = matchRoles(["Skill A"], [lowMatch, highMatch]);
    expect(result.map((r) => r.roleId)).toEqual(["high", "low"]);
  });
});
