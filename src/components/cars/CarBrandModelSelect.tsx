/**
 * CarBrandModelSelect
 * Reusable cascading Brand → Model → Variant selector powered by the
 * in-memory useCarDatabase cache (single fetch, instant subsequent renders).
 */
import { useState, useMemo } from 'react';
import { useCarDatabase } from '@/hooks/useCarDatabase';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  brandId:    string;
  modelId:    string;
  variantId?: string;
  onBrandChange:   (v: string) => void;
  onModelChange:   (v: string) => void;
  onVariantChange?: (v: string) => void;
  showVariant?: boolean;
  className?: string;
  labelClass?: string;
  required?: boolean;
}

export function CarBrandModelSelect({
  brandId, modelId, variantId = '',
  onBrandChange, onModelChange, onVariantChange,
  showVariant = true, className, labelClass, required,
}: Props) {
  const { brands, loading, modelsForBrand, variantsForModel } = useCarDatabase();
  const models   = modelsForBrand(brandId);
  const variants = variantsForModel(modelId);

  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
        {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full bg-muted rounded-md" />)}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      <div className="space-y-1.5 min-w-0">
        <Label className={cn('text-sm font-normal', labelClass)}>
          Brand {required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={brandId || '_none'} onValueChange={v => {
            const val = v === '_none' ? '' : v;
            if (val !== brandId) onBrandChange(val);
        }}>
          <SelectTrigger className="h-10 bg-background">
            <SelectValue placeholder="Select brand..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">All Brands</SelectItem>
            {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-0">
        <Label className={cn('text-sm font-normal', labelClass)}>Model</Label>
        <Select value={modelId || '_none'} onValueChange={v => {
            const val = v === '_none' ? '' : v;
            if (val !== modelId) onModelChange(val);
        }} disabled={!brandId}>
          <SelectTrigger className="h-10 bg-background">
            <SelectValue placeholder={brandId ? "Select model..." : "Select brand first"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">All Models</SelectItem>
            {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {showVariant && (
        <div className="space-y-1.5 min-w-0">
          <Label className={cn('text-sm font-normal', labelClass)}>Variant</Label>
          <Select value={variantId || '_none'} onValueChange={v => {
            const val = v === '_none' ? '' : v;
            if (val !== variantId) onVariantChange?.(val);
          }} disabled={!modelId}>
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder={modelId ? "Select variant..." : "Select model first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">All Variants</SelectItem>
              {variants.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default CarBrandModelSelect;
