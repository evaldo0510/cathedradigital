-- Add program_duration to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS program_duration INTEGER DEFAULT 30;

-- Create the 90-day Therapeutic Plan journey
INSERT INTO public.journeys (
  id,
  title,
  subtitle,
  description,
  category,
  difficulty,
  is_active,
  is_premium,
  estimated_days,
  sort_order
) VALUES (
  '90909090-9090-4000-8000-000000000090',
  'Plano de Cura de Hábitos (PCH)',
  '90 dias de transformação interior',
  'Um programa terapêutico de 90 dias focado na cura de vícios, ordenação dos afetos e reconstrução da vida espiritual. Baseado na psicologia cristã e na sabedoria dos santos.',
  'cura',
  'avançado',
  true,
  true,
  90,
  5
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  estimated_days = 90;

-- Add initial steps for the 90-day journey
-- Week 1: Awakening
INSERT INTO public.journey_steps (
  journey_id,
  title,
  subtitle,
  step_order,
  step_type,
  content
) VALUES 
(
  '90909090-9090-4000-8000-000000000090',
  'O Despertar da Consciência',
  'Dia 1: O Reconhecimento',
  1,
  'reflection',
  '{"intro": "Bem-vindo ao primeiro dia do seu Plano de Cura de Hábitos.", "padh": "Pois não faço o bem que quero, mas o mal que não quero, esse pratico. (Rm 7,19)", "reflection": "O primeiro passo para a cura é o reconhecimento humilde da nossa própria miséria. Sem a luz da verdade sobre nós mesmos, não podemos ser curados.", "practical_direction": "Reserve 15 minutos hoje para listar, sem julgamentos, os três hábitos que mais escravizam sua vontade hoje.", "guided_exercise": "Escreva uma carta a Deus pedindo a graça da sinceridade profunda.", "final_question": "Você está disposto a deixar Deus entrar nos porões da sua alma?"}'
),
(
  '90909090-9090-4000-8000-000000000090',
  'A Anatomia do Vício',
  'Dia 2: Entendendo o Gatilho',
  2,
  'reflection',
  '{"intro": "Hoje entenderemos como os maus hábitos se instalam.", "padh": "Vigiai e orai, para que não entreis em tentação. (Mt 26,41)", "reflection": "Todo hábito nasce de um desejo legítimo de felicidade que foi desviado para um objeto inadequado.", "practical_direction": "Identifique qual emoção (tédio, solidão, raiva) precede o seu hábito negativo.", "guided_exercise": "Pratique a respiração consciente por 5 minutos quando sentir o impulso do hábito.", "final_question": "O que você está realmente buscando quando recorre a este hábito?"}'
)
ON CONFLICT DO NOTHING;
