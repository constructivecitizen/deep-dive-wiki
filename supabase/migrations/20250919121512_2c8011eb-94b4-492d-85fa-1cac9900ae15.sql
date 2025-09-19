-- Drop the old tables since we've successfully migrated to the unified content_items table
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.navigation_structure CASCADE;