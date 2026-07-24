
-- Amplia o CHECK constraint de collection_items.item_type para aceitar
-- os dois novos tipos usados pelas coleções temáticas (Sprint · Onda 2).
ALTER TABLE public.collection_items
  DROP CONSTRAINT IF EXISTS collection_items_item_type_check;

ALTER TABLE public.collection_items
  ADD CONSTRAINT collection_items_item_type_check
  CHECK (item_type IN (
    'glossary','prayer','saint','saint_work',
    'bible','liturgy','catechism','magisterium','journey'
  ));
