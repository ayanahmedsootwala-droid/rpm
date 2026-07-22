/**
 * OtherInput
 * Renders a text input directly below any field when value === 'Other'.
 * Usage:
 *   <Select value={form.color} onValueChange={v => set('color', v)}>
 *     ...options including <SelectItem value="Other">Other</SelectItem>
 *   </Select>
 *   <OtherInput trigger={form.color} value={form.color_custom} onChange={v => set('color_custom', v)} placeholder="Enter color" />
 */
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface OtherInputProps {
  /** The current Select value — shows this input only when it equals "Other" */
  trigger: string;
  /** The free-text value */
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Height class, default h-9 */
  height?: string;
}

export function OtherInput({
  trigger,
  value,
  onChange,
  placeholder = 'Specify…',
  className,
  inputClassName,
  height = 'h-9',
}: OtherInputProps) {
  if (trigger !== 'Other') return null;
  return (
    <div className={cn('mt-1.5', className)}>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(height, 'text-sm', inputClassName)}
        autoFocus
      />
    </div>
  );
}
