import React, { useState } from 'react';
import { 
  Trash2, 
  Edit2, 
  Copy, 
  UserPlus, 
  Search,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SavedFilter, useSavedFilters } from '@/hooks/useSavedFilters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SavedFiltersManagerProps {
  projectId: string;
  onApply: (filter: SavedFilter) => void;
}

export const SavedFiltersManager: React.FC<SavedFiltersManagerProps> = ({ projectId, onApply }) => {
  const { filters, deleteFilter, updateFilter, duplicateToUser } = useSavedFilters(projectId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<SavedFilter | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const handleStartEdit = (filter: SavedFilter) => {
    setEditingId(filter.id);
    setEditName(filter.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName) return;
    await updateFilter(id, { name: editName });
    setEditingId(null);
    toast.success('Filtro atualizado');
  };

  const handleSearchUsers = async () => {
    if (userSearch.length < 3) return;
    setIsSearchingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .ilike('name', `%${userSearch}%`)
      .limit(5);

    if (!error) setFoundUsers(data || []);
    setIsSearchingUsers(false);
  };

  const handleDuplicate = async (targetUserId: string) => {
    if (!selectedFilter) return;
    const result = await duplicateToUser(selectedFilter, targetUserId);
    if (result) {
      toast.success('Filtro duplicado para o usuário com sucesso!');
    }
  };

  const handleCopyLink = (filter: SavedFilter) => {
    const url = new URL(window.location.href);
    url.searchParams.set('q', filter.query || '');
    url.searchParams.set('f', filter.filter_by || 'all');
    navigator.clipboard.writeText(url.toString());
    toast.success('Link compartilhavel copiado!');
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {filters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground italic text-sm">
              Nenhum filtro salvo ainda.
            </div>
          ) : (
            filters.map(filter => (
              <div key={filter.id} className="group bg-muted/30 border border-border rounded-xl p-3 transition-all hover:bg-muted/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === filter.id ? (
                      <div className="flex items-center gap-2">
                        <Input 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleSaveEdit(filter.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate">{filter.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          Query: {filter.query || '(vazio)'} • Campo: {filter.filter_by}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onApply(filter)} title="Aplicar">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEdit(filter)} title="Editar">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyLink(filter)} title="Copiar Link">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setSelectedFilter(filter);
                      setIsShareDialogOpen(true);
                    }} title="Duplicar para outro usuário">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteFilter(filter.id)} title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar filtro para outro usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar usuário por nome</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Mínimo 3 caracteres..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                />
                <Button size="icon" onClick={handleSearchUsers} disabled={isSearchingUsers}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {foundUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{u.name}</span>
                  <Button size="sm" variant="outline" onClick={() => handleDuplicate(u.id)}>
                    Duplicar para este
                  </Button>
                </div>
              ))}
              {userSearch.length >= 3 && foundUsers.length === 0 && !isSearchingUsers && (
                <p className="text-xs text-center text-muted-foreground">Nenhum usuário encontrado.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsShareDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
