'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useDistrictOptions, useKhorooOptions } from '../api/use-area-options';

interface UserAreaFieldsProps {
  district: string;
  khoroo: string;
  onChange: (next: { district: string; khoroo: string }) => void;
  /**
   * Хорооны жагсаалтаас дуудахад бүс нь тухайн мөрөөр тогтсон байдаг —
   * тэр үед сонголтыг цоожилж, санамсаргүй өөр хороонд дарга нэмэхээс сэргийлнэ.
   */
  locked?: boolean;
}

/**
 * Хорооны даргын харьяа — дүүрэг ба хороо.
 *
 * Зөвхөн KHOROO_LEADER эрх сонгогдсон үед харагдана. Сервер тал хоёуланг нь
 * шаарддаг (дутуу бол 406) — бүсгүй дарга нь хамрах хүрээгүй дарга.
 *
 * Үүсгэх ба засах хоёр цонх хоёулаа энэ нэг л бүрэлдэхүүнийг ашиглана: блокийг
 * хоёр газар хуулбарлавал нэгийг нь засаад нөгөөг мартах нь цаг хугацааны асуудал.
 */
export function UserAreaFields({
  district,
  khoroo,
  onChange,
  locked = false
}: UserAreaFieldsProps) {
  const { districts, isLoading: districtsLoading } = useDistrictOptions();
  const { khoroos, isLoading: khoroosLoading } = useKhorooOptions(
    district || null
  );

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
      <div className='space-y-2'>
        <Label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          Дүүрэг *
        </Label>
        <Select
          value={district}
          disabled={locked || districtsLoading}
          // Дүүрэг солиход хуучин хороо утгагүй болно — хоёр дүүрэгт ижил
          // дугаартай хороо байдаг тул хамт цэвэрлэнэ.
          onValueChange={(value) => onChange({ district: value, khoroo: '' })}
        >
          <SelectTrigger className='h-10 border-gray-300'>
            <SelectValue
              placeholder={
                districtsLoading ? 'Ачаалж байна...' : 'Дүүрэг сонгоно уу'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {districts.map((item) => (
              <SelectItem key={item} value={item} className='cursor-pointer'>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          Хороо *
        </Label>
        <Select
          value={khoroo}
          disabled={locked || !district || khoroosLoading}
          onValueChange={(value) => onChange({ district, khoroo: value })}
        >
          <SelectTrigger className='h-10 border-gray-300'>
            <SelectValue
              placeholder={
                !district
                  ? 'Эхлээд дүүргээ сонгоно уу'
                  : khoroosLoading
                    ? 'Ачаалж байна...'
                    : 'Хороо сонгоно уу'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {khoroos.map((item) => (
              <SelectItem
                key={item}
                value={String(item)}
                className='cursor-pointer'
              >
                {item}-р хороо
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
