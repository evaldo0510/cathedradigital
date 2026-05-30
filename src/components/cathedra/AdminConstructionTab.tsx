import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search,
  Building2,
  Upload,
  FileSpreadsheet,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface ConstructionData {
  id: string;
  project_id: string;
  type: 'budget' | 'schedule';
  item_name: string;
  planned_value: number | null;
  actual_value: number | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  progress: number;
  category: string | null;
}

const AdminConstructionTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'budget' | 'schedule'>('budget');
  const [uploading, setUploading] = useState(false);
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'em_andamento'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('construction_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar obras: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name) {
      toast.error('Nome da obra é obrigatório');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('construction_projects')
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;
      
      setProjects([data, ...projects]);
      toast.success('Obra criada com sucesso');
      setIsAddProjectDialogOpen(false);
      setNewProject({ name: '', description: '', status: 'em_andamento' });
    } catch (error: any) {
      toast.error('Erro ao criar obra: ' + error.message);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta obra e todos os seus dados?')) return;

    try {
      const { error } = await supabase
        .from('construction_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Obra excluída');
    } catch (error: any) {
      toast.error('Erro ao excluir obra: ' + error.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjectId) return;

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error('A planilha está vazia');
          setUploading(false);
          return;
        }

        // Process data based on type
        const formattedData = jsonData.map((row: any) => {
          if (uploadType === 'budget') {
            return {
              project_id: selectedProjectId,
              type: 'budget',
              item_name: row['Item'] || row['Nome'] || row['Descrição'] || 'Sem nome',
              planned_value: row['Previsto'] || row['Orçado'] || 0,
              actual_value: row['Real'] || row['Gasto'] || 0,
              category: row['Categoria'] || 'Geral'
            };
          } else {
            return {
              project_id: selectedProjectId,
              type: 'schedule',
              item_name: row['Tarefa'] || row['Atividade'] || 'Sem nome',
              planned_start_date: row['Início Previsto'] || row['Start'] || null,
              planned_end_date: row['Fim Previsto'] || row['End'] || null,
              actual_start_date: row['Início Real'] || null,
              actual_end_date: row['Fim Real'] || null,
              progress: row['Progresso'] || row['%'] || 0,
              category: row['Fase'] || 'Geral'
            };
          }
        });

        // Insert/Update in database using upsert with our new unique constraint
        const { error } = await supabase
          .from('construction_data')
          .upsert(formattedData, { onConflict: 'project_id,type,item_name,category' });

        if (error) throw error;

        toast.success(`Planilha de ${uploadType === 'budget' ? 'orçamento' : 'cronograma'} processada com sucesso!`);
        setIsUploadDialogOpen(false);
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error('Erro ao processar planilha: Verifique os nomes das colunas.');
      } finally {
        setUploading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <h2 className="text-xl font-bold">Gestão de Obras</h2>
          <p className="text-sm text-muted-foreground">Gerencie orçamentos e cronogramas de construção.</p>
        </div>
        <div className="flex gap-xs">
          <div className="relative">
            <Search className="absolute left-xs top-xs h-md w-md text-muted-foreground" />
            <Input
              placeholder="Buscar obra..."
              className="pl-xl w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="gap-xs" onClick={() => setIsAddProjectDialogOpen(true)}>
            <Plus className="w-md h-md" /> Nova Obra
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-premium bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed border-2 py-2xl">
          <CardContent className="flex flex-col items-center text-center space-y-4">
            <div className="w-3xl h-3xl rounded-premium bg-muted flex items-center justify-center">
              <Building2 className="w-xl h-xl text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Nenhuma obra cadastrada</p>
              <p className="text-sm text-muted-foreground">Comece criando uma nova obra paroquial.</p>
            </div>
            <Button onClick={() => setIsAddProjectDialogOpen(true)}>Criar Primeira Obra</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden group hover:border-primary/50 transition-all">
              <CardHeader className="pb-sm flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{project.description || 'Sem descrição'}</CardDescription>
                </div>
                <Badge variant={project.status === 'concluida' ? 'default' : 'secondary'}>
                  {project.status === 'concluida' ? 'Concluída' : 'Em Andamento'}
                </Badge>
              </CardHeader>
              <CardContent className="pb-sm space-y-4">
                <div className="grid grid-cols-2 gap-md">
                  <div className="p-sm rounded-premium bg-muted/50 border space-y-1">
                    <div className="flex items-center gap-xs text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <DollarSign className="w-sm h-sm" /> Orçamento
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-xl gap-xs text-premium-tiny font-black uppercase tracking-widest"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setUploadType('budget');
                        setIsUploadDialogOpen(true);
                      }}
                    >
                      <Upload className="w-sm h-sm" /> Subir Planilha
                    </Button>
                  </div>
                  <div className="p-sm rounded-premium bg-muted/50 border space-y-1">
                    <div className="flex items-center gap-xs text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <Calendar className="w-sm h-sm" /> Cronograma
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-xl gap-xs text-premium-tiny font-black uppercase tracking-widest"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setUploadType('schedule');
                        setIsUploadDialogOpen(true);
                      }}
                    >
                      <Upload className="w-sm h-sm" /> Subir Planilha
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 py-sm flex justify-between">
                <span className="text-premium-tiny text-muted-foreground">Criada em: {new Date(project.created_at).toLocaleDateString()}</span>
                <Button variant="ghost" size="sm" className="h-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProject(project.id)}>
                  <Trash2 className="w-sm h-sm" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Project Dialog */}
      <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Obra</DialogTitle>
            <DialogDescription>Cadastre uma nova obra ou reforma paroquial.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-xs">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nome da Obra</Label>
              <Input 
                id="project-name" 
                placeholder="Ex: Reforma do Telhado da Matriz" 
                value={newProject.name}
                onChange={e => setNewProject({...newProject, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">Descrição</Label>
              <Input 
                id="project-desc" 
                placeholder="Breve descrição dos objetivos..." 
                value={newProject.description}
                onChange={e => setNewProject({...newProject, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProjectDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateProject}>Criar Obra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Planilha de {uploadType === 'budget' ? 'Orçamento' : 'Cronograma'}</DialogTitle>
            <DialogDescription>
              Selecione um arquivo .xlsx ou .csv. A planilha deve conter colunas como: 
              {uploadType === 'budget' ? ' "Item", "Previsto", "Real"' : ' "Tarefa", "Início Previsto", "Fim Previsto", "Progresso"'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-xl border-2 border-dashed rounded-premium gap-md bg-muted/5">
            <div className="w-2xl h-2xl rounded-premium bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-lg h-lg text-primary" />
            </div>
            <div className="text-center px-md">
              <p className="text-sm font-medium">Arraste sua planilha aqui ou clique no botão</p>
              <p className="text-xs text-muted-foreground mt-2xs">Formato suportado: XLSX, XLS, CSV</p>
            </div>
            <div className="relative">
              <Button disabled={uploading} className="relative z-10">
                {uploading ? <Loader2 className="w-md h-md animate-spin mr-xs" /> : <Upload className="w-md h-md mr-xs" />}
                Selecionar Arquivo
              </Button>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-premium p-sm flex gap-sm">
            <AlertCircle className="w-md h-md text-amber-500 shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-bold">Atenção!</p>
              <p>Ao subir uma nova planilha, os dados serão adicionados aos já existentes. Para atualizar um dado real, certifique-se que o nome do item é idêntico.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminConstructionTab;
