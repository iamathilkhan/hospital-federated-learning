import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ShieldCheck, Info, FlaskConical, TrendingUp } from 'lucide-react';

const TrainingGraph = ({ trainingData }) => {
  return (
    <div className="bg-white border border-slate-200 p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-premium flex flex-col h-full hover:shadow-premium-hover transition-all duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 lg:mb-10">
        <div className="flex items-center gap-4">
            <div className="bg-medical-50 p-3 rounded-2xl">
                <FlaskConical className="text-medical-600" size={24} />
            </div>
            <div>
                <h2 className="text-lg lg:text-xl font-display font-bold text-slate-900">
                    Learning Progress
                </h2>
                <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5">Model convergence across sites</p>
            </div>
        </div>
        <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
            <span className="text-[9px] lg:text-[10px] uppercase font-black tracking-[0.1em] bg-medical-50 border border-medical-100 text-medical-700 px-3 py-1 rounded-full mb-1">
                Zero Disclosure Protocol
            </span>
            <div className="flex items-center gap-1.5 text-slate-400 text-[9px] lg:text-[10px] italic font-medium">
                <ShieldCheck size={10} className="text-emerald-500" /> DP Active
            </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] lg:min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trainingData}>
            <defs>
              <linearGradient id="colorFed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
                dataKey="round" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tick={{ dy: 10 }}
                label={{ value: 'Consensus Rounds', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis 
                domain={[60, 100]} 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tick={{ dx: -10 }}
                label={{ value: 'Classification Accuracy (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
            />
            <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
            />
            <Legend 
                verticalAlign="top" 
                align="right"
                height={48}
                iconType="circle"
                wrapperStyle={{ paddingTop: '0px', fontSize: '12px', fontWeight: '600' }}
            />
            
            <Area 
              type="monotone" 
              name="GMIS Federated Model"
              dataKey="accuracy" 
              stroke="#0ea5e9" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorFed)" 
              animationDuration={2500}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#0ea5e9 shadow-lg shadow-medical-500/50' }}
            />
            
            <Area 
              type="monotone" 
              name="Isolated Baseline"
              dataKey="baseline" 
              stroke="#64748b" 
              fillOpacity={0}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 flex items-start gap-4 bg-medical-50/70 border border-medical-100 p-5 rounded-2xl">
          <div className="bg-white p-2 rounded-xl border border-medical-100 shadow-sm">
            <TrendingUp className="text-medical-600" size={20} />
          </div>
          <p className="text-medical-950 text-xs leading-relaxed font-medium">
            <b className="font-bold">Privacy Integrity Protocol:</b> Accuracy metrics are cryptographically verified 
            via the GMIS consensus system using weighted Federated Averaging (FedAvg). 
            Continuity is maintained across node dropouts through state synchronization between peer leaders.
          </p>
      </div>
    </div>
  );
};

export default TrainingGraph;
