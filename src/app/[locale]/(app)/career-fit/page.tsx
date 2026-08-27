import { CareerFitListBoard } from "@/components/career-fit/career-fit-list-board";
import { parseDirParam, parsePageParam } from "@/lib/table-query";

function toStr(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CareerFitListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <CareerFitListBoard
      q={toStr(params.q) ?? ""}
      tier={toStr(params.tier)}
      dir={parseDirParam(toStr(params.dir))}
      page={parsePageParam(toStr(params.page))}
    />
  );
}
