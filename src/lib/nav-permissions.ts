import { NavItem } from '@/types';

/**
 * Цэсний мөрийг эрхээр шүүх.
 *
 * Хажуугийн цэс болон командын хайлт (kbar) хоёулаа НЭГ дүрэм ашиглах ёстой:
 * урьд нь зөвхөн хажуугийн цэс шүүгддэг байсан тул нуусан хуудас руу
 * командын хайлтаар (жишээ нь `t t`) орох боломжтой хэвээр байв.
 */
export function canSeeNavItem(
  item: NavItem,
  userRole: string | null | undefined
): boolean {
  // Эрхийн шаардлагагүй мөрийг нэвтэрсэн бүх хэрэглэгч харна.
  if (!item.requiresRole) return true;

  // SUPER_ADMIN бүгдийг харна.
  if (userRole === 'SUPER_ADMIN') return true;

  // ADMIN нь супер админд зориулснаас бусдыг харна.
  if (userRole === 'ADMIN' && item.requiresRole !== 'SUPER_ADMIN') return true;

  // VIEWER зөвхөн харах түвшний мөрүүдийг харна.
  if (userRole === 'VIEWER' && item.requiresRole === 'VIEWER') return true;

  // DEVELOPER нь харах түвшин болон хөгжүүлэгчийн мөрүүдийг харна.
  if (
    userRole === 'DEVELOPER' &&
    (item.requiresRole === 'VIEWER' || item.requiresRole === 'DEVELOPER')
  ) {
    return true;
  }

  return false;
}

export function filterNavItemsByRole(
  items: NavItem[],
  userRole: string | null | undefined
): NavItem[] {
  return items.filter((item) => canSeeNavItem(item, userRole));
}
