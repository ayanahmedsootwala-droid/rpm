
-- Step 1: Strip '660cc ' prefix (case-insensitive)
UPDATE car_variants
SET name = regexp_replace(name, '^660cc\s+', '', 'i'),
    updated_at = now()
WHERE name ~* '^660cc\s+';

-- Step 2: Strip '660 ' prefix (standalone number prefix)
UPDATE car_variants
SET name = regexp_replace(name, '^660\s+', '', 'i'),
    updated_at = now()
WHERE name ~* '^660\s+';

-- Step 3: Deduplicate — keep the earliest created record per (model_id, lower(name))
DELETE FROM car_variants
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY model_id, lower(trim(name))
             ORDER BY created_at ASC
           ) AS rn
    FROM car_variants
  ) ranked
  WHERE rn > 1
);
