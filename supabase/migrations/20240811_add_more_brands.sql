-- Add Jetour
INSERT INTO public.car_brands (id, name, is_active, display_order)
VALUES (gen_random_uuid(), 'Jetour', true, 30)
ON CONFLICT (name) DO NOTHING;

-- Add GWM
INSERT INTO public.car_brands (id, name, is_active, display_order)
VALUES (gen_random_uuid(), 'GWM', true, 31)
ON CONFLICT (name) DO NOTHING;

-- Add Haval (if missing)
INSERT INTO public.car_brands (id, name, is_active, display_order)
VALUES (gen_random_uuid(), 'Haval', true, 32)
ON CONFLICT (name) DO NOTHING;

-- Add Jetour Models
DO $$
DECLARE
  brand_id uuid;
BEGIN
  SELECT id INTO brand_id FROM public.car_brands WHERE name = 'Jetour' LIMIT 1;
  IF brand_id IS NOT NULL THEN
    INSERT INTO public.car_models (id, brand_id, name, is_active) VALUES
      (gen_random_uuid(), brand_id, 'X70 Plus', true),
      (gen_random_uuid(), brand_id, 'Dashing', true)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;
END $$;

-- Add GWM Models
DO $$
DECLARE
  brand_id uuid;
BEGIN
  SELECT id INTO brand_id FROM public.car_brands WHERE name = 'GWM' LIMIT 1;
  IF brand_id IS NOT NULL THEN
    INSERT INTO public.car_models (id, brand_id, name, is_active) VALUES
      (gen_random_uuid(), brand_id, 'Ora 03', true),
      (gen_random_uuid(), brand_id, 'Tank 500', true)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;
END $$;
