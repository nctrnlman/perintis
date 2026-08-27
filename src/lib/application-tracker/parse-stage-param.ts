import { applicationStageValues } from "../validations/application-tracker";

type StageValue = (typeof applicationStageValues)[number];

export function parseStageParam(value: string | string[] | undefined): StageValue {
  const raw = Array.isArray(value) ? value[0] : value;
  return (applicationStageValues as readonly string[]).includes(raw ?? "")
    ? (raw as StageValue)
    : "APPLIED";
}
