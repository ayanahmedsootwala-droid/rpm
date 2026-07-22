CREATE POLICY "Admins can insert transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));
