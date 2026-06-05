import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'bible' | 'catechism' | 'document' | 'theme';
  summary?: string;
  connections: string[]; // IDs of connected nodes
}

interface KnowledgeGraphProps {
  onClose: () => void;
  initialNodeId?: string;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onClose, initialNodeId }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(initialNodeId || 'Jo-6-35');

  // Mock Graph Data
  const nodes: Record<string, KnowledgeNode> = {
    'Jo-6-35': { id: 'Jo-6-35', label: 'João 6:35', type: 'bible', summary: 'Eu sou o pão da vida...', connections: ['1324', 'Ex-16', 'ede'] },
    '1324': { id: '1324', label: 'CIC 1324', type: 'catechism', summary: 'Fonte e ápice da vida cristã.', connections: ['Jo-6-35', 'ede'] },
    'Ex-16': { id: 'Ex-16', label: 'Êxodo 16', type: 'bible', summary: 'O maná do céu.', connections: ['Jo-6-35'] },
    'ede': { id: 'ede', label: 'Ecclesia de Eucharistia', type: 'document', summary: 'Encíclica de João Paulo II.', connections: ['Jo-6-35', '1324'] },
    'creatio': { id: 'creatio', label: 'Criação', type: 'theme', summary: 'A origem de todas as coisas.', connections: ['Gn-1-1', '279'] },
    'Gn-1-1': { id: 'Gn-1-1', label: 'Gênesis 1:1', type: 'bible', summary: 'No princípio...', connections: ['creatio', '279'] },
    '279': { id: '279', label: 'CIC 279', type: 'catechism', summary: 'A criação do mundo.', connections: ['Gn-1-1', 'creatio'] },
  };

  const currentNode = selectedNode ? nodes[selectedNode] : null;
  const connectedNodes = currentNode ? currentNode.connections.map(id => nodes[id]).filter(Boolean) : [];

  return (
    <div className="fixed inset-0 z-[250] bg-[#0A0B0D] text-stone-300 flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between border-b border-white/5">
        <button onClick={onClose} className="p-2 -ml-2 text-stone-500 active:text-secondary">
          <Icons.X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary/60">Knowledge Graph</h1>
          <span className="text-[8px] font-medium uppercase text-stone-600">Cathedra Phase 3</span>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-6">
        {/* Simple Visual Graph Representation */}
        <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
          {/* Connection Lines (Visual Mock) */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full">
              <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="currentColor" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="currentColor" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          {/* Central Node */}
          <AnimatePresence mode="wait">
            {currentNode && (
              <motion.div
                key={currentNode.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 p-6 rounded-full bg-secondary/10 border border-secondary/30 shadow-[0_0_50px_rgba(212,175,55,0.1)] text-center w-40 h-40 flex flex-col items-center justify-center"
              >
                <span className="text-[8px] font-black uppercase tracking-widest text-secondary mb-1">{currentNode.type}</span>
                <span className="font-display font-bold text-white uppercase tracking-tight">{currentNode.label}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connected Satellite Nodes */}
          {connectedNodes.map((node, i) => {
            const angle = (i / connectedNodes.length) * Math.PI * 2;
            const x = Math.cos(angle) * 120;
            const y = Math.sin(angle) * 120;

            return (
              <motion.button
                key={node.id}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x, y: opacity: 1 }}
                onClick={() => setSelectedNode(node.id)}
                className="absolute p-3 rounded-full bg-white/5 border border-white/10 hover:bg-secondary/20 hover:border-secondary/40 transition-colors group"
              >
                <div className="text-center">
                   <div className={cn(
                     "w-1.5 h-1.5 rounded-full mx-auto mb-1",
                     node.type === 'bible' && "bg-green-500",
                     node.type === 'catechism' && "bg-blue-500",
                     node.type === 'document' && "bg-purple-500",
                     node.type === 'theme' && "bg-orange-500",
                   )} />
                   <span className="text-[7px] font-black text-stone-500 uppercase tracking-tighter group-hover:text-white transition-colors">{node.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Node Summary Card */}
        <AnimatePresence>
          {currentNode && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-12 w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-lg font-display font-bold text-white uppercase">{currentNode.label}</h2>
                <p className="text-sm font-serif italic text-stone-400 line-clamp-3">
                  {currentNode.summary || "Explorando as conexões de fé e tradição."}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 h-10 rounded-xl bg-secondary text-black text-[9px] font-black uppercase tracking-widest">
                  Ver Texto Completo
                </button>
                <button className="flex-1 h-10 rounded-xl bg-white/10 text-white text-[9px] font-black uppercase tracking-widest">
                  Ir para Origem
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="p-8 text-center">
        <p className="text-[9px] font-medium text-stone-600 uppercase tracking-widest">
          Aperte em um nó para explorar a rede de conhecimento.
        </p>
      </footer>
    </div>
  );
};
