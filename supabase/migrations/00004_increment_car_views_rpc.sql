
CREATE OR REPLACE FUNCTION public.increment_car_views(car_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.cars SET views = views + 1 WHERE id = car_id;
$$;
