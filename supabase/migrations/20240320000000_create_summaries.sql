-- Create summaries table
CREATE TABLE IF NOT EXISTS public.summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    place_id TEXT NOT NULL,
    sentiment TEXT NOT NULL,
    summary TEXT NOT NULL,
    average_rating DECIMAL(3,1) NOT NULL,
    review_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on place_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_summaries_place_id ON public.summaries(place_id);

-- Add RLS policies
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Summaries are viewable by everyone"
    ON public.summaries FOR SELECT
    USING (true);

CREATE POLICY "Summaries are insertable by authenticated users"
    ON public.summaries FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_summaries_updated_at
    BEFORE UPDATE ON public.summaries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 