
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_image text;
