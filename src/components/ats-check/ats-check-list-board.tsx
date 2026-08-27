import { Plus, ShieldCheck } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableFilterPills } from "@/components/shared/data-table-filter-pills";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { DataTableSearch } from "@/components/shared/data-table-search";
import { DataTableSortLink } from "@/components/shared/data-table-sort-link";
import { EmptyState } from "@/components/shared/empty-state";
import { AtsCheckStatsRow } from "@/components/ats-check/ats-check-stats-row";
import { AtsCheckRowActions } from "@/components/ats-check/ats-check-row-actions";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { getScoreTier, type ScoreTier } from "@/lib/resume/scoring";
import { computeAtsCheckStats } from "@/lib/resume/ats-stats";
import { cn } from "@/lib/utils";
import type { Finding } from "@/lib/resume/types";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 5;

const TIER_BADGE_CLASSES: Record<ScoreTier, string> = {
  excellent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  good: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  needsWork: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface AtsCheckListBoardProps {
  q?: string;
  tier?: string;
  sort?: "filename" | "score" | "date";
  dir?: "asc" | "desc";
  page?: number;
}

export async function AtsCheckListBoard({
  q = "",
  tier,
  sort = "date",
  dir = "desc",
  page = 1,
}: AtsCheckListBoardProps = {}) {
  const t = await getTranslations("ats.list");
  const tResult = await getTranslations("ats.result");
  const format = await getFormatter();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const scoreFilter: Prisma.ATSCheckAnalysisWhereInput =
    tier === "excellent"
      ? { overallScore: { gte: 90 } }
      : tier === "good"
        ? { overallScore: { gte: 70, lt: 90 } }
        : tier === "needsWork"
          ? { overallScore: { lt: 70 } }
          : {};

  const where: Prisma.ATSCheckAnalysisWhereInput = {
    userId: user?.id ?? "__none__",
    ...(q ? { resume: { filename: { contains: q, mode: "insensitive" } } } : {}),
    ...scoreFilter,
  };

  const orderBy: Prisma.ATSCheckAnalysisOrderByWithRelationInput =
    sort === "filename"
      ? { resume: { filename: dir } }
      : sort === "score"
        ? { overallScore: dir }
        : { createdAt: dir };

  const [checks, total, allChecks] = user
    ? await Promise.all([
        db.aTSCheckAnalysis.findMany({
          where,
          include: { resume: true },
          orderBy,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        db.aTSCheckAnalysis.count({ where }),
        db.aTSCheckAnalysis.findMany({
          where: { userId: user.id },
          select: { overallScore: true, createdAt: true },
        }),
      ])
    : [[], 0, []];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rawSearchParams: Record<string, string | undefined> = {
    q: q || undefined,
    tier,
    sort,
    dir,
  };

  const stats = computeAtsCheckStats(allChecks);
  const showEmptyState = allChecks.length === 0 && !q && !tier;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/ats-check/new">
              <Plus className="size-4" />
              {t("newButton")}
            </Link>
          }
        />
      </div>

      {showEmptyState ? (
        <EmptyState
          icon={ShieldCheck}
          title={t("emptyTitle")}
          description={t("empty")}
          action={
            <Button
              nativeButton={false}
              render={
                <Link href="/ats-check/new">
                  <Plus className="size-4" />
                  {t("newButton")}
                </Link>
              }
            />
          }
        />
      ) : (
        <div className="mt-6 space-y-4">
          <AtsCheckStatsRow stats={stats} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DataTableFilterPills
              basePath="/ats-check"
              searchParams={rawSearchParams}
              paramKey="tier"
              allLabel={t("filterAll")}
              options={[
                { value: "excellent", label: tResult("tierExcellent") },
                { value: "good", label: tResult("tierGood") },
                { value: "needsWork", label: tResult("tierNeedsWork") },
              ]}
            />
            <div className="sm:w-64">
              <DataTableSearch defaultValue={q} placeholder={t("searchPlaceholder")} />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{t("tableNo")}</TableHead>
                <TableHead>
                  <DataTableSortLink
                    basePath="/ats-check"
                    searchParams={rawSearchParams}
                    sortKey="filename"
                    currentSort={sort}
                    currentDir={dir}
                    label={t("tableFilename")}
                  />
                </TableHead>
                <TableHead>
                  <DataTableSortLink
                    basePath="/ats-check"
                    searchParams={rawSearchParams}
                    sortKey="score"
                    currentSort={sort}
                    currentDir={dir}
                    label={t("tableScore")}
                  />
                </TableHead>
                <TableHead>{t("tableFindings")}</TableHead>
                <TableHead>
                  <DataTableSortLink
                    basePath="/ats-check"
                    searchParams={rawSearchParams}
                    sortKey="date"
                    currentSort={sort}
                    currentDir={dir}
                    label={t("tableDate")}
                  />
                </TableHead>
                <TableHead className="w-16 text-right">{t("tableActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {checks.map((check, index) => {
                    const findings = check.structuralFindings as unknown as Finding[];
                    const checkTier = getScoreTier(check.overallScore);
                    const token = encryptId(check.id);
                    const rowNumber = (page - 1) * PAGE_SIZE + index + 1;
                    return (
                      <TableRow key={check.id}>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {rowNumber}
                        </TableCell>
                        <TableCell className="p-0">
                          <Link
                            href={`/ats-check/${token}`}
                            className="block truncate px-4 py-3 font-medium"
                          >
                            {check.resume.filename ?? "-"}
                          </Link>
                        </TableCell>
                        <TableCell className="p-0">
                          <Link href={`/ats-check/${token}`} className="block px-4 py-3">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                TIER_BADGE_CLASSES[checkTier]
                              )}
                            >
                              {check.overallScore}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className="p-0">
                          <Link
                            href={`/ats-check/${token}`}
                            className="block px-4 py-3 text-muted-foreground"
                          >
                            {t("findingsCount", { count: findings.length })}
                          </Link>
                        </TableCell>
                        <TableCell className="p-0">
                          <Link
                            href={`/ats-check/${token}`}
                            className="block px-4 py-3 text-muted-foreground"
                          >
                            {format.dateTime(check.createdAt, { dateStyle: "medium" })}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <AtsCheckRowActions id={check.id} token={token} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {Array.from({ length: PAGE_SIZE - checks.length }).map((_, index) => (
                    <TableRow key={`filler-${index}`} className="hover:bg-transparent">
                      <TableCell colSpan={6} className="h-[52px] p-0" />
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>

          <DataTablePagination
            basePath="/ats-check"
            searchParams={rawSearchParams}
            page={page}
            totalPages={totalPages}
            prevLabel={t("prevPage")}
            nextLabel={t("nextPage")}
            pageInfo={t("pageInfo", { page, totalPages })}
          />
        </div>
      )}
    </div>
  );
}
