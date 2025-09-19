-- Create unified content_items table
CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('document', 'folder')),
  title TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  content_json JSONB, -- null for folders, document content for documents
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Content items are publicly readable" 
ON public.content_items 
FOR SELECT 
USING (true);

CREATE POLICY "Content items are publicly insertable" 
ON public.content_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Content items are publicly updatable" 
ON public.content_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Content items are publicly deletable" 
ON public.content_items 
FOR DELETE 
USING (true);

-- Migrate data from navigation_structure table
INSERT INTO public.content_items (
  id, type, title, path, parent_id, order_index, created_at, updated_at
)
SELECT 
  id,
  type,
  title,
  path,
  parent_id,
  order_index,
  created_at,
  updated_at
FROM public.navigation_structure;

-- Migrate content from documents table and update existing records
UPDATE public.content_items 
SET 
  content_json = d.content_json,
  tags = d.tags
FROM public.documents d
WHERE public.content_items.path = d.path;

-- Create indexes for better performance
CREATE INDEX idx_content_items_parent_id ON public.content_items(parent_id);
CREATE INDEX idx_content_items_path ON public.content_items(path);
CREATE INDEX idx_content_items_type ON public.content_items(type);
CREATE INDEX idx_content_items_order ON public.content_items(parent_id, order_index);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_content_items_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();