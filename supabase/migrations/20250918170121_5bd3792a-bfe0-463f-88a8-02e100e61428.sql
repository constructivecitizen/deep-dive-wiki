-- Enable INSERT, UPDATE, and DELETE operations on content_nodes table

-- Create policy for inserting content nodes
CREATE POLICY "Content nodes are publicly insertable" 
ON public.content_nodes 
FOR INSERT 
WITH CHECK (true);

-- Create policy for updating content nodes
CREATE POLICY "Content nodes are publicly updatable" 
ON public.content_nodes 
FOR UPDATE 
USING (true);

-- Create policy for deleting content nodes
CREATE POLICY "Content nodes are publicly deletable" 
ON public.content_nodes 
FOR DELETE 
USING (true);