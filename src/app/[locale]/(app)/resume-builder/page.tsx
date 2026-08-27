import { FileEdit } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { DataTableSearch } from "@/components/shared/data-table-search";
import { DataTableSortLink } from "@/components/shared/data-table-sort-link";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateResumeButton } from "@/components/resume-builder/create-resume-button";
import { ResumeStatsRow } from "@/components/resume-builder/resume-stats-row";
import { ResumeRowActions } from "@/components/resume-builder/resume-row-actions";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { computeResumeListStats } from "@/lib/resume-builder/list-stats";
import { parseDirParam, parsePageParam, parseSortParam } from "@/lib/table-query";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 5;
const SORT_KEYS = ["title", "date"] as const;

function toStr(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResumeBuilderListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("resumeBuilder.list");
  const format = await getFormatter();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = parsePageParam(toStr(params.page));
  const sort = parseSortParam(toStr(params.sort), SORT_KEYS, "date");
  const dir = parseDirParam(toStr(params.dir));
  const q = toStr(params.q) ?? "";

  const where: Prisma.ResumeDocumentWhereInput = {
    userId: user?.id ?? "__none__",
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };

  const orderBy: Prisma.ResumeDocumentOrderByWithRelationInput =
    sort === "title" ? { title: dir } : { updatedAt: dir };

  const [resumeDocuments, total, allDocuments] = user
    ? await Promise.all([
        db.resumeDocument.findMany({
          where,
          orderBy,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        db.resumeDocument.count({ where }),
        db.resumeDocument.findMany({
          where: { userId: user.id },
          select: { createdAt: true },
        }),
      ])
    : [[], 0, []];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rawSearchParams: Record<string, string | undefined> = {
    q: q || undefined,
    sort,
    dir,
  };

  const stats = computeResumeListStats(allDocuments);
  const showEmptyState = allDocuments.length === 0 && !q;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileEdit className="size-4" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <CreateResumeButton />
      </div>

      {showEmptyState ? (
        <EmptyState
          icon={FileEdit}
          title={t("emptyTitle")}
          description={t("empty")}
          action={<CreateResumeButton />}
        />
      ) : (
        <div className="mt-6 space-y-4">
          <ResumeStatsRow stats={stats} />

          <div className="sm:w-64">
            <DataTableSearch defaultValue={q} placeholder={t("searchPlaceholder")} />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{t("tableNo")}</TableHead>
                <TableHead>
                  <DataTableSortLink
                    basePath="/resume-builder"
                    searchParams={rawSearchParams}
                    sortKey="title"
                    currentSort={sort}
                    currentDir={dir}
                    label={t("tableTitle")}
                  />
                </TableHead>
                <TableHead>
                  <DataTableSortLink
                    basePath="/resume-builder"
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
              {resumeDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {resumeDocuments.map((doc, index) => {
                    const token = encryptId(doc.id);
                    const rowNumber = (page - 1) * PAGE_SIZE + index + 1;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {rowNumber}
                        </TableCell>
                        <TableCell className="p-0">
                          <Link
                            href={`/resume-builder/${token}`}
                            className="block truncate px-4 py-3 font-medium"
                          >
                            {doc.title}
                          </Link>
                        </TableCell>
                        <TableCell className="p-0">
                          <Link
                            href={`/resume-builder/${token}`}
                            className="block px-4 py-3 text-muted-foreground"
                          >
                            {format.dateTime(doc.updatedAt, { dateStyle: "medium" })}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <ResumeRowActions id={doc.id} token={token} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {Array.from({ length: PAGE_SIZE - resumeDocuments.length }).map((_, index) => (
                    <TableRow key={`filler-${index}`} className="hover:bg-transparent">
                      <TableCell colSpan={4} className="h-[52px] p-0" />
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>

          <DataTablePagination
            basePath="/resume-builder"
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
