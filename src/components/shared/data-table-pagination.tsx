import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  totalPages: number;
  prevLabel: string;
  nextLabel: string;
  pageInfo: string;
}

function buildHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  page: number
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Page numbers to render, with "ellipsis" markers for skipped ranges. Always includes 1 and totalPages. */
function getPageList(page: number, totalPages: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [1];

  const rangeStart = Math.max(2, page - 1);
  const rangeEnd = Math.min(totalPages - 1, page + 1);

  if (rangeStart > 2) pages.push("ellipsis");
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < totalPages - 1) pages.push("ellipsis");

  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

export function DataTablePagination({
  basePath,
  searchParams,
  page,
  totalPages,
  prevLabel,
  nextLabel,
  pageInfo,
}: DataTablePaginationProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const pageList = getPageList(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
      <span className="text-muted-foreground">{pageInfo}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href={buildHref(basePath, searchParams, page - 1)}
          aria-disabled={!hasPrev}
          tabIndex={hasPrev ? undefined : -1}
          className={cn(
            "flex items-center gap-1 rounded-lg border border-border px-3 py-1.5",
            hasPrev ? "hover:bg-muted" : "pointer-events-none opacity-40"
          )}
        >
          <ChevronLeft className="size-4" />
          {prevLabel}
        </Link>

        {pageList.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex size-8 items-center justify-center text-muted-foreground"
            >
              &hellip;
            </span>
          ) : (
            <Link
              key={item}
              href={buildHref(basePath, searchParams, item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg border text-sm tabular-nums",
                item === page
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-muted"
              )}
            >
              {item}
            </Link>
          )
        )}

        <Link
          href={buildHref(basePath, searchParams, page + 1)}
          aria-disabled={!hasNext}
          tabIndex={hasNext ? undefined : -1}
          className={cn(
            "flex items-center gap-1 rounded-lg border border-border px-3 py-1.5",
            hasNext ? "hover:bg-muted" : "pointer-events-none opacity-40"
          )}
        >
          {nextLabel}
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
