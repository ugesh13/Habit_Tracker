CREATE TABLE public.daily_energy (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date date NOT NULL,
    level text NOT NULL CHECK (level IN ('low', 'steady', 'high')),
    dismissed_suggestions boolean DEFAULT false NOT NULL,
    override_mode text CHECK (override_mode IN ('low', 'steady', 'high')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, entry_date)
);

ALTER TABLE public.daily_energy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own daily energy"
    ON public.daily_energy
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
