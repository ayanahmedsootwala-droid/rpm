CREATE TABLE IF NOT EXISTS public.wallets (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    balance numeric(12,2) NOT NULL DEFAULT 0,
    locked_balance numeric(12,2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount numeric(12,2) NOT NULL,
    type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'locked', 'released', 'payment', 'refund')),
    status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    description text,
    reference_id text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own transactions" ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
