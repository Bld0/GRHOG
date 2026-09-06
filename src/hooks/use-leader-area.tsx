'use client';

import { useDistrictOptions, useKhorooOptions } from '@/features/users/api/use-area-options';
import { useRolePermissions } from './use-role-permissions';

/**
 * Нэвтэрсэн хорооны даргын харьяа бүс.
 *
 * Нэвтрэлтийн хариу district/khoroo буцаадаггүй тул үүнийг backend-ийн
 * `/dashboard/getDistrict` ба `/dashboard/getKhoroo`-оос гаргана: эдгээр
 * цэг нь даргад ЯГ НЭГ утга буцаадаг (CallerScope дарга бол өөрийнх нь
 * бүсийг тулгадаг), тиймээс жагсаалтын эхний элемент нь харьяа бүс өөрөө.
 *
 * Энэ нь зөвхөн ХАРУУЛАХ зорилготой — өгөгдлийн шүүлт backend дээр
 * хийгддэг тул энэ утга ирээгүй ч дата зөв хэвээр, зөвхөн шошго л хоосон
 * үлдэнэ.
 */
export function useLeaderArea() {
  const { isKhorooLeader } = useRolePermissions();
  const { districts } = useDistrictOptions();
  // ЯГ НЭГ утга ирсэн үед л хүлээж авна. Хэрэв олон ирвэл дуудагч дарга
  // биш (эсвэл бүс нь тодорхойгүй) гэсэн үг — тэр үед эхнийхийг нь сонгож
  // авбал ХОЛБООГҮЙ хороог даргын харьяа мэт харуулна. Буруу шошго
  // харуулахаас огт харуулахгүй нь дээр.
  const district = isKhorooLeader && districts.length === 1 ? districts[0] : null;
  const { khoroos } = useKhorooOptions(district);
  const khoroo = isKhorooLeader && khoroos.length === 1 ? khoroos[0] : null;

  const label = [
    district,
    khoroo == null ? null : `${khoroo}-р хороо`
  ]
    .filter((part): part is string => Boolean(part))
    .join(', ');

  return { isKhorooLeader, district, khoroo, label };
}
