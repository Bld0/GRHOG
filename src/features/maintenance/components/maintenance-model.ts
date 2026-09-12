export const PAGE_SIZE = 20;

export interface BinOption {
  id: number;
  binId: string;
  location: string | null;
  district: string | null;
  khoroo: number | null;
}

export interface MaintenanceForm {
  binId: string;
  performedAt: string;
  category: string;
  reason: string;
  actionTaken: string;
  performedBy: string;
  cost: string;
}

export const EMPTY_FORM: MaintenanceForm = {
  binId: '',
  performedAt: '',
  category: 'OTHER',
  reason: '',
  actionTaken: '',
  performedBy: '',
  cost: ''
};

/** datetime-local талбарын хэлбэр (yyyy-MM-ddTHH:mm). */
export function toLocalInput(value?: string): string {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
