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
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  content: any;
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
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [isEditStepDialogOpen, setIsEditStepDialogOpen] = useState(false);
  const [stepContentString, setStepContentString] = useState('');
  
  const [journeyToDelete, setJourneyToDelete] = useState<Journey | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [stepsToDeleteCount, setStepsToDeleteCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isAddJourneyDialogOpen, setIsAddJourneyDialogOpen] = useState(false);
  const [newJourney, setNewJourney] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Formação',
    difficulty: 'Iniciante',
    is_active: true,
    is_premium: false,
    estimated_days: 7
  });


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
  
  const handleEditStep = (step: Step) => {
    setEditingStep(step);
    setStepContentString(JSON.stringify(step.content, null, 2));
    setIsEditStepDialogOpen(true);
  };
  
  const handleSaveStep = async () => {
    if (!editingStep) return;
    
    try {
      console.log(`Saving step: ${editingStep.title} (${editingStep.id})`);
      let parsedContent = editingStep.content;
      try {
        parsedContent = typeof stepContentString === 'string' ? JSON.parse(stepContentString) : stepContentString;
      } catch (e) {
        console.error('Invalid JSON in step content:', e);
        toast.error('JSON inválido no conteúdo do passo. Verifique a sintaxe.');
        return;
      }
      
      const { error } = await supabase
        .from('journey_steps')
        .update({
          title: editingStep.title,
          subtitle: editingStep.subtitle,
          step_order: editingStep.step_order,
          step_type: editingStep.step_type,
          content: parsedContent
        })
        .eq('id', editingStep.id);
        
      if (error) {
        console.error('Error saving step:', error);
        toast.error(`Falha ao salvar o passo: ${error.message}`);
        throw error;
      }
      
      setSteps(prev => prev.map(s => s.id === editingStep.id ? { ...editingStep, content: parsedContent } : s));
      toast.success(`Passo "${editingStep.title}" atualizado.`);
      setIsEditStepDialogOpen(false);
    } catch (error: any) {
      console.error('Critical error saving step:', error);
      toast.error('Erro ao salvar passo: ' + (error.message || 'Falha na rede'));
    }
  };

  
  const handleDeleteStep = async (stepId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este passo?')) return;
    
    try {
      console.log(`Deleting step: ${stepId}`);
      const { error } = await supabase
        .from('journey_steps')
        .delete()
        .eq('id', stepId);
        
      if (error) {
        console.error('Error deleting step:', error);
        throw error;
      }
      
      setSteps(prev => prev.filter(s => s.id !== stepId));
      toast.success('Passo removido com sucesso.');
    } catch (error: any) {
      console.error('Step deletion error:', error);
      toast.error('Erro ao excluir passo: ' + (error.message || 'Erro no servidor'));
    }
  };


  const handleSaveJourney = async () => {
    if (!editingJourney) return;

    try {
      console.log(`Updating journey: ${editingJourney.title} (${editingJourney.id})`);
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

      if (error) {
        console.error('Error updating journey:', error);
        throw error;
      }

      setJourneys(prev => prev.map(j => j.id === editingJourney.id ? editingJourney : j));
      toast.success('Jornada atualizada com sucesso.');
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Save journey error:', error);
      toast.error('Erro ao salvar jornada: ' + (error.message || 'Falha na conexão'));
    }
  };

  const initiateDeleteJourney = async (journey: Journey) => {
    try {
      // Fetch step count for confirmation modal
      const { count, error } = await supabase
        .from('journey_steps')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', journey.id);
      
      if (error) throw error;
      
      setStepsToDeleteCount(count || 0);
      setJourneyToDelete(journey);
      setIsDeleteDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching step count for deletion:', error);
      toast.error('Erro ao preparar exclusão: ' + error.message);
    }
  };

  const confirmDeleteJourney = async () => {
    if (!journeyToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log(`Attempting to delete journey: ${journeyToDelete.title} (${journeyToDelete.id})`);
      
      const { error } = await supabase
        .from('journeys')
        .delete()
        .eq('id', journeyToDelete.id);

      if (error) {
        console.error('Database error during journey deletion:', error);
        throw error;
      }

      setJourneys(prev => prev.filter(j => j.id !== journeyToDelete.id));
      if (selectedJourneyId === journeyToDelete.id) {
        setSelectedJourneyId(null);
        setSteps([]);
      }
      
      toast.success(`Jornada "${journeyToDelete.title}" e seus ${stepsToDeleteCount} passos foram excluídos com sucesso.`);
      setIsDeleteDialogOpen(false);
      setJourneyToDelete(null);
    } catch (error: any) {
      console.error('Critical error deleting journey:', error);
      toast.error('Erro ao excluir jornada: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsDeleting(false);
    }
  };



  const handleCreateJourney = async () => {
    try {
      console.log('Creating new journey:', newJourney.title);
      const { data, error } = await supabase
        .from('journeys')
        .insert([newJourney])
        .select()
        .single();

      if (error) {
        console.error('Error creating journey:', error);
        toast.error(`Falha ao criar jornada: ${error.message}`);
        throw error;
      }
      
      setJourneys([data, ...journeys]);
      toast.success(`Jornada "${newJourney.title}" criada com sucesso.`);
      setIsAddJourneyDialogOpen(false);
      setNewJourney({
        title: '',
        subtitle: '',
        description: '',
        category: 'Formação',
        difficulty: 'Iniciante',
        is_active: true,
        is_premium: false,
        estimated_days: 7
      });
    } catch (error: any) {
      console.error('Create journey error:', error);
      toast.error('Erro ao criar jornada: ' + (error.message || 'Erro inesperado'));
    }
  };


  const handleCreateStep = async (journeyId: string) => {
    try {
      const nextOrder = steps.length > 0 ? Math.max(...steps.map(s => s.step_order)) + 1 : 1;
      const newStep = {
        journey_id: journeyId,
        title: 'Novo Passo',
        step_order: nextOrder,
        step_type: 'reflexão',
        content: { intro: '', reflection: '', practice: '', prayer: '' }
      };

      const { data, error } = await supabase
        .from('journey_steps')
        .insert([newStep])
        .select()
        .single();

      if (error) throw error;
      
      setSteps([...steps, data]);
      handleEditStep(data);
      toast.success('Passo adicionado.');
    } catch (error: any) {
      toast.error('Erro ao adicionar passo: ' + error.message);
    }
  };

  const filteredJourneys = journeys.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="space-y-md animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-3xl bg-muted/40 rounded-premium" />)}
    </div>;
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <h2 className="text-xl font-bold">Gestão de Jornadas</h2>
          <p className="text-sm text-muted-foreground">Crie e edite trilhas de crescimento espiritual.</p>
        </div>
        <div className="flex gap-xs">
          <div className="relative">
            <Search className="absolute left-xs top-xs h-md w-md text-muted-foreground" />
            <Input
              placeholder="Buscar jornada..."
              className="pl-xl w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="gap-xs" onClick={() => setIsAddJourneyDialogOpen(true)}>
            <Plus className="w-md h-md" /> Nova Jornada
          </Button>
        </div>
      </div>

      <div className="grid gap-md">
        {filteredJourneys.map((journey) => (
          <div key={journey.id} className="border rounded-premium overflow-hidden bg-card">
            <div className="p-md flex items-center justify-between">
              <div className="flex items-center gap-sm cursor-pointer flex-1" onClick={() => toggleJourneySteps(journey.id)}>
                {selectedJourneyId === journey.id ? <ChevronDown className="w-md h-md text-muted-foreground" /> : <ChevronRight className="w-md h-md text-muted-foreground" />}
                <div className="w-xl h-xl rounded-premium bg-primary/10 flex items-center justify-center">
                  <Map className="w-md h-md text-primary" />
                </div>
                <div>
                  <h3 className="font-bold flex items-center gap-xs">
                    {journey.title}
                    {journey.is_premium && <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">PRO</Badge>}
                    {!journey.is_active && <Badge variant="outline" className="text-xs">Inativa</Badge>}
                  </h3>
                  <p className="text-xs text-muted-foreground">{journey.category} • {journey.estimated_days} dias</p>
                </div>
              </div>
              <div className="flex items-center gap-xs">
                <Button variant="ghost" size="icon" onClick={() => {
                  setEditingJourney({...journey});
                  setIsEditDialogOpen(true);
                }}>
                  <Edit className="w-md h-md" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={(e) => {
                  e.stopPropagation();
                  initiateDeleteJourney(journey);
                }}>
                  <Trash2 className="w-md h-md" />
                </Button>

              </div>
            </div>

            {selectedJourneyId === journey.id && (
              <div className="bg-muted/30 border-t p-md space-y-sm">
                <div className="flex items-center justify-between mb-xs">
                  <h4 className="text-sm font-semibold flex items-center gap-xs"><Layers className="w-md h-md" /> Passos da Jornada</h4>
                  <Button variant="outline" size="sm" className="h-xl text-xs gap-2xs" onClick={() => handleCreateStep(journey.id)}>
                    <Plus className="w-sm h-sm" /> Adicionar Passo
                  </Button>
                </div>
                {stepsLoading ? (
                  <div className="space-y-xs">
                    {[1, 2].map(i => <div key={i} className="h-xl bg-muted animate-pulse rounded" />)}
                  </div>
                ) : steps.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-md">Nenhum passo cadastrado nesta jornada.</p>
                ) : (
                  <div className="space-y-xs">
                    {steps.map(step => (
                      <div key={step.id} className="flex items-center justify-between bg-card p-sm rounded-premium border text-sm group">
                        <div className="flex items-center gap-sm">
                          <span className="w-lg h-lg rounded bg-muted flex items-center justify-center font-bold text-xs">{step.step_order}</span>
                          <div>
                            <p className="font-medium">{step.title}</p>
                            <p className="text-xs text-muted-foreground">{step.step_type}</p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-lg w-lg" onClick={() => handleEditStep(step)}><Edit className="w-sm h-sm" /></Button>
                          <Button variant="ghost" size="icon" className="h-lg w-lg text-destructive" onClick={() => handleDeleteStep(step.id)}><Trash2 className="w-sm h-sm" /></Button>
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
            <div className="grid gap-md py-md">
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <Label>Título</Label>
                  <Input value={editingJourney.title} onChange={e => setEditingJourney({...editingJourney, title: e.target.value})} />
                </div>
                <div className="space-y-xs">
                  <Label>Subtítulo</Label>
                  <Input value={editingJourney.subtitle || ''} onChange={e => setEditingJourney({...editingJourney, subtitle: e.target.value})} />
                </div>
              </div>
              <div className="space-y-xs">
                <Label>Descrição</Label>
                <Textarea value={editingJourney.description || ''} onChange={e => setEditingJourney({...editingJourney, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-md">
                <div className="space-y-xs">
                  <Label>Categoria</Label>
                  <Input value={editingJourney.category || ''} onChange={e => setEditingJourney({...editingJourney, category: e.target.value})} />
                </div>
                <div className="space-y-xs">
                  <Label>Dificuldade</Label>
                  <Input value={editingJourney.difficulty || ''} onChange={e => setEditingJourney({...editingJourney, difficulty: e.target.value})} />
                </div>
                <div className="space-y-xs">
                  <Label>Dias Estimados</Label>
                  <Input type="number" value={editingJourney.estimated_days || 0} onChange={e => setEditingJourney({...editingJourney, estimated_days: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-md">
                <label className="flex items-center gap-xs cursor-pointer">
                  <input type="checkbox" checked={editingJourney.is_active} onChange={e => setEditingJourney({...editingJourney, is_active: e.target.checked})} className="rounded border-gray-300" />
                  <span className="text-sm">Ativa</span>
                </label>
                <label className="flex items-center gap-xs cursor-pointer">
                  <input type="checkbox" checked={editingJourney.is_premium} onChange={e => setEditingJourney({...editingJourney, is_premium: e.target.checked})} className="rounded border-gray-300" />
                  <span className="text-sm">Premium (PRO)</span>
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveJourney} className="gap-xs">
              <Save className="w-md h-md" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditStepDialogOpen} onOpenChange={setIsEditStepDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Passo da Jornada</DialogTitle>
          </DialogHeader>
          {editingStep && (
            <div className="flex-1 overflow-y-auto pr-xs space-y-md py-md">
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <Label>Título</Label>
                  <Input value={editingStep.title} onChange={e => setEditingStep({...editingStep, title: e.target.value})} />
                </div>
                <div className="space-y-xs">
                  <Label>Subtítulo</Label>
                  <Input value={editingStep.subtitle || ''} onChange={e => setEditingStep({...editingStep, subtitle: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <Label>Tipo de Passo</Label>
                  <Input value={editingStep.step_type} onChange={e => setEditingStep({...editingStep, step_type: e.target.value})} />
                </div>
                <div className="space-y-xs">
                  <Label>Ordem</Label>
                  <Input type="number" value={editingStep.step_order} onChange={e => setEditingStep({...editingStep, step_order: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-xs">
                <Label>Conteúdo (JSON)</Label>
                <div className="relative group">
                   <Textarea 
                     className="font-mono text-xs h-[300px]" 
                     value={stepContentString} 
                     onChange={e => setStepContentString(e.target.value)} 
                   />
                   <div className="absolute right-xs top-xs opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="outline" size="sm" className="h-lg text-xs uppercase tracking-tighter" onClick={() => {
                       try {
                         const parsed = JSON.parse(stepContentString);
                         setStepContentString(JSON.stringify(parsed, null, 2));
                         toast.success('JSON formatado.');
                       } catch (e) {
                         toast.error('Erro ao formatar JSON.');
                       }
                     }}>Formatar</Button>
                   </div>
                </div>
                <p className="text-xs text-muted-foreground italic">Dica: use chaves como 'intro', 'reflection', 'practice', 'prayer' para que o conteúdo apareça no app.</p>
              </div>
            </div>
          )}
          <DialogFooter className="pt-md border-t">
            <Button variant="outline" onClick={() => setIsEditStepDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveStep} className="gap-xs">
              <Save className="w-md h-md" /> Salvar Passo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddJourneyDialogOpen} onOpenChange={setIsAddJourneyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Jornada</DialogTitle>
            <DialogDescription>Crie uma nova trilha espiritual para os usuários.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-md py-md">
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <Label>Título</Label>
                <Input placeholder="Ex: Caminho de Santidade" value={newJourney.title} onChange={e => setNewJourney({...newJourney, title: e.target.value})} />
              </div>
              <div className="space-y-xs">
                <Label>Subtítulo</Label>
                <Input placeholder="Ex: 7 dias de reflexão" value={newJourney.subtitle} onChange={e => setNewJourney({...newJourney, subtitle: e.target.value})} />
              </div>
            </div>
            <div className="space-y-xs">
              <Label>Descrição</Label>
              <Textarea placeholder="Descreva o propósito desta jornada..." value={newJourney.description} onChange={e => setNewJourney({...newJourney, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-md">
              <div className="space-y-xs">
                <Label>Categoria</Label>
                <Input value={newJourney.category} onChange={e => setNewJourney({...newJourney, category: e.target.value})} />
              </div>
              <div className="space-y-xs">
                <Label>Dificuldade</Label>
                <Input value={newJourney.difficulty} onChange={e => setNewJourney({...newJourney, difficulty: e.target.value})} />
              </div>
              <div className="space-y-xs">
                <Label>Dias Estimados</Label>
                <Input type="number" value={newJourney.estimated_days} onChange={e => setNewJourney({...newJourney, estimated_days: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="flex gap-md">
              <label className="flex items-center gap-xs cursor-pointer">
                <input type="checkbox" checked={newJourney.is_active} onChange={e => setNewJourney({...newJourney, is_active: e.target.checked})} className="rounded border-gray-300" />
                <span className="text-sm font-medium">Ativa</span>
              </label>
              <label className="flex items-center gap-xs cursor-pointer">
                <input type="checkbox" checked={newJourney.is_premium} onChange={e => setNewJourney({...newJourney, is_premium: e.target.checked})} className="rounded border-gray-300" />
                <span className="text-sm font-medium">Premium (PRO)</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddJourneyDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateJourney} disabled={!newJourney.title}>Criar Jornada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-xs text-destructive">
              <AlertTriangle className="w-md h-md" /> Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir a jornada <strong className="text-foreground">"{journeyToDelete?.title}"</strong>.
              <br /><br />
              Esta ação removerá permanentemente a jornada e <strong className="text-destructive font-bold">{stepsToDeleteCount} passos</strong> associados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteJourney();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir Tudo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminJourneysTab;

