ALTER TABLE public.wallets 
  ADD COLUMN IF NOT EXISTS pending_balance numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refundable_balance numeric(12,2) NOT NULL DEFAULT 0;

INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public receipts view"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'receipts' );

CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'receipts' AND auth.uid() = owner );

