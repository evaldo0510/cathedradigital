import { describe, it, expect, vi } from 'vitest';
import { formatNexusContent } from './nexusContent';

describe('formatNexusContent', () => {
  it('should provide correct fallback for bible content without title/reference_id', () => {
    const data = { id: '1', type: 'bible', content_text: 'Verse' };
    const formatted = formatNexusContent(data, 'bible');
    expect(formatted.title).toBe('Escritura');
    expect(formatted.content_text).toBe('Verse');
  });

  it('should provide correct fallback for catechism content without title/reference_id', () => {
    const data = { id: '2', type: 'catechism', content_text: 'Paragraph' };
    const formatted = formatNexusContent(data, 'catechism');
    expect(formatted.title).toBe('Catecismo');
  });

  it('should use reference_id when available', () => {
    const data = { id: '3', type: 'bible', reference_id: 'Jo 1,1', title: 'Ignored Title' };
    const formatted = formatNexusContent(data, 'bible');
    expect(formatted.title).toBe('Jo 1,1');
  });

  it('should use title when reference_id is missing', () => {
    const data = { id: '4', type: 'magisterium', title: 'Lumen Gentium' };
    const formatted = formatNexusContent(data, 'magisterium');
    expect(formatted.title).toBe('Lumen Gentium');
  });

  it('should handle journey content with fallback', () => {
    const data = { id: '5', title: '' };
    const formatted = formatNexusContent(data, 'journey');
    expect(formatted.title).toBe('Jornada Espiritual');
  });

  it('should never have empty content_text', () => {
    const data = { id: '6', type: 'bible', content_text: null };
    const formatted = formatNexusContent(data, 'bible');
    expect(formatted.content_text).toBe('');
  });
});
