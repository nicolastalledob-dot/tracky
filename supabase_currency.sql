-- Add currency column to entries table
ALTER TABLE entries 
ADD COLUMN currency text DEFAULT 'PEN' CHECK (currency IN ('PEN', 'USD'));

-- Update existing records to have a default currency if needed (optional, handled by default)
-- UPDATE entries SET currency = 'PEN' WHERE currency IS NULL;
