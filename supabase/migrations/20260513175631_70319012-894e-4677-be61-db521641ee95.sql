-- Enable Realtime for catechism tables
alter publication supabase_realtime add table catechism_cache;
alter publication supabase_realtime add table catechism_paragraphs_read;
