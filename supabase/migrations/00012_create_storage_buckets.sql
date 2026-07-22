-- Create site-assets bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('site-assets', 'site-assets', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Create car-images bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('car-images', 'car-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Public read for both buckets
CREATE POLICY "public_read_site_assets" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'site-assets');

CREATE POLICY "public_read_car_images" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'car-images');

-- Authenticated users can upload
CREATE POLICY "auth_upload_site_assets" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-assets');

CREATE POLICY "auth_upload_car_images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'car-images');

CREATE POLICY "auth_update_site_assets" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-assets');

CREATE POLICY "auth_delete_site_assets" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-assets');
