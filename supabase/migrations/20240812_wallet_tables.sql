ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS wallet_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refundable_balance numeric NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.wallet_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  receipt_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deposits"
  ON public.wallet_deposits FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can insert their own deposits"
  ON public.wallet_deposits FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update deposits"
  ON public.wallet_deposits FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'auction_hold', 'auction_refund', 'auction_win')),
  amount numeric NOT NULL,
  description text,
  reference_id uuid, -- could be deposit_id or auction_id
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

