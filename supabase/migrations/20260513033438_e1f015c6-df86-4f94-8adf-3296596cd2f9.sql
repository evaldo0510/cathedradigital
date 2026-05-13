CREATE POLICY "Users can update their own catechism progress" 
ON public.catechism_paragraphs_read 
FOR UPDATE 
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);