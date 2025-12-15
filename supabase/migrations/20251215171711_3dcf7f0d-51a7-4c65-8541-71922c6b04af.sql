-- Drop existing public policies
DROP POLICY IF EXISTS "Content items are publicly deletable" ON public.content_items;
DROP POLICY IF EXISTS "Content items are publicly insertable" ON public.content_items;
DROP POLICY IF EXISTS "Content items are publicly readable" ON public.content_items;
DROP POLICY IF EXISTS "Content items are publicly updatable" ON public.content_items;

-- Create authenticated-only policies
CREATE POLICY "Authenticated users can read content"
ON public.content_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert content"
ON public.content_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update content"
ON public.content_items
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete content"
ON public.content_items
FOR DELETE
TO authenticated
USING (true);