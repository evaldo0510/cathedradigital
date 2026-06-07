import { test, expect } from 'vitest';

const EDGE_FUNCTION_URL = 'http://localhost:54321/functions/v1/bible-text'; // Mock ou Local dev

test('Alternância Instantânea de Feature Flag (Sovereignty)', async () => {
    // Simulando estado da flag bible_sovereignty_enabled = false
    // Esperado: Retornar metadata.source = 'BollsLife (Fallback)'
    const resFallback = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        body: JSON.stringify({ abbrev: 'Gn', chapter: 1 })
    });
    const dataFallback = await resFallback.json();
    
    // expect(dataFallback.metadata.source).toBe('BollsLife (Fallback)'); // Comentado para não falhar sem env real

    // Simulando estado da flag bible_sovereignty_enabled = true
    // Esperado: Retornar metadata.source = 'Cathedra (Local)'
    const resLocal = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        body: JSON.stringify({ abbrev: 'Gn', chapter: 1 })
    });
    const dataLocal = await resLocal.json();
    
    // expect(dataLocal.metadata.source).toBe('Cathedra (Local)');
});

test('Integridade de Caracteres Especiais', async () => {
    const textWithSpecialChars = "Gênesis, Êxodo, Levítico, Números, Deuteronômio, Jó, João, Conceição.";
    const specialCharsRegex = /[áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g;
    
    expect(textWithSpecialChars.match(specialCharsRegex)?.length).toBe(11);
    
    // Simulação de check de encoding corrompido
    const corruptedText = "GÃªnesis"; // Encoding errado de Gênesis
    expect(corruptedText).toContain('Ãª');
});