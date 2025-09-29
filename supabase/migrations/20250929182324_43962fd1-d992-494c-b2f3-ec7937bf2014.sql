-- Fix order_index values for root folders
-- Set sequential order_index based on created_at
WITH ordered_folders AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS new_order
  FROM content_items
  WHERE parent_id IS NULL
)
UPDATE content_items
SET order_index = ordered_folders.new_order
FROM ordered_folders
WHERE content_items.id = ordered_folders.id;