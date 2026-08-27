import { Link } from "@/i18n/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableSortLinkProps {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  sortKey: string;
  currentSort: string;
  currentDir: "asc" | "desc";
  label: string;
}

export function DataTableSortLink({
  basePath,
  searchParams,
  sortKey,
  currentSort,
  currentDir,
  label,
}: DataTableSortLinkProps) {
  const isActive = currentSort === sortKey;
  const nextDir = isActive && currentDir === "desc" ? "asc" : "desc";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "sort" && key !== "dir" && key !== "page") params.set(key, value);
  }
  params.set("sort", sortKey);
  params.set("dir", nextDir);

  const Icon = !isActive ? ArrowUpDown : currentDir === "desc" ? ArrowDown : ArrowUp;

  return (
    <Link
      href={`${basePath}?${params.toString()}`}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground",
        isActive && "text-foreground"
      )}
    >
      {label}
      <Icon className="size-3.5" />
    </Link>
  );
}
