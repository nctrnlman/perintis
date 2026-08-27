import { Compass, Plus } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableFilterPills } from "@/components/shared/data-table-filter-pills";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { DataTableSearch } from "@/components/shared/data-table-search";
import { DataTableSortLink } from "@/components/shared/data-table-sort-link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { computeCareerFitAggregateStats } from "@/lib/career-fit/stats";
import { CareerFitStatsRow } from "@/components/career-fit/career-fit-stats-row";
import { CareerFitRowActions } from "@/components/career-fit/career-fit-row-actions";
import { TierBreakdown, type CareerFitResult } from "@/components/career-fit/career-fit-result-card";

const PAGE_SIZE = 5;

interface CareerFitListBoardProps {
  q?: string;
  tier?: string;
  dir?: "asc" | "desc";
  page?: number;
}

export async function CareerFitListBoard({
  q = "",
  tier,
  dir = "desc",
  page = 1,
}: CareerFitListBoardProps = {}) {
  const t = await getTranslations("careerFit.list");
  const tTiers = await getTranslations("careerFit.tiers");
  const format = await getFormatter();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const allAnalyses = await db.potentialAnalysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: dir },
  });

  const aggregateStats = computeCareerFitAggregateStats(
    allAnalyses.map((analysis) => analysis.results as unknown as CareerFitResult[])
  );

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Compass className="size-4" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      <Button
        nativeButton={false}
        render={
          <Link href="/career-fit/new">
            <Plus className="size-4" />
            {t("newButton")}
          </Link>
        }
      />
    </div>
  );

  if (allAnalyses.length === 0) {
    return (
      <div>
        {header}
        <EmptyState
          icon={Compass}
          title={t("emptyTitle")}
          description={t("empty")}
          action={
            <Button
              nativeButton={false}
              render={
                <Link href="/career-fit/new">
                  <Plus className="size-4" />
                  {t("newButton")}
                </Link>
              }
            />
          }
        />
      </div>
    );
  }

  const normalizedQuery = q.trim().toLowerCase();
  const filtered = allAnalyses.filter((analysis) => {
    const results = analysis.results as unknown as CareerFitResult[];
    const matchesTier = tier ? results.some((result) => result.tier === tier) : true;
    const matchesQuery = normalizedQuery
      ? results.some(
          (result) =>
            result.title.toLowerCase().includes(normalizedQuery) ||
            result.category.toLowerCase().includes(normalizedQuery)
        )
      : true;
    return matchesTier && matchesQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const rawSearchParams: Record<string, string | undefined> = {
    q: q || undefined,
    tier,
    dir,
  };

  return (
    <div>
      {header}

      <div className="mt-6 space-y-4">
        <CareerFitStatsRow stats={aggregateStats} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <DataTableFilterPills
            basePath="/career-fit"
            searchParams={rawSearchParams}
            paramKey="tier"
            allLabel={t("filterAll")}
            options={[
              { value: "STRONG", label: tTiers("STRONG") },
              { value: "GOOD", label: tTiers("GOOD") },
              { value: "WORTH_EXPLORING", label: tTiers("WORTH_EXPLORING") },
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
              <TableHead>{t("tableSummary")}</TableHead>
              <TableHead>
                <DataTableSortLink
                  basePath="/career-fit"
                  searchParams={rawSearchParams}
                  sortKey="date"
                  currentSort="date"
                  currentDir={dir}
                  label={t("tableDate")}
                />
              </TableHead>
              <TableHead className="w-16 text-right">{t("tableActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  {t("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {pageItems.map((analysis, index) => {
                  const results = analysis.results as unknown as CareerFitResult[];
                  const token = encryptId(analysis.id);
                  const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;
                  return (
                    <TableRow key={analysis.id}>
                      <TableCell className="text-muted-foreground tabular-nums">{rowNumber}</TableCell>
                      <TableCell className="p-0">
                        <Link href={`/career-fit/${token}`} className="block px-4 py-3">
                          <p className="font-medium">{t("resultCount", { count: results.length })}</p>
                          <div className="mt-1.5">
                            <TierBreakdown results={results} />
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="p-0">
                        <Link
                          href={`/career-fit/${token}`}
                          className="block px-4 py-3 text-muted-foreground"
                        >
                          {format.dateTime(analysis.createdAt, { dateStyle: "medium" })}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <CareerFitRowActions id={analysis.id} token={token} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {Array.from({ length: PAGE_SIZE - pageItems.length }).map((_, index) => (
                  <TableRow key={`filler-${index}`} className="hover:bg-transparent">
                    <TableCell colSpan={4} className="h-[68px] p-0" />
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>

        <DataTablePagination
          basePath="/career-fit"
          searchParams={rawSearchParams}
          page={currentPage}
          totalPages={totalPages}
          prevLabel={t("prevPage")}
          nextLabel={t("nextPage")}
          pageInfo={t("pageInfo", { page: currentPage, totalPages })}
        />
      </div>
    </div>
  );
}
