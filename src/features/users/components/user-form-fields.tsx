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
import { Icons } from '@/components/icons';

import { UserAreaFields } from './user-area-fields';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'VIEWER'
  | 'DEVELOPER'
  | 'KHOROO_LEADER';

export interface UserFormValues {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  /** Зөвхөн хорооны даргад утгатай. Select мөр авдаг тул хороо ч мөр. */
  district: string;
  khoroo: string;
}

export const EMPTY_USER_FORM: UserFormValues = {
  username: '',
  email: '',
  password: '',
  role: 'ADMIN',
  district: '',
  khoroo: ''
};

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Супер админ', color: 'text-red-500' },
  { value: 'ADMIN', label: 'Админ', color: 'text-blue-500' },
  { value: 'VIEWER', label: 'Харагч', color: 'text-gray-500' },
  { value: 'KHOROO_LEADER', label: 'Хорооны дарга', color: 'text-green-600' }
];

const INPUT_CLASS =
  'focus:border-primary focus:ring-primary h-10 border-gray-300';
const LABEL_CLASS =
  'text-sm font-medium text-gray-700 dark:text-gray-300';
const HINT_CLASS = 'text-xs text-gray-500 dark:text-gray-400';

interface UserFormFieldsProps {
  /** `id` угтвар — нэг хуудсанд хоёр форм зэрэг байвал давхцахгүй. */
  idPrefix: string;
  values: UserFormValues;
  onChange: (patch: Partial<UserFormValues>) => void;
  /** Хорооны жагсаалтаас нэмэхэд бүс тогтсон байна. */
  areaLocked?: boolean;
  passwordLabel?: string;
  passwordHint?: string;
}

/**
 * Хэрэглэгч үүсгэх ба засах хоёр цонхны хуваалцсан талбарууд.
 *
 * Өмнө нь хоёр цонх ижил 5 талбарыг (нэр, и-мэйл, нууц үг, эрх, бүс) нийт
 * ~330 мөр JSX-ээр давтаж бичсэн байв — эрхийн жагсаалт ч хоёр газар.
 */
export function UserFormFields({
  idPrefix,
  values,
  onChange,
  areaLocked = false,
  passwordLabel = 'Нууц үг *',
  passwordHint = 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой'
}: UserFormFieldsProps) {
  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <div className='space-y-6 py-4'>
      <div className='grid grid-cols-1 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor={id('username')} className={LABEL_CLASS}>
            Хэрэглэгчийн нэр *
          </Label>
          <Input
            id={id('username')}
            placeholder='Хэрэглэгчийн нэр оруулна уу'
            value={values.username}
            onChange={(e) => onChange({ username: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor={id('email')} className={LABEL_CLASS}>
            И-мэйл хаяг *
          </Label>
          <Input
            id={id('email')}
            type='email'
            placeholder='example@email.com'
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor={id('password')} className={LABEL_CLASS}>
            {passwordLabel}
          </Label>
          <Input
            id={id('password')}
            type='password'
            placeholder='Хамгийн багадаа 6 тэмдэгт'
            value={values.password}
            onChange={(e) => onChange({ password: e.target.value })}
            className={INPUT_CLASS}
          />
          <p className={HINT_CLASS}>{passwordHint}</p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor={id('role')} className={LABEL_CLASS}>
            Хэрэглэгчийн эрх *
          </Label>
          <Select
            value={values.role}
            onValueChange={(value: UserRole) => onChange({ role: value })}
          >
            <SelectTrigger className={INPUT_CLASS}>
              <SelectValue placeholder='Эрх сонгоно уу' />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem
                  key={role.value}
                  value={role.value}
                  className='cursor-pointer'
                >
                  <div className='flex items-center space-x-2'>
                    <Icons.user className={`h-4 w-4 ${role.color}`} />
                    <span>{role.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className={HINT_CLASS}>
            Хэрэглэгчийн системд хандах эрхийг тодорхойлно
          </p>
        </div>

        {/* Бүс зөвхөн хорооны даргад утгатай. */}
        {values.role === 'KHOROO_LEADER' && (
          <UserAreaFields
            district={values.district}
            khoroo={values.khoroo}
            locked={areaLocked}
            onChange={(area) => onChange(area)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Сервер рүү илгээх бие.
 *
 * Бүсийг ЗӨВХӨН хорооны даргад оруулна: бусад эрхэд дүүрэг/хороо утгагүй.
 * Хороог тоо болгож хөрвүүлнэ.
 */
export function buildUserPayload(values: UserFormValues) {
  const base = {
    username: values.username,
    email: values.email,
    password: values.password,
    role: values.role
  };
  if (values.role !== 'KHOROO_LEADER') return base;
  return {
    ...base,
    district: values.district,
    khoroo: values.khoroo === '' ? null : Number(values.khoroo)
  };
}
