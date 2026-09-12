/** Хуудаслалтын товчны нэг нүд: хуудасны дугаар эсвэл таслалт. */
export type PageSlot = number | 'ellipsis';

/**
 * Харагдах хуудасны дугааруудыг гаргана (0-с эхэлсэн индекс).
 *
 * Долоон харагдац тус бүртээ ижил `getPageNumbers` функцийг хуулж авсан
 * байсныг нэг газар төвлөрүүлэв.
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisiblePages = 5
): PageSlot[] {
  if (totalPages <= maxVisiblePages) {
    return range(0, totalPages - 1);
  }
  if (currentPage <= 2) {
    return [...range(0, 3), 'ellipsis', totalPages - 1];
  }
  if (currentPage >= totalPages - 3) {
    return [0, 'ellipsis', ...range(totalPages - 4, totalPages - 1)];
  }
  return [
    0,
    'ellipsis',
    ...range(currentPage - 1, currentPage + 1),
    'ellipsis',
    totalPages - 1
  ];
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
