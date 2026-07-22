-- Add trending SUVs to vehicle database
DO $$
DECLARE
  v_byd_id uuid;
  v_deepal_id uuid;
  v_jaecoo_id uuid;
  v_aion_id uuid;
  
  v_atto3_id uuid;
  v_shark6_id uuid;
  v_s05_id uuid;
  v_j7_id uuid;
  v_yplus_id uuid;
BEGIN
  -- Insert Brands
  INSERT INTO public.car_brands (name, is_active) VALUES ('BYD', true) ON CONFLICT (name) DO UPDATE SET is_active = true RETURNING id INTO v_byd_id;
  INSERT INTO public.car_brands (name, is_active) VALUES ('Deepal', true) ON CONFLICT (name) DO UPDATE SET is_active = true RETURNING id INTO v_deepal_id;
  INSERT INTO public.car_brands (name, is_active) VALUES ('Jaecoo', true) ON CONFLICT (name) DO UPDATE SET is_active = true RETURNING id INTO v_jaecoo_id;
  INSERT INTO public.car_brands (name, is_active) VALUES ('Aion', true) ON CONFLICT (name) DO UPDATE SET is_active = true RETURNING id INTO v_aion_id;

  -- Insert Models
  INSERT INTO public.car_models (brand_id, name, body_type, is_active) VALUES (v_byd_id, 'Atto 3', 'suv', true) ON CONFLICT ON CONSTRAINT car_models_brand_id_name_key DO UPDATE SET is_active = true RETURNING id INTO v_atto3_id;
  INSERT INTO public.car_models (brand_id, name, body_type, is_active) VALUES (v_byd_id, 'Shark 6', 'suv', true) ON CONFLICT ON CONSTRAINT car_models_brand_id_name_key DO UPDATE SET is_active = true RETURNING id INTO v_shark6_id;
  
  INSERT INTO public.car_models (brand_id, name, body_type, is_active) VALUES (v_deepal_id, 'SO5', 'suv', true) ON CONFLICT ON CONSTRAINT car_models_brand_id_name_key DO UPDATE SET is_active = true RETURNING id INTO v_s05_id;
  
  INSERT INTO public.car_models (brand_id, name, body_type, is_active) VALUES (v_jaecoo_id, 'J7', 'suv', true) ON CONFLICT ON CONSTRAINT car_models_brand_id_name_key DO UPDATE SET is_active = true RETURNING id INTO v_j7_id;
  
  INSERT INTO public.car_models (brand_id, name, body_type, is_active) VALUES (v_aion_id, 'Y Plus', 'suv', true) ON CONFLICT ON CONSTRAINT car_models_brand_id_name_key DO UPDATE SET is_active = true RETURNING id INTO v_yplus_id;

  -- Insert Variants
  INSERT INTO public.car_variants (model_id, name, engine_capacity, transmission, fuel_type, is_active) VALUES
    (v_atto3_id, 'Advanced', 'Electric', 'automatic', 'electric', true),
    (v_atto3_id, 'Superior', 'Electric', 'automatic', 'electric', true),
    
    (v_shark6_id, 'Premium', 'Electric', 'automatic', 'electric', true),
    
    (v_s05_id, 'Pro', 'Electric', 'automatic', 'electric', true),
    (v_s05_id, 'Max', 'Electric', 'automatic', 'electric', true),
    
    (v_j7_id, 'AWD', '1600cc', 'automatic', 'petrol', true),
    (v_j7_id, 'FWD', '1600cc', 'automatic', 'petrol', true),
    
    (v_yplus_id, 'Base', 'Electric', 'automatic', 'electric', true)
  ON CONFLICT DO NOTHING;

END;
$$;
