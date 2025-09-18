-- Add missing content nodes for folder pages and root page
INSERT INTO public.content_nodes (id, title, content, path, parent_id, depth, tags, order_index) VALUES
-- Root page
(gen_random_uuid(), 'Document Wiki', 'Welcome to the Document Wiki - a hierarchical knowledge management system. Use the navigation sidebar to explore different topics and sections.', '/', NULL, 0, ARRAY['welcome', 'overview'], 0),

-- Getting Started folder page
(gen_random_uuid(), 'Getting Started', 'Learn the fundamentals of using this document wiki system. This section covers basic concepts and initial setup procedures.', '/getting-started', NULL, 0, ARRAY['tutorial', 'basics'], 1),

-- Knowledge Management folder page  
(gen_random_uuid(), 'Knowledge Management', 'Explore advanced techniques for organizing and managing your knowledge base effectively.', '/knowledge-management', NULL, 0, ARRAY['management', 'organization'], 2),

-- Advanced Topics folder page
(gen_random_uuid(), 'Advanced Topics', 'Deep dive into sophisticated features and advanced usage patterns for power users.', '/advanced-topics', NULL, 0, ARRAY['advanced', 'expert'], 3),

-- Deep Structures folder page
(gen_random_uuid(), 'Deep Structures', 'Understand complex hierarchical relationships and nested organizational patterns.', '/deep-structures', NULL, 0, ARRAY['hierarchy', 'structure', 'advanced'], 4);

-- Update existing content nodes to have proper parent relationships
UPDATE public.content_nodes 
SET parent_id = (SELECT id FROM public.content_nodes WHERE path = '/getting-started'),
    depth = 1
WHERE path = '/getting-started/intro';

UPDATE public.content_nodes 
SET parent_id = (SELECT id FROM public.content_nodes WHERE path = '/getting-started'),
    depth = 1  
WHERE path = '/getting-started/setup';

-- Update tagging strategies to be under knowledge management
UPDATE public.content_nodes 
SET parent_id = (SELECT id FROM public.content_nodes WHERE path = '/knowledge-management'),
    depth = 1
WHERE path = '/tagging-strategies';

-- Update hierarchy systems to be under advanced topics  
UPDATE public.content_nodes
SET parent_id = (SELECT id FROM public.content_nodes WHERE path = '/advanced-topics'),
    depth = 1
WHERE path = '/hierarchy-systems';