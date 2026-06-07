DROP POLICY IF EXISTS "Users can manage their own filters" ON public.saved_filters;

-- Permitir que qualquer usuário autenticado insira (para duplicar para outros)
CREATE POLICY "Users can create filters" 
ON public.saved_filters FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Permitir que usuários gerenciem apenas seus próprios filtros (Select, Update, Delete)
CREATE POLICY "Users can manage their own filters" 
ON public.saved_filters FOR SELECT
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own filters" 
ON public.saved_filters FOR UPDATE
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own filters" 
ON public.saved_filters FOR DELETE
TO authenticated 
USING (auth.uid() = user_id);