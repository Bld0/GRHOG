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

/** УБ-ын дүүргийн товчлол — чөлөөт хаягийн бичвэрт түгээмэл. */
const DISTRICT_ABBR: Record<string, string> = {
  ЧД: 'Чингэлтэй',
  СБД: 'Сүхбаатар',
  БЗД: 'Баянзүрх',
  БГД: 'Баянгол',
  ХУД: 'Хан-Уул',
  СХД: 'Сонгинохайрхан',
  НД: 'Налайх',
  БХД: 'Багахангай',
  БНД: 'Багануур'
};

/**
 * `formatAddress`-ийн урвуу — чөлөөт бичвэр хаягийг эвристикээр задална.
 *
 * Ашиглалтын мөрөнд (BinUsage.clientAddress) хаяг зөвхөн нэг мөр бичвэрээр
 * хадгалагддаг тул багана болгон харуулахын тулд задлах хэрэгтэй.
 *
 * ponytail: эвристик задлалт. Таарахгүй хэсэг нь null болно. BinUsage дээр
 * бүтэцтэй талбар (district/khoroo/...) нэмэгдвэл үүнийг хаяна.
 */
export function parseAddress(raw: string | null | undefined) {
  const text = (raw ?? '').trim();
  const pick = (re: RegExp) => text.match(re)?.[1]?.trim() || null;

  const abbr = pick(
    /(?:^|[\s,.])(ЧД|СБД|БЗД|БГД|ХУД|СХД|НД|БХД|БНД)(?=[\s,.]|$)/i
  );
  const named = DISTRICTS.find((d) =>
    text.toLowerCase().includes(d.toLowerCase())
  );

  return {
    district: named ?? (abbr ? DISTRICT_ABBR[abbr.toUpperCase()] : null),
    khoroo: pick(/(\d+)\s*-?\s*р?\s*хороо/i),
    streetBuilding:
      pick(/([^\s,]+)\s*байр/i)?.replace(/\s*-?\s*р$/i, '') ?? null,
    apartmentNumber: pick(/(\S+)\s*тоот/i)?.replace(/\s*-?\s*р$/i, '') ?? null
  };
}
