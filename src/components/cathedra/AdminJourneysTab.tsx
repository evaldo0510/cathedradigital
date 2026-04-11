import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Map,
  Layers,
  Save,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Journey {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  is_active: boolean;
  is_premium: boolean;
  estimated_days: number | null;
}

interface Step {
  id: string;
  journey_id: string;
  title: string;
  subtitle: string | null;
  step_order: number;
  step_type: string;
}

const AdminJourneysTab: React.FC = () => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJourneys(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar jornadas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSteps = async (journeyId: string) => {
    try {
      setStepsLoading(true);
      const { data, error } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId)
        .order('step_order', { ascending: true });

      if (error) throw error;
      setSteps(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar passos: ' + error.message);
    } finally {
      setStepsLoading(false);
    }
  };

  const toggleJourneySteps = (journeyId: string) => {
    if (selectedJourneyId === journeyId) {
      setSelectedJourneyId(null);
      setSteps([]);
    } else {
      setSelectedJourneyId(journeyId);
      fetchSteps(journeyId);
    }
  };

  const handleSaveJourney = async () => {
    if (!editingJourney) return;

    try {
      const { error } = await supabase
        .from('journeys')
        .update({
          title: editingJourney.title,
          subtitle: editingJourney.subtitle,
          description: editingJourney.description,
          category: editingJourney.category,
          difficulty: editingJourney.difficulty,
          is_active: editingJourney.is_active,
          is_premium: editingJourney.is_premium,
          estimated_days: editingJourney.estimated_days
        })
        .eq('id', editingJourney.id);

      if (error) throw error;

      setJourneys(prev => prev.map(j => j.id === editingJourney.id ? editingJourney : j));
      toast.success('Jornada atualizada com sucesso.');
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast.error('Erro ao salvar jornada: ' + error.message);
    }
  };

  const filteredJourneys = journeys.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/40 rounded-lg" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Gestão de Jornadas</h2>
          <p className="text-sm text-muted-foreground">Crie e edite trilhas de crescimento espiritual.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar jornada..."
              className="pl-9 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Nova Jornada
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredJourneys.map((journey) => (
          <div key={journey.id} className="border rounded-xl overflow-hidden bg-card">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleJourneySteps(journey.id)}>
                {selectedJourneyId === journey.id ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Map className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    {journey.title}
                    {journey.is_premium && <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">PRO</Badge>}
                    {!journey.is_active && <Badge variant="outline" className="text-[10px]">Inativa</Badge>}
                  </h3>
                  <p className="text-xs text-muted-foreground">{journey.category} • {journey.estimated_days} dias</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => {
                  setEditingJourney({...journey});
                  setIsEditDialogOpen(true);
                }}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {selectedJourneyId === journey.id && (
              <div className="bg-muted/30 border-t p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2"><Layers className="w-4 h-4" /> Passos da Jornada</h4>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Passo
                  </Button>
                </div>
                {stepsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
                  </div>
                ) : steps.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">Nenhum passo cadastrado nesta jornada.</p>
                ) : (
                  <div className="space-y-2">
                    {steps.map(step => (
                      <div key={step.id} className="flex items-center justify-between bg-card p-3 rounded-lg border text-sm group">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded bg-muted flex items-center justify-center font-bold text-[10px]">{step.step_order}</span>
                          <div>
                            <p className="font-medium">{step.title}</p>
                            <p className="text-xs text-muted-foreground">{step.step_type}</p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Jornada</DialogTitle>
          </DialogHeader>
          {editingJourney && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={editingJourney.title} onChange={e => setEditingJourney({...editingJourney, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input value={editingJourney.subtitle || ''} onChange={e => setEditingJourney({...editingJourney, subtitle: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={editingJourney.description || ''} onChange={e => setEditingJourney({...editingJourney, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input value={editingJourney.category || ''} onChange={e => setEditingJourney({...editingJourney, category: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Dificuldade</Label>
                  <Input value={editingJourney.difficulty || ''} onChange={e => setEditingJourney({...editingJourney, difficulty: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Dias Estimados</Label>
                  <Input type="number" value={editingJourney.estimated_days || 0} onChange={e => setEditingJourney({...editingJourney, estimated_days: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingJourney.is_active} onChange={e => setEditingJourney({...editingJourney, is_active: e.target.checked})} className="rounded border-gray-300" />
                  <span className="text-sm">Ativa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingJourney.is_premium} onChange={e => setEditingJourney({...editingJourney, is_premium: e.target.checked})} className="rounded border-gray-300" />
                  <span className="text-sm">Premium (PRO)</span>
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveJourney} className="gap-2">
              <Save className="w-4 h-4" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJourneysTab;
