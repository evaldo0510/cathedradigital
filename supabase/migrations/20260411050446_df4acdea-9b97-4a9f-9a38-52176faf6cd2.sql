-- Insert new themes into the themes table
INSERT INTO public.themes (name, slug, description)
VALUES 
  ('Esperança', 'esperanca', 'A virtude teologal pela qual desejamos o Reino dos céus e a vida eterna como nossa felicidade.'),
  ('Perdão', 'perdao', 'A manifestação da misericórdia de Deus que restaura a comunhão quebrada pelo pecado.'),
  ('Humildade', 'humildade', 'A virtude que nos permite reconhecer nossa verdade diante de Deus e dos outros.'),
  ('Santidade', 'santidade', 'A plenitude da vida cristã e a perfeição da caridade à qual todos os fiéis são chamados.'),
  ('Sofrimento', 'sofrimento', 'O mistério da dor humana que, unido ao sacrifício de Cristo, torna-se fonte de redenção.'),
  ('Vocação', 'vocacao', 'O chamado pessoal de Deus a cada alma para um estado de vida ou missão específica.'),
  ('Caridade', 'caridade', 'A virtude teologal pela qual amamos a Deus sobre todas as coisas e ao próximo como a nós mesmos por amor de Deus.'),
  ('Missão', 'missao', 'O envio dos discípulos de Cristo para anunciar o Evangelho e testemunhar a fé no mundo.')
ON CONFLICT (slug) DO NOTHING;