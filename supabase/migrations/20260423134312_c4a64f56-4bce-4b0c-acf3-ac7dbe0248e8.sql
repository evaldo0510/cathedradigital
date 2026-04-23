-- Add unique constraint for upsert
ALTER TABLE public.construction_data 
ADD CONSTRAINT construction_data_unique_item UNIQUE (project_id, type, item_name, category);
