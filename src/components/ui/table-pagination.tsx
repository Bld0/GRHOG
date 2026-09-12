'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { getPageNumbers } from '@/lib/pagination-range';

interface TablePaginationProps {
  /** 0-с эхэлсэн индекс. */
  currentPage: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
}

/**
 * Хүснэгтийн хуудаслалт.
 *
 * Долоон харагдац тус бүрдээ ижил 55 мөр JSX ба `getPageNumbers` функцийг
 * хуулж авсан байв.
 */
export function TablePagination({
  currentPage,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className='flex items-center justify-center space-x-2 py-4'>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href='#'
              onClick={(e) => {
                e.preventDefault();
                if (hasPrevious) onPageChange(currentPage - 1);
              }}
              className={!hasPrevious ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>

          {getPageNumbers(currentPage, totalPages).map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page);
                  }}
                  isActive={currentPage === page}
                >
                  {page + 1}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href='#'
              onClick={(e) => {
                e.preventDefault();
                if (hasNext) onPageChange(currentPage + 1);
              }}
              className={!hasNext ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
