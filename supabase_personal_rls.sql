-- Enable RLS on entries if not already (it should be)
-- ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Policy for Personal Entries: Allow users to create their own personal entries
CREATE POLICY "Users can create personal entries" ON entries
FOR INSERT
WITH CHECK (
    auth.uid() = author_id 
    AND scope = 'personal'
    AND group_id IS NULL
);

-- Policy for Personal Entries: Allow users to view their own personal entries
CREATE POLICY "Users can view own personal entries" ON entries
FOR SELECT
USING (
    (auth.uid() = author_id AND scope = 'personal')
    OR
    -- Keep existing shared logic if needed, usually handled by other policies
    -- but this policy is additive (OR)
    FALSE
);

-- Policy for Personal Entries: Allow users to update their own personal entries
CREATE POLICY "Users can update own personal entries" ON entries
FOR UPDATE
USING (auth.uid() = author_id AND scope = 'personal');

-- Policy for Personal Entries: Allow users to delete their own personal entries
CREATE POLICY "Users can delete own personal entries" ON entries
FOR DELETE
USING (auth.uid() = author_id AND scope = 'personal');
