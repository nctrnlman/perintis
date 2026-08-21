import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { DataTableSearch } from "@/components/shared/data-table-search";
import { DataTableSortLink } from "@/components/shared/data-table-sort-link";
import { DeleteCoverLetterButton } from "@/components/cover-letter/delete-cover-letter-button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { parseDirParam, parsePageParam, parseSortParam } from "@/lib/table-query";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 10;
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
  const t = await getTranslations("coverLetter.list");
  const format = await getFormatter();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = parsePageParam(toStr(params.page));
  const sort = parseSortParam(toStr(params.sort), SORT_KEYS, "date");
  const dir = parseDirParam(toStr(params.dir));
  const q = toStr(params.q) ?? "";

  const where: Prisma.CoverLetterWhereInput = {
    userId: user?.id ?? "__none__",
    ...(q ? { companyName: { contains: q, mode: "insensitive" } } : {}),
  };

  const orderBy: Prisma.CoverLetterOrderByWithRelationInput =
    sort === "company" ? { companyName: dir } : { updatedAt: dir };

  const [coverLetters, total] = user
    ? await Promise.all([
        db.coverLetter.findMany({
          where,
          orderBy,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        db.coverLetter.count({ where }),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rawSearchParams: Record<string, string | undefined> = {
    q: q || undefined,
    sort,
    dir,
  };

  const showEmptyState = total === 0 && !q;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/cover-letter/new">{t("newButton")}</Link>}
        />
      </div>

      {showEmptyState ? (
        <p className="mt-10 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="sm:w-64">
            <DataTableSearch defaultValue={q} placeholder={t("searchPlaceholder")} />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
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
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coverLetters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                coverLetters.map((letter) => (
                  <TableRow key={letter.id}>
                    <TableCell className="p-0">
                      <Link
                        href={`/cover-letter/${encryptId(letter.id)}`}
                        className="block truncate px-4 py-3 font-medium hover:underline"
                      >
                        {letter.companyName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {letter.positionTitle}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format.dateTime(letter.updatedAt, { dateStyle: "medium" })}
                    </TableCell>
                    <TableCell>
                      <DeleteCoverLetterButton id={letter.id} />
                    </TableCell>
                  </TableRow>
                ))
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
