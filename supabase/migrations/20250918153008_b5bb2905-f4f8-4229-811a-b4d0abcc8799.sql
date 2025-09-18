-- Create content nodes table for hierarchical wiki content
CREATE TABLE public.content_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  parent_id UUID REFERENCES public.content_nodes(id) ON DELETE CASCADE,
  path TEXT UNIQUE NOT NULL,
  depth INTEGER NOT NULL DEFAULT 0,
  tags TEXT[],
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create navigation structure table for sidebar hierarchy
CREATE TABLE public.navigation_structure (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('document', 'folder')),
  path TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES public.navigation_structure(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  content_node_id UUID REFERENCES public.content_nodes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.content_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_structure ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed for your use case)
CREATE POLICY "Content nodes are publicly readable" 
ON public.content_nodes 
FOR SELECT 
USING (true);

CREATE POLICY "Navigation structure is publicly readable" 
ON public.navigation_structure 
FOR SELECT 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_content_nodes_parent_id ON public.content_nodes(parent_id);
CREATE INDEX idx_content_nodes_path ON public.content_nodes(path);
CREATE INDEX idx_navigation_structure_parent_id ON public.navigation_structure(parent_id);
CREATE INDEX idx_navigation_structure_path ON public.navigation_structure(path);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_content_nodes_updated_at
  BEFORE UPDATE ON public.content_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_navigation_structure_updated_at
  BEFORE UPDATE ON public.navigation_structure
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample navigation structure
INSERT INTO public.navigation_structure (title, type, path, parent_id, order_index) VALUES
  ('Getting Started', 'folder', '/getting-started', NULL, 1),
  ('Knowledge Management', 'folder', '/knowledge-management', NULL, 2),
  ('Advanced Topics', 'folder', '/advanced-topics', NULL, 3),
  ('Deep Structures', 'folder', '/deep-structures', NULL, 4);

-- Get the IDs for the folders we just created
WITH folder_ids AS (
  SELECT id, path FROM public.navigation_structure WHERE type = 'folder'
)
INSERT INTO public.navigation_structure (title, type, path, parent_id, order_index) VALUES
  ('Introduction', 'document', '/getting-started/intro', (SELECT id FROM folder_ids WHERE path = '/getting-started'), 1),
  ('Setup Guide', 'document', '/getting-started/setup', (SELECT id FROM folder_ids WHERE path = '/getting-started'), 2),
  ('Hierarchy Systems', 'document', '/hierarchy-systems', NULL, 5),
  ('Tagging Strategies', 'document', '/tagging-strategies', NULL, 6);

-- Insert sample content nodes
INSERT INTO public.content_nodes (title, content, path, depth, tags) VALUES 
  ('Introduction to Wiki System', 
   '# Welcome to the Wiki System

This is a comprehensive knowledge management system that helps you organize information hierarchically.

## Key Features

- **Hierarchical Structure**: Organize content in nested categories
- **Dynamic Navigation**: Sidebar automatically reflects your content structure
- **Search & Filter**: Find content quickly with built-in search
- **Tag System**: Categorize content with flexible tagging

## Getting Started

Navigate through the sidebar to explore different sections of the documentation.',
   '/getting-started/intro', 0, ARRAY['introduction', 'guide']),
   
  ('Setup Guide', 
   '# Setting Up Your Wiki

Follow these steps to get your wiki system up and running:

## Installation

1. Clone the repository
2. Install dependencies with `npm install`
3. Configure your database connection
4. Run the development server

## Configuration

The system uses Supabase for backend services. Make sure to:

- Set up your Supabase project
- Configure Row Level Security policies
- Import the database schema

## Next Steps

Once setup is complete, you can start adding your own content and customizing the structure.',
   '/getting-started/setup', 0, ARRAY['setup', 'configuration']),
   
  ('Hierarchy Systems',
   '# Understanding Hierarchy Systems

Hierarchical organization is fundamental to effective knowledge management.

## Core Concepts

- **Parent-Child Relationships**: Content can be nested under other content
- **Depth Levels**: Track how deep in the hierarchy each item sits
- **Path-Based Routing**: URLs reflect the hierarchical structure

## Best Practices

1. Keep hierarchies logical and intuitive
2. Avoid excessive nesting (max 4-5 levels)
3. Use consistent naming conventions
4. Group related content together',
   '/hierarchy-systems', 0, ARRAY['hierarchy', 'organization']),
   
  ('Tagging Strategies',
   '# Effective Tagging Strategies

Tags provide flexible categorization beyond hierarchical structure.

## Tag Types

- **Topic Tags**: Subject matter (e.g., "javascript", "database")
- **Status Tags**: Current state (e.g., "draft", "reviewed")
- **Priority Tags**: Importance level (e.g., "urgent", "reference")

## Best Practices

1. Use consistent tag naming
2. Avoid too many tags per item
3. Create tag taxonomies
4. Regular tag cleanup and consolidation',
   '/tagging-strategies', 0, ARRAY['tags', 'categorization']);

-- Update navigation structure with content node references
UPDATE public.navigation_structure 
SET content_node_id = (SELECT id FROM public.content_nodes WHERE path = '/getting-started/intro')
WHERE path = '/getting-started/intro';

UPDATE public.navigation_structure 
SET content_node_id = (SELECT id FROM public.content_nodes WHERE path = '/getting-started/setup')
WHERE path = '/getting-started/setup';

UPDATE public.navigation_structure 
SET content_node_id = (SELECT id FROM public.content_nodes WHERE path = '/hierarchy-systems')
WHERE path = '/hierarchy-systems';

UPDATE public.navigation_structure 
SET content_node_id = (SELECT id FROM public.content_nodes WHERE path = '/tagging-strategies')
WHERE path = '/tagging-strategies';