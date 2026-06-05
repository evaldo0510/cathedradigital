import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';

interface BibleAuditDashboardProps {
  data: {
    coverageByBook: { name: string, percent: number }[];
    evolution: { date: string, coverage: number }[];
    stats: {
      totalBooks: number;
      coveredBooks: number;
      totalChapters: number;
      coveredChapters: number;
      totalVerses: number;
      coveredVerses: number;
    };
  };
}

const COLORS = ['#D4AF37', '#E5E4E2', '#C0C0C0', '#FFD700'];

export const BibleAuditDashboard: React.FC<BibleAuditDashboardProps> = ({ data }) => {
  const pieData = [
    { name: 'Coberto', value: data.stats.coveredChapters },
    { name: 'Lacunas', value: data.stats.totalChapters - data.stats.coveredChapters },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Livros', value: `${data.stats.coveredBooks}/${data.stats.totalBooks}`, icon: Icons.Book },
          { label: 'Capítulos', value: `${data.stats.coveredChapters}/${data.stats.totalChapters}`, icon: Icons.List },
          { label: 'Versículos', value: `${data.stats.coveredVerses}/${data.stats.totalVerses}`, icon: Icons.Type },
          { label: 'Integridade', value: `${Math.round((data.stats.coveredChapters / data.stats.totalChapters) * 100)}%`, icon: Icons.ShieldCheck },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-white border border-primary/5 rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <stat.icon className="w-4 h-4 text-secondary" />
              <span className="text-[8px] font-black uppercase tracking-widest text-primary/20">{stat.label}</span>
            </div>
            <p className="text-xl font-display font-bold text-primary/80">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Coverage Pie */}
        <div className="bg-white p-6 border border-primary/5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/40">Distribuição de Cobertura</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#D4AF37' : '#F1F0FB'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolution Line */}
        <div className="bg-white p-6 border border-primary/5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/40">Evolução da Auditoria</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.evolution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F0FB" />
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#A1A1AA' }}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#A1A1AA' }}
                  unit="%"
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="coverage" 
                  stroke="#D4AF37" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#D4AF37', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Book Breakdown */}
      <div className="bg-white p-6 border border-primary/5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/40">Detalhamento por Livro (Top 10 Lacunas)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.coverageByBook.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F0FB" />
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#A1A1AA' }}
              />
              <YAxis 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#A1A1AA' }}
                unit="%"
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="percent" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
