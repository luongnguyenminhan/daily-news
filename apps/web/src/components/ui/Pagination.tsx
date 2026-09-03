interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = getVisiblePages(currentPage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-[13px] flex items-center justify-center gap-1.5 sm:gap-[17px]"
      aria-label="Pagination"
    >
      <button
        className="h-[53px] min-w-[46px] rounded-[9px] border border-[#202b3b] bg-[#0e1521]/70 px-[14px] text-[17px] text-[#b8c2d0] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ‹ Previous
      </button>
      {pages.map((page, index) =>
        page === null ? (
          <span key={`ellipsis-${index}`} className="text-[#bec6d4]">
            …
          </span>
        ) : (
          <button
            key={page}
            className={`h-[53px] min-w-[36px] rounded-[9px] border border-[#202b3b] bg-[#0e1521]/70 px-2 text-[17px] text-[#b8c2d0] sm:min-w-[46px] sm:px-[14px] ${page === currentPage ? "border-[#603ef1] bg-[#593ae8] text-white" : ""}`}
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ),
      )}
      <button
        className="h-[53px] min-w-[46px] rounded-[9px] border border-[#202b3b] bg-[#0e1521]/70 px-[14px] text-[17px] text-[#b8c2d0] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next ›
      </button>
    </nav>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages: Array<number | null> = [1];
  const rangeStart = Math.max(2, currentPage - 1);
  const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
  if (rangeStart > 2) pages.push(null);
  for (let page = rangeStart; page <= rangeEnd; page += 1) pages.push(page);
  if (rangeEnd < totalPages - 1) pages.push(null);
  pages.push(totalPages);
  return pages;
}
