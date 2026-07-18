import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NEXUS_STATE_KEY,
  readPersistedState,
  writePersistedState,
  reduceSectionKeyboard,
  isFocusToggleKey,
  sectionLiveMessage,
  restoredLiveMessage,
  closedLiveMessage,
  focusModeLiveMessage,
  syncedSectionLiveMessage,
  syncedFocusModeLiveMessage,
  invalidDeepLinkLiveMessage,
  validateDeepLinkKind,
  parseNexusHash,
  buildNexusHash,
  buildNexusShareUrl,
} from '@/lib/nexusState';

/**
 * Bateria de testes para o painel Nexus:
 *  - aria-live: mensagens estáveis para leitores de tela
 *  - atalhos: Alt+←/→ e [/] alternam seções sem sair do painel
 *  - restauração: leitura e escrita do estado persistido sobrevive a reload
 *  - deep link: hash `#nexus=slug:kind` roundtrip
 *  - sync entre abas: outra aba escrevendo dispara storage event legível
 */

const makeStorage = (): Storage => {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => { map.delete(k); },
    setItem: (k: string, v: string) => { map.set(k, v); },
  };
};

describe('nexusState — aria-live', () => {
  it('produz mensagem consistente de seção', () => {
    expect(sectionLiveMessage(0, 3, 'Nasce da Escritura')).toBe(
      'Seção 1 de 3: Nasce da Escritura',
    );
    expect(sectionLiveMessage(2, 3, 'Foi vivido por')).toBe(
      'Seção 3 de 3: Foi vivido por',
    );
  });

  it('anuncia restauração de contexto', () => {
    expect(restoredLiveMessage('Misericórdia')).toBe(
      'Painel Nexus restaurado em Misericórdia',
    );
  });

  it('anuncia fechamento com restauração de trecho', () => {
    expect(closedLiveMessage()).toMatch(/Trecho anterior restaurado/);
  });

  it('anuncia modo foco ligando e desligando', () => {
    expect(focusModeLiveMessage(true)).toMatch(/ativado/);
    expect(focusModeLiveMessage(false)).toMatch(/desativado/);
  });
});

describe('nexusState — atalhos de teclado', () => {
  it('Alt+ArrowRight avança respeitando o limite', () => {
    expect(reduceSectionKeyboard({ key: 'ArrowRight', altKey: true }, 0, 3)).toBe(1);
    expect(reduceSectionKeyboard({ key: 'ArrowRight', altKey: true }, 2, 3)).toBe(2);
  });

  it('Alt+ArrowLeft retrocede respeitando o piso', () => {
    expect(reduceSectionKeyboard({ key: 'ArrowLeft', altKey: true }, 2, 3)).toBe(1);
    expect(reduceSectionKeyboard({ key: 'ArrowLeft', altKey: true }, 0, 3)).toBe(0);
  });

  it('] e [ funcionam sem Alt', () => {
    expect(reduceSectionKeyboard({ key: ']' }, 0, 3)).toBe(1);
    expect(reduceSectionKeyboard({ key: '[' }, 2, 3)).toBe(1);
  });

  it('ignora setas sem Alt', () => {
    expect(reduceSectionKeyboard({ key: 'ArrowRight' }, 0, 3)).toBeNull();
    expect(reduceSectionKeyboard({ key: 'ArrowLeft' }, 0, 3)).toBeNull();
  });

  it('não age quando não há seções', () => {
    expect(reduceSectionKeyboard({ key: 'ArrowRight', altKey: true }, 0, 0)).toBeNull();
  });

  it('reconhece "f" como atalho para modo foco', () => {
    expect(isFocusToggleKey({ key: 'f' })).toBe(true);
    expect(isFocusToggleKey({ key: 'F' })).toBe(false);
    expect(isFocusToggleKey({ key: 'f', ctrlKey: true })).toBe(false);
    expect(isFocusToggleKey({ key: 'f', altKey: true })).toBe(false);
  });
});

describe('nexusState — persistência e restauração após reload', () => {
  let storage: Storage;
  beforeEach(() => { storage = makeStorage(); });

  it('escreve e lê estado íntegro', () => {
    const state = {
      tagId: 't-1',
      tagSlug: 'maria',
      path: '/catechism?p=487',
      historyIds: ['t-1'],
      activeSectionIdx: 2,
      visitedKinds: ['bible', 'catechism'],
      focusMode: true,
      ts: Date.now(),
    };
    writePersistedState(state, storage);
    const got = readPersistedState(storage);
    expect(got).toEqual(state);
  });

  it('remove estado com null', () => {
    writePersistedState({
      tagId: 't', path: '/', historyIds: [], activeSectionIdx: 0, visitedKinds: [], ts: Date.now(),
    }, storage);
    writePersistedState(null, storage);
    expect(readPersistedState(storage)).toBeNull();
  });

  it('descarta estado expirado (>24h)', () => {
    storage.setItem(NEXUS_STATE_KEY, JSON.stringify({
      tagId: 't', path: '/', historyIds: [], activeSectionIdx: 0, visitedKinds: [],
      ts: Date.now() - 1000 * 60 * 60 * 25,
    }));
    expect(readPersistedState(storage)).toBeNull();
  });

  it('sobrevive a JSON corrompido', () => {
    storage.setItem(NEXUS_STATE_KEY, '{invalid');
    expect(readPersistedState(storage)).toBeNull();
  });
});

describe('nexusState — deep link', () => {
  it('parseia hash apenas com slug', () => {
    expect(parseNexusHash('#nexus=maria')).toEqual({ slug: 'maria' });
  });

  it('parseia hash com slug e kind', () => {
    expect(parseNexusHash('#nexus=maria:bible')).toEqual({ slug: 'maria', kind: 'bible' });
  });

  it('aceita hash sem prefixo #', () => {
    expect(parseNexusHash('nexus=fe:catechism')).toEqual({ slug: 'fe', kind: 'catechism' });
  });

  it('retorna null quando não há parâmetro nexus', () => {
    expect(parseNexusHash('')).toBeNull();
    expect(parseNexusHash('#outro=1')).toBeNull();
  });

  it('roundtrip build → parse é estável', () => {
    const built = buildNexusHash('misericordia', 'saint');
    expect(parseNexusHash(built)).toEqual({ slug: 'misericordia', kind: 'saint' });
  });

  it('gera URL compartilhável preservando path/query', () => {
    expect(buildNexusShareUrl('/catechism?p=1', 'maria', 'bible'))
      .toBe('/catechism?p=1#nexus=maria:bible');
    // substitui hash existente
    expect(buildNexusShareUrl('/catechism?p=1#nexus=antigo', 'novo'))
      .toBe('/catechism?p=1#nexus=novo');
  });
});

describe('nexusState — sync entre abas via storage event', () => {
  it('evento storage transporta o estado escrito por outra aba', () => {
    const storage = makeStorage();
    const listener = vi.fn();

    // Simula: aba B chama writePersistedState → aba A recebe StorageEvent.
    const dispatchLike = (newValue: string) => {
      listener({ key: NEXUS_STATE_KEY, newValue });
    };

    const state = {
      tagId: 't', tagSlug: 'fe', path: '/', historyIds: ['t'],
      activeSectionIdx: 1, visitedKinds: ['bible'], ts: Date.now(),
    };
    writePersistedState(state, storage);
    dispatchLike(storage.getItem(NEXUS_STATE_KEY) as string);

    expect(listener).toHaveBeenCalledTimes(1);
    const [event] = listener.mock.calls[0];
    expect(event.key).toBe(NEXUS_STATE_KEY);
    expect(JSON.parse(event.newValue)).toMatchObject({
      tagSlug: 'fe', activeSectionIdx: 1,
    });
  });

  it('ignora storage events de outras chaves', () => {
    // Handler típico consumido pelo componente:
    const applied = vi.fn();
    const onStorage = (e: { key: string | null; newValue: string | null }) => {
      if (e.key !== NEXUS_STATE_KEY) return;
      if (!e.newValue) return;
      applied(JSON.parse(e.newValue));
    };

    onStorage({ key: 'outra-chave', newValue: '{"x":1}' });
    onStorage({ key: NEXUS_STATE_KEY, newValue: null }); // remoção
    expect(applied).not.toHaveBeenCalled();

    onStorage({
      key: NEXUS_STATE_KEY,
      newValue: JSON.stringify({ activeSectionIdx: 2, tagId: 't' }),
    });
    expect(applied).toHaveBeenCalledWith({ activeSectionIdx: 2, tagId: 't' });
  });
});

describe('nexusState — aria-live de sincronização entre abas', () => {
  it('anuncia mudança de seção vinda de outra aba', () => {
    expect(syncedSectionLiveMessage(1, 3, 'Nasce da Escritura')).toBe(
      'Atualizado por outra aba — agora na Seção 2 de 3: Nasce da Escritura',
    );
  });

  it('anuncia modo foco ligado/desligado por outra aba', () => {
    expect(syncedFocusModeLiveMessage(true)).toBe('Modo foco ativado em outra aba.');
    expect(syncedFocusModeLiveMessage(false)).toBe('Modo foco desativado em outra aba.');
  });
});

describe('nexusState — deep link inválido', () => {
  it('aceita kind ausente como válido', () => {
    expect(validateDeepLinkKind(undefined, ['bible', 'catechism']))
      .toEqual({ valid: true });
  });

  it('valida kind presente na lista', () => {
    expect(validateDeepLinkKind('bible', ['bible', 'catechism']))
      .toEqual({ valid: true });
  });

  it('rejeita kind inexistente e sugere fallback', () => {
    expect(validateDeepLinkKind('inexistente', ['bible', 'catechism']))
      .toEqual({ valid: false, fallbackKind: 'bible' });
  });

  it('emite mensagem consistente para aria-live', () => {
    expect(invalidDeepLinkLiveMessage('saint')).toBe(
      'Seção "saint" não disponível. Abrindo seção padrão.',
    );
  });
});

describe('nexusState — share URL com seção ativa', () => {
  it('gera URL contendo slug e kind da seção ativa', () => {
    const url = buildNexusShareUrl(
      'https://example.com/catechism?p=487',
      'maria',
      'bible',
    );
    expect(url).toBe('https://example.com/catechism?p=487#nexus=maria:bible');
    // Roundtrip preserva ambos.
    const parsed = parseNexusHash('#' + url.split('#')[1]);
    expect(parsed).toEqual({ slug: 'maria', kind: 'bible' });
  });
});
