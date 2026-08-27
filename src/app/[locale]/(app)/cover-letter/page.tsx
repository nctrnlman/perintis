import { CoverLetterListBoard } from "@/components/cover-letter/cover-letter-list-board";
import { parseDirParam, parsePageParam, parseSortParam } from "@/lib/table-query";

const SORT_KEYS = ["company", "date"] as const;

function toStr(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CoverLetterListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <CoverLetterListBoard
      q={toStr(params.q) ?? ""}
      tone={toStr(params.tone)}
      sort={parseSortParam(toStr(params.sort), SORT_KEYS, "date")}
      dir={parseDirParam(toStr(params.dir))}
      page={parsePageParam(toStr(params.page))}
    />
  );
}
