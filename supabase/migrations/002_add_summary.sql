-- Add AI-generated one-sentence summary to races table
ALTER TABLE races ADD COLUMN IF NOT EXISTS summary text;
