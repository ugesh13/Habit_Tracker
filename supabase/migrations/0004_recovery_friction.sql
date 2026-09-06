CREATE TABLE public.friction_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    entry_date date NOT NULL,
    reason text NOT NULL CHECK (reason IN ('not_enough_time', 'too_tired', 'forgot', 'too_difficult', 'not_motivated', 'other')),
    note text,
    created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.friction_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own friction entries"
    ON public.friction_entries
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.recovery_actions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    entry_date date NOT NULL,
    action text NOT NULL CHECK (action IN ('resume', 'smaller_version', 'reschedule', 'pause')),
    scheduled_for date,
    created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.recovery_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recovery actions"
    ON public.recovery_actions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
