-- Create construction projects table
CREATE TABLE public.construction_projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create construction data table (budget and schedule)
CREATE TABLE public.construction_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('budget', 'schedule')),
    item_name TEXT NOT NULL,
    planned_value DECIMAL(12, 2),
    actual_value DECIMAL(12, 2),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.construction_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_data ENABLE ROW LEVEL SECURITY;

-- Create policies for admins
CREATE POLICY "Admins can do everything on construction_projects" 
ON public.construction_projects 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can do everything on construction_data" 
ON public.construction_data 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Public can view approved projects (optional, but good for transparency if needed)
CREATE POLICY "Public can view projects" 
ON public.construction_projects 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view construction data" 
ON public.construction_data 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_construction_projects_updated_at
BEFORE UPDATE ON public.construction_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_construction_data_updated_at
BEFORE UPDATE ON public.construction_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
