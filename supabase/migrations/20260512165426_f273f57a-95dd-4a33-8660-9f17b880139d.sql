ALTER TABLE public.analytics_events 
ADD CONSTRAINT check_event_name_length CHECK (char_length(event_name) >= 3);

ALTER TABLE public.analytics_events 
ADD CONSTRAINT check_created_at_not_future CHECK (created_at <= now() + interval '5 minutes');