/**
 * ContentPicker — seletor universal de conteúdo para o Collections Studio.
 *
 * Reusa o Knowledge Registry (fonte única) para tipos com nós catalogados
 * (glossary, prayer, saint, journey, liturgy). Para tipos externos ao grafo
 * (bible, catechism), aceita entrada manual do slug/referência.
 *
 * Sem dependências novas.
 */
import { useMemo, useState } from 'react';
import { Search, ArrowRight, PencilLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { KnowledgeIndex } from '@/core/knowledge/KnowledgeIndex';
import { KnowledgeRegistry } from '@/core/knowledge/KnowledgeRegistry';
import type { CollectionItemType } from './types';

const TYPE_LABELS: Record<CollectionItemType, string> = {
  glossary: 'Glossário',
  prayer: 'Oração',
  saint: 'Santo',
  saint_work: 'Escrito',
  bible: 'Bíblia',
  liturgy: 'Liturgia',
  catechism: 'Catecismo',
  magisterium: 'Magistério',
  journey: 'Jornada',
};

const REGISTRY_TYPES: CollectionItemType[] = ['glossary', 'prayer', 'saint', 'journey', 'liturgy'];
const MANUAL_TYPES: CollectionItemType[] = ['bible', 'catechism'];

export interface PickedContent {
  itemType: CollectionItemType;
  itemSlug: string;
  titleOverride?: string;
}

interface Props {
  onPick: (picked: PickedContent) => void;
  disabled?: boolean;
}

export default function ContentPicker({ onPick, disabled }: Props) {
  const [type, setType] = useState<CollectionItemType>('glossary');
  const [query, setQuery] = useState('');
  const [manualSlug, setManualSlug] = useState('');

  const isManual = MANUAL_TYPES.includes(type);

  const results = useMemo(() => {
    if (isManual) return [];
    // Mapeia tipo → kind do KnowledgeRegistry (mesma nomenclatura para os 5 suportados)
    const kind = type as unknown as
      | 'glossary' | 'prayer' | 'saint' | 'journey' | 'liturgy';
    if (!query.trim()) {
      return KnowledgeRegistry.nodesByKind(kind).slice(0, 12);
    }
    return KnowledgeIndex.search(query, { kinds: [kind], limit: 12 });
  }, [type, query, isManual]);

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center gap-2">
        <PencilLine className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Adicionar conteúdo</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3">
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as CollectionItemType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(TYPE_LABELS) as CollectionItemType[]).map((k) => (
                <SelectItem key={k} value={k}>{TYPE_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isManual ? (
          <div>
            <Label className="text-xs">
              {type === 'bible' ? 'Referência (ex.: João 3:16)' : 'Nº do parágrafo (ex.: 1066)'}
            </Label>
            <div className="flex gap-2">
              <Input
                value={manualSlug}
                onChange={(e) => setManualSlug(e.target.value)}
                placeholder={type === 'bible' ? 'Livro Cap:Versículo' : '1234'}
                disabled={disabled}
              />
              <Button
                type="button"
                disabled={disabled || !manualSlug.trim()}
                onClick={() => {
                  onPick({ itemType: type, itemSlug: manualSlug.trim() });
                  setManualSlug('');
                }}
              >
                Adicionar
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Label className="text-xs">Buscar no Knowledge Registry</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Buscar em ${TYPE_LABELS[type]}...`}
                className="pl-8"
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>

      {!isManual && (
        <ul className="divide-y divide-border rounded-md border border-border max-h-64 overflow-auto bg-background">
          {results.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">
              Nenhum nó encontrado no Knowledge Registry para este tipo.
            </li>
          )}
          {results.map((node) => {
            // KnowledgeNodeId: "<kind>:<slug>" → extrai o slug.
            const slug = node.id.split(':').slice(1).join(':') || node.id;
            return (
              <li key={node.id} className="p-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{node.label}</div>
                  {node.summary && (
                    <div className="text-xs text-muted-foreground truncate">{node.summary}</div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() =>
                    onPick({
                      itemType: type,
                      itemSlug: slug,
                      titleOverride: node.label,
                    })
                  }
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
