import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ShieldCheck, Info } from 'lucide-react';

const TrainingGraph = ({ trainingData }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <ShieldCheck className="text-indigo-400" /> Swarm Intelligence Progress
        </h2>
        <div className="flex flex-col items-end">
            <span className="text-slate-400 text-[10px] uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded mb-1">
                Zero Data Transmission Mode
            </span>
            <p className="text-slate-500 text-[10px] italic">Gradient data only — No patient records transmitted</p>
        </div>
      </div>

      <div className="flex-1 min-h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trainingData}>
            <defs>
              <linearGradient id="colorFed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="round" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[60, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#94a3b8' }}
            />
            <Legend verticalAlign="top" height={36}/>
            
            <Area 
              type="monotone" 
              name="Federated model"
              dataKey="accuracy" 
              stroke="#6366f1" 
              fillOpacity={1} 
              fill="url(#colorFed)" 
              strokeWidth={3}
              animationDuration={2000}
            />
            
            <Area 
              type="monotone" 
              name="Local-only baseline"
              dataKey="baseline" 
              stroke="#64748b" 
              fillOpacity={0}
              strokeDasharray="5 5"
              strokeWidth={1}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-lg">
          <Info className="text-indigo-400 shrink-0" size={18} />
          <p className="text-indigo-300/80 text-xs leading-relaxed">
            <b>Privacy Integrity Verified:</b> Accuracy metrics are aggregated via the Raft leader using weighted FedAvg. 
            The chart maintains continuity across consensus leader failures through resilient client-side state caching.
          </p>
      </div>
    </div>
  );
};

export default TrainingGraph;
