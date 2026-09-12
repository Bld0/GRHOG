'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORY_LABEL, MaintenanceRecord } from '@/features/reports/types';

import type { BinOption, MaintenanceForm } from '../maintenance-model';

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null бол шинэ бүртгэл. */
  editing: MaintenanceRecord | null;
  form: MaintenanceForm;
  onChange: (patch: Partial<MaintenanceForm>) => void;
  bins: BinOption[];
  isSaving: boolean;
  onSave: () => void;
}

/** Засварын бүртгэл нэмэх/засах цонх. */
export function MaintenanceDialog({
  open,
  onOpenChange,
  editing,
  form,
  onChange,
  bins,
  isSaving,
  onSave
}: MaintenanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Засварын бүртгэл засах' : 'Шинэ засварын бүртгэл'}
          </DialogTitle>
          <DialogDescription>
            Аль саванд, хэзээ, ямар шалтгаанаар засвар хийснийг бүртгэнэ.
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 gap-4 py-2 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='maintenance-bin'>Хогийн сав *</Label>
            <Select
              value={form.binId}
              onValueChange={(value) => onChange({ binId: value })}
            >
              <SelectTrigger id='maintenance-bin'>
                <SelectValue placeholder='Сав сонгоно уу' />
              </SelectTrigger>
              <SelectContent className='max-h-72'>
                {bins.map((bin) => (
                  <SelectItem key={bin.id} value={String(bin.id)}>
                    {bin.binId}
                    {bin.location ? ` — ${bin.location}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='maintenance-date'>Засвар хийсэн огноо *</Label>
            <Input
              id='maintenance-date'
              type='datetime-local'
              value={form.performedAt}
              onChange={(e) =>
                onChange({ performedAt: e.target.value })
              }
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='maintenance-category'>Шалтгааны ангилал *</Label>
            <Select
              value={form.category}
              onValueChange={(value) => onChange({ category: value })}
            >
              <SelectTrigger id='maintenance-category'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CATEGORY_LABEL).map((key) => (
                  <SelectItem key={key} value={key}>
                    {CATEGORY_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='maintenance-by'>Гүйцэтгэсэн ажилтан</Label>
            <Input
              id='maintenance-by'
              value={form.performedBy}
              onChange={(e) =>
                onChange({ performedBy: e.target.value })
              }
              placeholder='Ж: Б.Батаа'
            />
          </div>

          <div className='space-y-2 sm:col-span-2'>
            <Label htmlFor='maintenance-reason'>Гэмтлийн шалтгаан</Label>
            <Textarea
              id='maintenance-reason'
              rows={2}
              value={form.reason}
              onChange={(e) => onChange({ reason: e.target.value })}
              placeholder='Ж: Мэдрэгч заалт өгөхөө больсон'
            />
          </div>

          <div className='space-y-2 sm:col-span-2'>
            <Label htmlFor='maintenance-action'>Хийсэн ажил</Label>
            <Textarea
              id='maintenance-action'
              rows={2}
              value={form.actionTaken}
              onChange={(e) =>
                onChange({ actionTaken: e.target.value })
              }
              placeholder='Ж: Мэдрэгч солив'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='maintenance-cost'>Зардал (₮)</Label>
            <Input
              id='maintenance-cost'
              type='number'
              value={form.cost}
              onChange={(e) => onChange({ cost: e.target.value })}
              placeholder='50000'
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Цуцлах
          </Button>
          <Button onClick={onSave} disabled={isSaving || !form.binId}>
            {isSaving ? 'Хадгалж байна...' : 'Хадгалах'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
