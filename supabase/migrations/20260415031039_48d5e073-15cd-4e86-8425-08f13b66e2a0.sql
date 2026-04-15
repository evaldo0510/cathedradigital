-- Enable RLS policies for managing saints
CREATE POLICY "Allow service role to insert saints" ON public.saints
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to update saints" ON public.saints
FOR UPDATE USING (true);

CREATE POLICY "Allow service role to delete saints" ON public.saints
FOR DELETE USING (true);
