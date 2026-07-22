-- Step 1: Among all variants whose stripped name would collide, keep only the lowest id per (model_id, stripped_name)
-- Delete all rows that are NOT the "keeper" for their (model_id, stripped_name) group
DELETE FROM car_variants
WHERE id NOT IN (
  SELECT DISTINCT ON (model_id, trim(regexp_replace(name, '\s+\d{4}$', '')))
    id
  FROM car_variants
  ORDER BY model_id, trim(regexp_replace(name, '\s+\d{4}$', '')), id
);

-- Step 2: Now safely strip the trailing year from all remaining variants
UPDATE car_variants
SET name = trim(regexp_replace(name, '\s+\d{4}$', ''))
WHERE name ~ '\s+\d{4}$';

-- Step 3: Final dedup pass for any remaining exact duplicates (same name + model_id)
DELETE FROM car_variants
WHERE id NOT IN (
  SELECT DISTINCT ON (model_id, name) id
  FROM car_variants
  ORDER BY model_id, name, id
);