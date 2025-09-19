-- Remove duplicate "Deep Structures" entry from documents table
-- This removes the document that duplicates the navigation folder entry
DELETE FROM documents WHERE id = 'ceba9a34-85f1-44b1-9e3c-43b2b379ce54' AND path = '/deep-structures';