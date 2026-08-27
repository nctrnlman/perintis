import { AtsCheckListBoard } from "@/components/ats-check/ats-check-list-board";
import { parseDirParam, parsePageParam, parseSortParam } from "@/lib/table-query";

const SORT_KEYS = ["filename", "score", "date"] as const;

function toStr(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AtsCheckListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <AtsCheckListBoard
      q={toStr(params.q) ?? ""}
      tier={toStr(params.tier)}
      sort={parseSortParam(toStr(params.sort), SORT_KEYS, "date")}
      dir={parseDirParam(toStr(params.dir))}
      page={parsePageParam(toStr(params.page))}
    />
  );
}
