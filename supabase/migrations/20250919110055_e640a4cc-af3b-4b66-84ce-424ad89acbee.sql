-- Create new documents table with JSONB content storage
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  content_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Documents are publicly readable" 
ON public.documents 
FOR SELECT 
USING (true);

CREATE POLICY "Documents are publicly insertable" 
ON public.documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Documents are publicly updatable" 
ON public.documents 
FOR UPDATE 
USING (true);

CREATE POLICY "Documents are publicly deletable" 
ON public.documents 
FOR DELETE 
USING (true);

-- Add document_id column to navigation_structure
ALTER TABLE public.navigation_structure 
ADD COLUMN document_id UUID REFERENCES public.documents(id);

-- Create function to parse markdown content into JSON sections
CREATE OR REPLACE FUNCTION parse_markdown_to_json(content_text TEXT)
RETURNS JSONB AS $$
DECLARE
  lines TEXT[];
  line TEXT;
  current_section JSONB;
  sections JSONB := '[]'::jsonb;
  section_id TEXT;
  section_title TEXT;
  section_content TEXT := '';
  section_level INTEGER;
  i INTEGER;
BEGIN
  IF content_text IS NULL OR content_text = '' THEN
    RETURN '[]'::jsonb;
  END IF;
  
  -- Split content into lines
  lines := string_to_array(content_text, E'\n');
  
  FOR i IN 1..array_length(lines, 1) LOOP
    line := lines[i];
    
    -- Check if line is a header
    IF line ~ '^#{1,6}\s+' THEN
      -- Save previous section if exists
      IF current_section IS NOT NULL THEN
        current_section := jsonb_set(current_section, '{content}', to_jsonb(trim(section_content)));
        sections := sections || jsonb_build_array(current_section);
      END IF;
      
      -- Extract header level and title
      section_level := length(split_part(line, ' ', 1));
      section_title := trim(substring(line from '#{1,6}\s+(.*)'));
      section_id := lower(replace(replace(section_title, ' ', '-'), '''', ''));
      section_content := '';
      
      -- Create new section
      current_section := jsonb_build_object(
        'id', section_id,
        'title', section_title,
        'level', section_level,
        'content', '',
        'tags', '[]'::jsonb
      );
    ELSE
      -- Add line to current section content
      IF section_content = '' THEN
        section_content := line;
      ELSE
        section_content := section_content || E'\n' || line;
      END IF;
    END IF;
  END LOOP;
  
  -- Add final section
  IF current_section IS NOT NULL THEN
    current_section := jsonb_set(current_section, '{content}', to_jsonb(trim(section_content)));
    sections := sections || jsonb_build_array(current_section);
  END IF;
  
  -- If no sections found, create a single section with all content
  IF jsonb_array_length(sections) = 0 AND content_text != '' THEN
    sections := jsonb_build_array(jsonb_build_object(
      'id', 'main-content',
      'title', 'Main Content',
      'level', 1,
      'content', content_text,
      'tags', '[]'::jsonb
    ));
  END IF;
  
  RETURN sections;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing content_nodes to documents table
INSERT INTO public.documents (title, path, content_json, tags, created_at, updated_at)
SELECT 
  COALESCE(title, 'Untitled'),
  path,
  parse_markdown_to_json(content),
  COALESCE(tags, '{}'),
  created_at,
  updated_at
FROM public.content_nodes
WHERE parent_id IS NULL; -- Only migrate root level content nodes as documents

-- Update navigation_structure to link to documents instead of content_nodes
UPDATE public.navigation_structure 
SET document_id = documents.id
FROM public.documents
WHERE navigation_structure.path = documents.path
AND navigation_structure.type = 'document';

-- Remove content_node_id column from navigation_structure
ALTER TABLE public.navigation_structure 
DROP COLUMN IF EXISTS content_node_id;

-- Add trigger for automatic timestamp updates on documents
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop the old content_nodes table
DROP TABLE IF EXISTS public.content_nodes;

-- Drop the parsing function (no longer needed after migration)
DROP FUNCTION IF EXISTS parse_markdown_to_json(TEXT);