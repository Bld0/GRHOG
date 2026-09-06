import { NavItem } from '@/types';

/**
 * Цэсний мөрийг эрхээр шүүх.
 *
 * Хажуугийн цэс болон командын хайлт (kbar) хоёулаа НЭГ дүрэм ашиглах ёстой:
 * урьд нь зөвхөн хажуугийн цэс шүүгддэг байсан тул нуусан хуудас руу
 * командын хайлтаар (жишээ нь `t t`) орох боломжтой хэвээр байв.
 */
/**
 * Хорооны даргын харах цэс — ЗАМААР нь тодорхой жагсаасан.
 *
 * `requiresRole` нь ганц эрхийн нэр авдаг тул "VIEWER эсвэл KHOROO_LEADER"
 * гэдгийг тэр талбараар илэрхийлэх боломжгүй. Гэхдээ жагсаалт хэлбэр нь
 * зүгээр нэг тойрч гарах арга биш, ЗӨВ хэлбэр: даргад ямар хуудас
 * нээлттэйг backend-ийн allowlist тодорхойлдог бөгөөд шинэ цэс нэмэхэд
 * ДУУГҮЙ нээгдэхгүй байх ёстой. Энд байхгүй зам = даргад хаалттай.
 *
 * Зам бүр нь backend дээр бүсээр шүүгддэг цэгүүдээр тэжээгддэг:
 *   overview     → /dashboard/**            (DashboardService, бүгд шүүгдсэн)
 *   bins         → /bins, /dashboard/bin-summary
 *   card         → /clients, /bin-usages, /cards/{total-cards,total-access,activity-rate}
 *   transactions → /bin-usages, /transactions/{today-usage,today-average,
 *                  active-bins-today,overall-average}
 *   reports      → /reports/**
 *   complaints   → /complaints
 *   maintenance  → /maintenance, /maintenance/{categories,report}
 *
 * Жагсаалтад ОРООГҮЙ: `/dashboard/users` (backend /users нь SUPER_ADMIN),
 * `/dashboard/raw-data` (/raw-data/** даргад 403), `/dashboard/analytics`
 * (/analytics/** даргад 403 — цэсэнд ч байхгүй).
 */
const KHOROO_LEADER_NAV_URLS = new Set([
  '/dashboard/overview',
  '/dashboard/bins',
  '/dashboard/card',
  '/dashboard/transactions',
  '/dashboard/reports',
  '/dashboard/complaints',
  '/dashboard/maintenance'
]);

export function canSeeNavItem(
  item: NavItem,
  userRole: string | null | undefined
): boolean {
  // Хорооны дарга: зөвхөн дээрх жагсаалт. Энэ шалгалт `requiresRole`-ийн
  // шалгалтаас ӨМНӨ зогсох ёстой — эс бөгөөс `requiresRole` огт байхгүй
  // мөрүүд (эрхийн шаардлагагүй гэж) даргад дуугүй нээгдэнэ.
  if (userRole === 'KHOROO_LEADER') {
    return KHOROO_LEADER_NAV_URLS.has(item.url);
  }

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
