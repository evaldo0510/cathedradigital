/**
 * Lista ordenável de itens da coleção — drag-and-drop nativo HTML5.
 * Sem dependências novas.
 */
import { useEffect, useState } from 'react';
import { GripVertical, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collectionAutoNexus } from './collectionAutoNexus';
import type { CollectionItem } from './types';

interface Props {
  items: CollectionItem[];
  onReorder: (orderedIds: string[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export default function CollectionItemsList({ items, onReorder, onRemove, disabled }: Props) {
  const [local, setLocal] = useState<CollectionItem[]>(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => setLocal(items), [items]);

  const commit = (next: CollectionItem[]) => {
    setLocal(next);
    onReorder(next.map((i) => i.id));
  };

  const move = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const fromIdx = local.findIndex((i) => i.id === fromId);
    const toIdx = local.findIndex((i) => i.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...local];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    commit(next);
  };

  const hrefMap = new Map(collectionAutoNexus(local).map((n) => [`${n.kind}:${n.id}`, n.href]));

  if (local.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
        Nenhum item na coleção. Use o seletor abaixo para adicionar conteúdos do Knowledge Registry.
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {local.map((item, idx) => {
        const href = hrefMap.get(`${item.item_type}:${item.item_slug}`);
        return (
          <li
            key={item.id}
            draggable={!disabled}
            onDragStart={() => setDraggingId(item.id)}
            onDragEnd={() => setDraggingId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingId) move(draggingId, item.id);
            }}
            className={`flex items-center gap-3 rounded-md border border-border bg-background p-3 ${
              draggingId === item.id ? 'opacity-50' : ''
            }`}
          >
            <GripVertical
              className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab"
              aria-label="Arrastar"
            />
            <span className="text-xs font-mono text-muted-foreground w-8 tabular-nums">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {item.title_override ?? item.item_slug}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                <Badge variant="outline" className="mr-2 text-[10px]">{item.item_type}</Badge>
                {item.item_slug}
              </div>
            </div>
            {href && (
              <Button asChild size="sm" variant="ghost" title="Abrir destino Nexus">
                <Link to={href} target="_blank" rel="noopener">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => onRemove(item.id)}
              title="Remover item"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </li>
        );
      })}
    </ol>
  );
}
