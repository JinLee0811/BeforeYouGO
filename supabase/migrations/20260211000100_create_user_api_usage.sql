CREATE TABLE IF NOT EXISTS public.user_api_usage (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_requests INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_api_usage_updated_at
    ON public.user_api_usage(updated_at DESC);

CREATE OR REPLACE FUNCTION public.handle_user_api_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_user_api_usage_updated_at ON public.user_api_usage;

CREATE TRIGGER handle_user_api_usage_updated_at
    BEFORE UPDATE ON public.user_api_usage
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_api_usage_updated_at();
