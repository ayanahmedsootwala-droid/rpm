
INSERT INTO storage.buckets (id, name, public) VALUES
  ('car-images', 'car-images', true),
  ('brand-logos', 'brand-logos', true),
  ('avatars', 'avatars', true),
  ('blog-images', 'blog-images', true),
  ('dealership-logos', 'dealership-logos', true),
  ('testimonial-photos', 'testimonial-photos', true),
  ('hero-banners', 'hero-banners', true);

CREATE POLICY "Public read car images" ON storage.objects FOR SELECT USING (bucket_id = 'car-images');
CREATE POLICY "Authenticated upload car images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'car-images');
CREATE POLICY "Authenticated update car images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'car-images');
CREATE POLICY "Authenticated delete car images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'car-images');

CREATE POLICY "Public read brand logos" ON storage.objects FOR SELECT USING (bucket_id = 'brand-logos');
CREATE POLICY "Admin upload brand logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-logos');

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public read blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Admin upload blog images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Public read dealership logos" ON storage.objects FOR SELECT USING (bucket_id = 'dealership-logos');
CREATE POLICY "Admin upload dealership logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dealership-logos');

CREATE POLICY "Public read testimonial photos" ON storage.objects FOR SELECT USING (bucket_id = 'testimonial-photos');
CREATE POLICY "Admin upload testimonial photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'testimonial-photos');

CREATE POLICY "Public read hero banners" ON storage.objects FOR SELECT USING (bucket_id = 'hero-banners');
CREATE POLICY "Admin upload hero banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hero-banners');
