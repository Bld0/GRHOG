'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

/** Карт нэмэх ба засварлах хоёр цонхны хуваалцдаг талбарууд. */
export interface CardFormValues {
  name: string;
  email: string;
  phone: string;
  cardId: string;
  address: string;
  district: string;
  khoroo: string;
  streetBuilding: string;
  apartmentNumber: string;
  type: string;
}

export const EMPTY_CARD_FORM: CardFormValues = {
  name: '',
  email: '',
  phone: '',
  cardId: '',
  address: '',
  district: '',
  khoroo: '',
  streetBuilding: '',
  apartmentNumber: '',
  type: ''
};

/** УБ-ын дүүргүүд — нэмэх ба засварлах цонх хоёулаа энэ жагсаалтыг дагана. */
const DISTRICTS = [
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

const CLIENT_TYPES = ['ААНБ', 'СӨХ', 'Айл', 'Ажилтан'];

interface CardFormFieldsProps {
  /** `id` угтвар — нэг хуудсанд хоёр форм зэрэг байвал давхцахгүй. */
  idPrefix: string;
  values: CardFormValues;
  onChange: (patch: Partial<CardFormValues>) => void;
  /** Карт ID-гийн мөрөнд нэмж харуулах удирдлага (хөрвүүлэх унтраалга). */
  cardIdSlot?: React.ReactNode;
  nameLabel?: string;
  cardIdLabel?: string;
}

/**
 * Карт нэмэх ба засварлах хоёр цонх ижил 10 талбартай байсныг нэг газар
 * төвлөрүүлэв. Өмнө нь хоёр цонх нийт ~450 мөр JSX-ийг үсэг үсгээр давтдаг
 * тул шинэ талбар нэмэх бүрд хоёр газар засах шаардлагатай байв.
 */
export function CardFormFields({
  idPrefix,
  values,
  onChange,
  cardIdSlot,
  nameLabel = 'Нэр',
  cardIdLabel = 'Карт ID'
}: CardFormFieldsProps) {
  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <div className='grid gap-4 py-4'>
      <Field htmlFor={id('name')} label={nameLabel}>
        <Input
          id={id('name')}
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder='Овог нэр'
          className='col-span-3'
        />
      </Field>

      <Field htmlFor={id('cardId')} label={cardIdLabel}>
        <Input
          id={id('cardId')}
          value={values.cardId}
          onChange={(e) => onChange({ cardId: e.target.value })}
          placeholder='C12345678'
          className={
            cardIdSlot
              ? 'bg-muted-foreground/10 font-mono'
              : `col-span-3 font-mono ${values.cardId ? 'border-green-500 bg-green-50' : ''}`
          }
        />
        {cardIdSlot}
      </Field>

      <Field htmlFor={id('email')} label='И-мэйл'>
        <Input
          id={id('email')}
          type='email'
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder='example@email.com'
          className='col-span-3'
        />
      </Field>

      <Field htmlFor={id('phone')} label='Утас'>
        <Input
          id={id('phone')}
          type='tel'
          value={values.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder='99112233'
          className='col-span-3'
        />
      </Field>

      <Field htmlFor={id('district')} label='Дүүрэг'>
        <Select
          value={values.district}
          onValueChange={(value) => onChange({ district: value })}
        >
          <SelectTrigger className='col-span-3'>
            <SelectValue placeholder='Дүүрэг сонгоно уу' />
          </SelectTrigger>
          <SelectContent>
            {DISTRICTS.map((district) => (
              <SelectItem key={district} value={district}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field htmlFor={id('khoroo')} label='Хороо'>
        <Input
          id={id('khoroo')}
          type='number'
          value={values.khoroo}
          onChange={(e) => onChange({ khoroo: e.target.value })}
          placeholder='Хороо'
          className='col-span-3'
        />
      </Field>

      <Field htmlFor={id('streetBuilding')} label='Гудамж, байр'>
        <Input
          id={id('streetBuilding')}
          value={values.streetBuilding}
          onChange={(e) => onChange({ streetBuilding: e.target.value })}
          placeholder='Гудамж, байр'
          className='col-span-3'
        />
      </Field>

      <Field htmlFor={id('apartmentNumber')} label='Тоот'>
        <Input
          id={id('apartmentNumber')}
          type='number'
          value={values.apartmentNumber}
          onChange={(e) => onChange({ apartmentNumber: e.target.value })}
          placeholder='Тоот'
          className='col-span-3'
        />
      </Field>

      <Field htmlFor={id('address')} label='Дэлгэрэнгүй хаяг' labelAlign='left'>
        <Input
          id={id('address')}
          value={values.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder='Дэлгэрэнгүй хаяг'
          className='col-span-3'
        />
      </Field>

      <Field htmlFor={id('type')} label='Төрөл'>
        <Select
          value={values.type}
          onValueChange={(value) => onChange({ type: value })}
        >
          <SelectTrigger className='col-span-3'>
            <SelectValue placeholder='Төрөл сонгоно уу' />
          </SelectTrigger>
          <SelectContent>
            {CLIENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function Field({
  htmlFor,
  label,
  labelAlign = 'right',
  children
}: {
  htmlFor: string;
  label: string;
  labelAlign?: 'left' | 'right';
  children: React.ReactNode;
}) {
  return (
    <div className='grid grid-cols-4 items-center gap-4'>
      <Label htmlFor={htmlFor} className={`text-${labelAlign}`}>
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Formын утгыг backend-ийн хүлээж авдаг хэлбэрт хөрвүүлнэ. */
export function toClientPayload(values: CardFormValues) {
  return {
    name: values.name,
    email: values.email || null,
    phone: values.phone || null,
    cardId: values.cardId,
    address: values.address || null,
    district: values.district || null,
    khoroo: values.khoroo ? parseInt(values.khoroo) : null,
    streetBuilding: values.streetBuilding || null,
    apartmentNumber: values.apartmentNumber
      ? parseInt(values.apartmentNumber)
      : null,
    type: values.type || null
  };
}
