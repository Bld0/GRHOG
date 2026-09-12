export interface CollectorCard {
  id: number;
  cardId: string;
  cardIdDec: string | null;
  name: string;
  phone: string | null;
  vehicleNumber: string | null;
  active: boolean;
  lastUsedAt: string | null;
  totalClearings: number;
  createdAt: string;
}

/** Картын дугаар бичихэд иргэний бүртгэлээс санал болгох мөр. */
export interface ClientCardSuggestion {
  clientId: number;
  cardId: string | null;
  cardIdDec: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
}

export const EMPTY_FORM = { name: '', cardId: '', phone: '', vehicleNumber: '' };

/** Санал болгож эхлэх хамгийн богино утга — сервер талын хязгаартай ижил. */
export const MIN_QUERY_LENGTH = 2;

export const normalizeCardValue = (value: string | null | undefined) =>
  (value ?? '').trim().toUpperCase();

/** Санал болгосон карт бичсэн дугаартай яг таарч байна уу. */
export const matchesTypedNumber = (
  suggestion: ClientCardSuggestion,
  typed: string
) => {
  const value = normalizeCardValue(typed);
  return (
    value.length > 0 &&
    (normalizeCardValue(suggestion.cardId) === value ||
      normalizeCardValue(suggestion.cardIdDec) === value)
  );
};

/** Жагсаалтад харуулах дугаар — уншигч дээр гардаг аравтыг эхэнд тавина. */
export const displayCardNumber = (suggestion: ClientCardSuggestion) =>
  suggestion.cardIdDec || suggestion.cardId || '';
