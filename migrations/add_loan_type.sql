
-- Add 'loan' to entry_type check constraint if it exists, or just ensure app logic handles it.
-- Since Supabase/Postgres enums or check constraints are often strict, let's check current definition.
-- Instead of complex enum migration, we can often just insert if it's text. 
-- But let's add the 'paid_at' column first for tracking dates.

ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2); -- Optional: for future loan features

-- Update constraint if it exists (assuming it is a check constraint on text)
ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_entry_type_check;
ALTER TABLE entries ADD CONSTRAINT entries_entry_type_check 
    CHECK (entry_type IN ('note', 'list', 'debt', 'event', 'loan'));
