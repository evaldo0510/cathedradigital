-- Carga das 4 orações fundamentais (Pai Nosso, Ave Maria, Glória, Salve Rainha)
-- Baseado no conteúdo localizado no código (src/components/cathedra/rosary/RosarySession.tsx)

DO $$
BEGIN
    -- Pai Nosso
    IF NOT EXISTS (SELECT 1 FROM public.prayers WHERE slug = 'pai-nosso') THEN
        INSERT INTO public.prayers (
            slug, title, subtitle, kicker, category, content, 
            estimated_seconds, order_index, is_published, content_status, engine_version
        ) VALUES (
            'pai-nosso', 
            'Pai Nosso', 
            'A Oração do Senhor', 
            'Oração Dominical', 
            'fundamentais', 
            'Pai nosso que estais nos céus, santificado seja o vosso nome, venha a nós o vosso reino, seja feita a vossa vontade assim na terra como no céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.',
            30, 
            1, 
            true, 
            'complete', 
            1
        );
    END IF;

    -- Ave Maria
    IF NOT EXISTS (SELECT 1 FROM public.prayers WHERE slug = 'ave-maria') THEN
        INSERT INTO public.prayers (
            slug, title, subtitle, kicker, category, content, 
            estimated_seconds, order_index, is_published, content_status, engine_version
        ) VALUES (
            'ave-maria', 
            'Ave Maria', 
            'Saudação Angélica', 
            'Oração Mariana', 
            'fundamentais', 
            'Ave Maria, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora de nossa morte. Amém.',
            20, 
            2, 
            true, 
            'complete', 
            1
        );
    END IF;

    -- Glória ao Pai
    IF NOT EXISTS (SELECT 1 FROM public.prayers WHERE slug = 'gloria-ao-pai') THEN
        INSERT INTO public.prayers (
            slug, title, subtitle, kicker, category, content, 
            estimated_seconds, order_index, is_published, content_status, engine_version
        ) VALUES (
            'gloria-ao-pai', 
            'Glória ao Pai', 
            'Doxologia Menor', 
            'Louvor à Trindade', 
            'fundamentais', 
            'Glória ao Pai, e ao Filho, e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.',
            10, 
            3, 
            true, 
            'complete', 
            1
        );
    END IF;

    -- Salve Rainha
    IF NOT EXISTS (SELECT 1 FROM public.prayers WHERE slug = 'salve-rainha') THEN
        INSERT INTO public.prayers (
            slug, title, subtitle, kicker, category, content, 
            estimated_seconds, order_index, is_published, content_status, engine_version
        ) VALUES (
            'salve-rainha', 
            'Salve Rainha', 
            'Antífona Mariana', 
            'Esperança nossa', 
            'marianas', 
            'Salve Rainha, Mãe de Misericórdia, vida, doçura, esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E, depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria. Rogai por nós, Santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.',
            60, 
            4, 
            true, 
            'complete', 
            1
        );
    END IF;
END $$;
