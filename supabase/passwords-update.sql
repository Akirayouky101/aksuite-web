-- Add new columns to passwords table
ALTER TABLE public.passwords 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for favorites
CREATE INDEX IF NOT EXISTS passwords_is_favorite_idx ON public.passwords(is_favorite) WHERE is_favorite = true;
