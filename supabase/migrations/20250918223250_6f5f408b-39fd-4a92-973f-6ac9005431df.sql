-- Enable real-time for content_nodes table
ALTER TABLE public.content_nodes REPLICA IDENTITY FULL;

-- Add content_nodes to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_nodes;