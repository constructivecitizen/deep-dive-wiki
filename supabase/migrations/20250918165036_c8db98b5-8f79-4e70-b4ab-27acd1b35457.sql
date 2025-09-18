-- Enable INSERT, UPDATE, and DELETE operations on navigation_structure table

-- Create policy for inserting navigation nodes
CREATE POLICY "Navigation structure is publicly insertable" 
ON public.navigation_structure 
FOR INSERT 
WITH CHECK (true);

-- Create policy for updating navigation nodes
CREATE POLICY "Navigation structure is publicly updatable" 
ON public.navigation_structure 
FOR UPDATE 
USING (true);

-- Create policy for deleting navigation nodes
CREATE POLICY "Navigation structure is publicly deletable" 
ON public.navigation_structure 
FOR DELETE 
USING (true);