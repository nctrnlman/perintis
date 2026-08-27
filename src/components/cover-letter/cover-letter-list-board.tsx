import { Mail, Plus } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableFilterPills } from "@/components/shared/data-table-filter-pills";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { DataTableSearch } from "@/components/shared/data-table-search";
import { DataTableSortLink } from "@/components/shared/data-table-sort-link";
import { EmptyState } from "@/components/shared/empty-state";
import { CoverLetterStatsRow } from "@/components/cover-letter/cover-letter-stats-row";
import { CoverLetterRowActions } from "@/components/cover-letter/cover-letter-row-actions";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { computeCoverLetterStats } from "@/lib/cover-letter/stats";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 5;

interface CoverLetterListBoardProps {
  q?: string;
  tone?: string;
  sort?: "company" | "date";
  dir?: "asc" | "desc";
  page?: number;
}

export async function CoverLetterListBoard({
  q = "",
  tone,
  sort = "date",
  dir = "desc",
  page = 1,
}: CoverLetterListBoardProps = {}) {
  const t = await getTranslations("coverLetter.list");
  const tNew = await getTranslations("coverLetter.new");
  const format = await getFormatter();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const where: Prisma.CoverLetterWhereInput = {
    userId: user?.id ?? "__none__",
    ...(q ? { companyName: { contains: q, mode: "insensitive" } } : {}),
    ...(tone ? { tone } : {}),
  };

  const orderBy: Prisma.CoverLetterOrderByWithRelationInput =
    sort === "company" ? { companyName: dir } : { updatedAt: dir };

  const [coverLetters, total, allLetters] = user
    ? await Promise.all([
        db.coverLetter.findMany({
          where,
          orderBy,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        db.coverLetter.count({ where }),
        db.coverLetter.findMany({
          where: { userId: user.id },
          select: { tone: true, createdAt: true },
        }),
      ])
    : [[], 0, []];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rawSearchParams: Record<string, string | undefined> = {
    q: q || undefined,
    tone,
    sort,
    dir,
  };

  const stats = computeCoverLetterStats(allLetters);
  const showEmptyState = allLetters.length === 0 && !q && !tone;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Mail className="size-4" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/cover-letter/new">
              <Plus className="size-4" />
              {t("newButton")}
            </Link>
          }
        />
      </div>

      {showEmptyState ? (
        <EmptyState
          icon={Mail}
          title={t("emptyTitle")}
          description={t("empty")}
          action={
            <Button
              nativeButton={false}
              render={
                <Link href="/cover-letter/new">
                  <Plus className="size-4" />
                  {t("newButton")}
                </Link>
              }
            />
          }
        />
      ) : (
        <div className="mt-6 space-y-4">
          <CoverLetterStatsRow stats={stats} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DataTableFilterPills
              basePath="/cover-letter"
              searchParams={rawSearchParams}
              paramKey="tone"
              allLabel={t("filterAll")}
              options={[
                { value: "formal", label: tNew("toneFormal") },
                { value: "casual", label: tNew("toneCasual") },
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
                    basePath="/cover-letter"
                    searchParams={rawSearchParams}
                    sortKey="company"
                    currentSort={sort}
                    currentDir={dir}
                    label={t("tableCompany")}
                  />
                </TableHead>
                <TableHead>{t("tablePosition")}</TableHead>
                <TableHead>
                  <DataTableSortLink
                    basePath="/cover-letter"
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
              {coverLetters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {coverLetters.map((letter, index) => {
                    const token = encryptId(letter.id);
                    const rowNumber = (page - 1) * PAGE_SIZE + index + 1;
                    return (
                      <TableRow key={letter.id}>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {rowNumber}
                        </TableCell>
                        <TableCell className="p-0">
                          <Link
                            href={`/cover-letter/${token}`}
                            className="block truncate px-4 py-3 font-medium"
                          >
                            {letter.companyName}
                          </Link>
                        </TableCell>
                        <TableCell className="p-0">
                          <Link
                            href={`/cover-letter/${token}`}
                            className="block truncate px-4 py-3 text-muted-foreground"
                          >
                            {letter.positionTitle}
                          </Link>
                        </TableCell>
                        <TableCell className="p-0">
                          <Link
                            href={`/cover-letter/${token}`}
                            className="block px-4 py-3 text-muted-foreground"
                          >
                            {format.dateTime(letter.updatedAt, { dateStyle: "medium" })}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <CoverLetterRowActions id={letter.id} token={token} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {Array.from({ length: PAGE_SIZE - coverLetters.length }).map((_, index) => (
                    <TableRow key={`filler-${index}`} className="hover:bg-transparent">
                      <TableCell colSpan={5} className="h-[52px] p-0" />
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>

          <DataTablePagination
            basePath="/cover-letter"
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
