import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, Info, X, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';

const DriftMonitor = ({ driftData, activeAlerts, onDismissAlert }) => {
  return (
    <div className="bg-white border border-slate-200 p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-premium h-full flex flex-col hover:shadow-premium-hover transition-all duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 lg:mb-10">
          <div className="flex items-center gap-4">
              <div className="bg-rose-50 p-3 rounded-2xl">
                  <Activity className="text-rose-600" size={24} />
              </div>
              <div>
                  <h2 className="text-lg lg:text-xl font-display font-bold text-slate-900">
                        Clinical Distribution Drift
                  </h2>
                  <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5">Statistical divergence monitoring</p>
              </div>
          </div>
          <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[9px] lg:text-[10px] text-slate-400 font-black uppercase tracking-widest italic">KL-Divergence</span>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </div>
      </div>

      <div className="flex-1 min-h-[350px] mb-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={driftData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="round" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tick={{ dy: 10 }} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tick={{ dx: -10 }} />
            <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
            />
            <ReferenceLine 
                y={0.15} 
                stroke="#ef4444" 
                strokeDasharray="4 4" 
                label={{ 
                  position: 'bottom', 
                  value: 'Risk Threshold (0.15)', 
                  fill: '#ef4444', 
                  fontSize: 10,
                  fontWeight: 'bold',
                  offset: 10
                }} 
            />
            
            {[0, 1, 2, 3, 4].map(i => (
                <Line 
                    key={i} 
                    type="monotone" 
                    dataKey={`node_${i}`} 
                    stroke={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][i]} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 1.5, stroke: '#fff' }}
                    animationDuration={1500}
                />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Active Anomaly Vector Notifications</h3>
            <span className="text-[10px] font-bold text-medical-600 bg-medical-50 px-2 py-0.5 rounded-md">{activeAlerts.length} Critical Vectors</span>
        </div>
        
        {activeAlerts.map((alert, i) => (
          <div key={i} className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl flex gap-5 hover:bg-rose-50 transition-colors animate-in fade-in slide-in-from-right-5 duration-500 shadow-sm">
            <div className="bg-rose-100/50 p-2.5 rounded-xl h-fit border border-rose-200 shadow-sm">
                <ShieldAlert className="text-rose-600" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-rose-600 font-black text-[10px] uppercase tracking-widest">Vector Escalation</span>
                    <span className="w-1 h-1 bg-rose-200 rounded-full" />
                    <span className="text-rose-900 font-bold text-xs">Node {alert.node_id}</span>
                </div>
                <button onClick={() => onDismissAlert(i)} className="text-slate-300 hover:text-slate-600 transition-colors bg-white/50 p-1 rounded-lg">
                  <X size={14} />
                </button>
              </div>
              <p className="text-slate-900 text-sm font-semibold mb-2">{alert.message}</p>
              <div className="flex items-center gap-2 bg-white/60 p-2 rounded-xl border border-rose-100/50">
                  <div className="bg-rose-600 w-1 h-3 rounded-full" />
                  <p className="text-slate-500 text-[11px] font-medium uppercase tracking-tight italic">
                    Protocol Recommendation: {alert.recommended_action || "Senior Specialist Retraining Required"}
                  </p>
              </div>
            </div>
          </div>
        ))}
        
        {activeAlerts.length === 0 && (
          <div className="bg-emerald-50/30 p-8 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-emerald-100/50 group transition-all hover:bg-emerald-50/50">
            <div className="bg-emerald-100 p-3 rounded-2xl mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <CheckCircle2 className="text-emerald-600" size={24} />
            </div>
            <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">Baseline Convergence Confirmed</p>
            <p className="text-emerald-600/70 text-[10px] font-medium">All swarm nodes maintain statistical demographic equilibrium.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriftMonitor;
