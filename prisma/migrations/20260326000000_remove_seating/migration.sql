-- Drop seats table
DROP TABLE IF EXISTS "seats";

-- Remove seat-related columns from reservations
ALTER TABLE "reservations"
  DROP COLUMN IF EXISTS "seats_selected",
  DROP COLUMN IF EXISTS "seat_note",
  DROP COLUMN IF EXISTS "seat_selection_sent_at";

-- Remove table_shape column from events
ALTER TABLE "events"
  DROP COLUMN IF EXISTS "table_shape";

-- Drop TableShape enum
DROP TYPE IF EXISTS "TableShape";
