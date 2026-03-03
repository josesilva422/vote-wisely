
-- Create images table
CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_name TEXT NOT NULL,
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Images: anyone can read
CREATE POLICY "Anyone can view images" ON public.images
  FOR SELECT USING (true);

-- Images: only authenticated users (admin) can manage
CREATE POLICY "Authenticated users can insert images" ON public.images
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update images" ON public.images
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete images" ON public.images
  FOR DELETE TO authenticated USING (true);

-- Votes: anyone can insert (public voting)
CREATE POLICY "Anyone can insert votes" ON public.votes
  FOR INSERT WITH CHECK (true);

-- Votes: only authenticated users can read votes (admin)
CREATE POLICY "Authenticated users can read votes" ON public.votes
  FOR SELECT TO authenticated USING (true);

-- Index for performance
CREATE INDEX idx_votes_image_id ON public.votes(image_id);
CREATE INDEX idx_votes_session_id ON public.votes(session_id);
CREATE INDEX idx_images_display_order ON public.images(display_order);
