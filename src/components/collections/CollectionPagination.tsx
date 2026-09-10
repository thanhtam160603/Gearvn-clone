import Link from "next/link";

type CollectionPaginationProps = {
  pathname: string;
  queryString: string;
  page: number;
  totalPages: number;
};

export default function CollectionPagination({
  pathname,
  queryString,
  page,
  totalPages,
}: CollectionPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  function getPageHref(targetPage: number) {
    const params = new URLSearchParams(queryString);

    if (targetPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }

    const query = params.toString();

    return query ? `${pathname}?${query}` : pathname;
  }

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  const linkClass =
    "flex min-h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm";

  return (
    <nav
      aria-label="Phân trang sản phẩm"
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link href={getPageHref(page - 1)} className={linkClass}>
          Trước
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={`${linkClass} text-neutral-400`}
        >
          Trước
        </span>
      )}

      {pages.map((pageNumber) => (
        <Link
          key={pageNumber}
          href={getPageHref(pageNumber)}
          aria-current={pageNumber === page ? "page" : undefined}
          className={[
            linkClass,
            pageNumber === page
              ? "border-red-600 bg-red-600 text-white"
              : "border-neutral-200 bg-white text-neutral-700",
          ].join(" ")}
        >
          {pageNumber}
        </Link>
      ))}

      {page < totalPages ? (
        <Link href={getPageHref(page + 1)} className={linkClass}>
          Sau
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={`${linkClass} text-neutral-400`}
        >
          Sau
        </span>
      )}
    </nav>
  );
}