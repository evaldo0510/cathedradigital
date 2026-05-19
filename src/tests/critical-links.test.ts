import { describe, it, expect } from 'vitest';
import { SOCIAL_LINKS, EXTERNAL_URLS } from '../config/site-config';

describe('Critical External Links Validation', () => {
  it('Instagram link should point to the correct official handle', () => {
    expect(SOCIAL_LINKS.INSTAGRAM).toBe('https://www.instagram.com/cathedradigital/');
  });

  it('YouTube link should point to the correct official channel', () => {
    expect(SOCIAL_LINKS.YOUTUBE).toBe('https://www.youtube.com/@cathedradigital');
  });

  it('Vatican link should point to the correct official domain', () => {
    expect(EXTERNAL_URLS.VATICAN).toContain('vatican.va');
  });

  it('CNBB link should point to the correct official domain', () => {
    expect(EXTERNAL_URLS.CNBB).toContain('cnbb.org.br');
  });
  
  it('Official Catechism link should be valid', () => {
    expect(EXTERNAL_URLS.CATECHISM_OFFICIAL).toContain('vatican.va/archive/ccc');
  });

  it('WhatsApp link should be valid', () => {
    expect(SOCIAL_LINKS.WHATSAPP).toContain('wa.me/5511');
  });
});
