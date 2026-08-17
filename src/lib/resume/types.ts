export type FindingSeverity = "critical" | "warning" | "suggestion";

export interface Finding {
  category: string;
  severity: FindingSeverity;
  explanation: string;
  fixGuidance: string;
}
