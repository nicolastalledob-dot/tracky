-- Make group_id nullable for personal entries
ALTER TABLE entries ALTER COLUMN group_id DROP NOT NULL;
