/** `GET /addresses`-ийн мөр (backend-ийн `AddressView`). */
export interface AddressOption {
  id: number;
  district: string;
  khoroo: number;
  streetBuilding: string | null;
  apartmentNumber: string | null;
  type: string | null;
  contactName: string | null;
  contactPhone: string | null;
  note: string | null;
  cardCount: number;
}

/** УБ-ын дүүргүүд — backend-ийн `AddressKeyUtils.DISTRICTS`-тэй ижил жагсаалт. */
export const DISTRICTS = [
  'Багануур',
  'Багахангай',
  'Баянгол',
  'Баянзүрх',
  'Налайх',
  'Сонгинохайрхан',
  'Сүхбаатар',
  'Хан-Уул',
  'Чингэлтэй'
];

export const CLIENT_TYPES = ['ААНБ', 'СӨХ', 'Айл', 'Ажилтан'];

/** Нэг мөр болгон уншигдахуйц хаяг. */
export function formatAddress(address: {
  district: string;
  khoroo: number;
  streetBuilding: string | null;
  apartmentNumber: string | null;
}) {
  return [
    address.district,
    `${address.khoroo}-р хороо`,
    address.streetBuilding,
    address.apartmentNumber ? `${address.apartmentNumber} тоот` : null
  ]
    .filter(Boolean)
    .join(', ');
}
