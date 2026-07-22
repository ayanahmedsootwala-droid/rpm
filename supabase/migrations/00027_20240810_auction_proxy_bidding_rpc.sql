-- 1. Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.auction_bid_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id uuid REFERENCES public.auctions(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    bid_amount numeric NOT NULL,
    is_proxy boolean DEFAULT false,
    action_type text NOT NULL, -- e.g., 'manual', 'proxy_auto', 'rejected'
    reason text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.auction_bid_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bid logs" ON public.auction_bid_logs
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Create a unified, transactionally-safe RPC for placing bids
CREATE OR REPLACE FUNCTION public.place_bid(
    p_auction_id uuid,
    p_user_id uuid,
    p_amount numeric,
    p_max_amount numeric DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auction record;
    v_current_highest_bid record;
    v_new_end_time timestamptz;
    v_bid_increment numeric;
    v_min_required numeric;
    v_is_proxy boolean;
    v_proxy_counter_amount numeric;
    v_active_proxy record;
BEGIN
    v_is_proxy := p_max_amount IS NOT NULL AND p_max_amount > p_amount;

    -- Lock the auction row to prevent concurrent modifications
    SELECT * INTO v_auction
    FROM public.auctions
    WHERE id = p_auction_id
    FOR UPDATE;

    IF v_auction IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Auction not found');
    END IF;

    IF v_auction.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Auction is not active');
    END IF;

    IF now() >= v_auction.end_time THEN
        RETURN jsonb_build_object('success', false, 'message', 'Auction has already ended');
    END IF;

    -- Get current highest bid
    SELECT * INTO v_current_highest_bid
    FROM public.bids
    WHERE auction_id = p_auction_id
    ORDER BY amount DESC, created_at ASC
    LIMIT 1;

    v_bid_increment := COALESCE(v_auction.bid_increment, 50000);

    IF v_current_highest_bid IS NULL THEN
        v_min_required := COALESCE(v_auction.starting_bid, 0);
    ELSE
        v_min_required := v_current_highest_bid.amount + v_bid_increment;
    END IF;

    IF p_amount < v_min_required THEN
        RETURN jsonb_build_object('success', false, 'message', 'Bid amount must be at least ' || v_min_required);
    END IF;

    -- Update proxy config if the user is submitting a proxy
    IF v_is_proxy THEN
        INSERT INTO public.proxy_bids (auction_id, user_id, max_amount, is_active)
        VALUES (p_auction_id, p_user_id, p_max_amount, true)
        ON CONFLICT (id) DO UPDATE SET max_amount = EXCLUDED.max_amount, is_active = true;
    END IF;

    -- Anti-sniping: extend by 3 mins if less than 3 mins remaining
    v_new_end_time := v_auction.end_time;
    IF EXTRACT(EPOCH FROM (v_auction.end_time - now())) < 180 THEN
        v_new_end_time := now() + interval '3 minutes';
    END IF;

    -- Find the highest active proxy bid from ANOTHER user
    SELECT * INTO v_active_proxy
    FROM public.proxy_bids
    WHERE auction_id = p_auction_id 
      AND user_id != p_user_id 
      AND is_active = true
    ORDER BY max_amount DESC
    LIMIT 1;

    -- SCENARIO: An existing proxy bid might counter this new bid
    IF v_active_proxy IS NOT NULL AND v_active_proxy.max_amount >= p_amount + v_bid_increment THEN
        -- The existing proxy bid outbids the user's manual/proxy bid instantly!
        v_proxy_counter_amount := LEAST(p_amount + v_bid_increment, v_active_proxy.max_amount);
        
        -- Insert user's bid (but they are outbid instantly)
        INSERT INTO public.bids (auction_id, user_id, amount, is_auto_bid, max_bid_amount)
        VALUES (p_auction_id, p_user_id, p_amount, v_is_proxy, p_max_amount);
        
        -- Log user's bid
        INSERT INTO public.auction_bid_logs (auction_id, user_id, bid_amount, is_proxy, action_type)
        VALUES (p_auction_id, p_user_id, p_amount, v_is_proxy, 'manual_instantly_outbid');

        -- Insert the proxy counter-bid
        INSERT INTO public.bids (auction_id, user_id, amount, is_auto_bid, max_bid_amount)
        VALUES (p_auction_id, v_active_proxy.user_id, v_proxy_counter_amount, true, v_active_proxy.max_amount);

        -- Log proxy counter-bid
        INSERT INTO public.auction_bid_logs (auction_id, user_id, bid_amount, is_proxy, action_type)
        VALUES (p_auction_id, v_active_proxy.user_id, v_proxy_counter_amount, true, 'proxy_auto_counter');

        -- Update auction
        UPDATE public.auctions
        SET current_bid = v_proxy_counter_amount, current_price = v_proxy_counter_amount, end_time = v_new_end_time
        WHERE id = p_auction_id;

        RETURN jsonb_build_object('success', false, 'message', 'You were instantly outbid by an existing proxy bid.');
    END IF;

    -- NORMAL SCENARIO: User's bid becomes the highest
    INSERT INTO public.bids (auction_id, user_id, amount, is_auto_bid, max_bid_amount)
    VALUES (p_auction_id, p_user_id, p_amount, v_is_proxy, p_max_amount);

    INSERT INTO public.auction_bid_logs (auction_id, user_id, bid_amount, is_proxy, action_type)
    VALUES (p_auction_id, p_user_id, p_amount, v_is_proxy, 'manual_highest');

    UPDATE public.auctions
    SET current_bid = p_amount, current_price = p_amount, end_time = v_new_end_time
    WHERE id = p_auction_id;

    RETURN jsonb_build_object('success', true, 'message', 'Bid placed successfully!');
END;
$$;