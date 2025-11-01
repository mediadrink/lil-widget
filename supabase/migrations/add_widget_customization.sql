-- Migration: Add customization JSONB column to widgets table
-- This stores custom widget styling when using "custom" style or AI-generated styles

-- Add customization column to widgets table
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS customization JSONB;

COMMENT ON COLUMN widgets.customization IS 'Custom widget styling (colors, fonts, etc.) used when style="custom" or AI-generated';

-- Update existing widgets to use preset-modern by default
UPDATE widgets
SET style = 'preset-modern'
WHERE style IS NULL OR style = '' OR style = 'style-1';

-- Update style-2 to preset-minimal (closest match)
UPDATE widgets
SET style = 'preset-minimal'
WHERE style = 'style-2';

-- Verification query
SELECT id, title, style, customization
FROM widgets
LIMIT 5;
