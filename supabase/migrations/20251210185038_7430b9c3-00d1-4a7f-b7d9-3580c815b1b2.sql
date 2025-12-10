-- Shift all rows with order_index >= 6 up by 1
UPDATE content_items 
SET order_index = order_index + 1 
WHERE order_index >= 6;

-- Set ROI Assessment to order_index 6
UPDATE content_items 
SET order_index = 6 
WHERE title = 'ROI Assessment';