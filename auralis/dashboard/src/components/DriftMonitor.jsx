import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, Info, X } from 'lucide-react';

const DriftMonitor = ({ driftData, activeAlerts, onDismissAlert }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Info className="text-indigo-400" /> Clinicopathological Drift
          </h2>
          <div className="text-slate-400 text-xs font-mono uppercase tracking-widest bg-slate-800 px-3 py-1 rounded">
              KL-Divergence Monitoring
          </div>
      </div>

      <div className="flex-1 min-h-[300px] mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={driftData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="round" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#94a3b8' }}
            />
            <ReferenceLine y={0.15} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Threshold', fill: '#ef4444', fontSize: 10 }} />
            
            {/* Render lines for each node dynamically */}
            {[0, 1, 2, 3, 4].map(i => (
                <Line 
                    key={i} 
                    type="monotone" 
                    dataKey={`node_${i}`} 
                    stroke={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][i]} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    animationDuration={1000}
                />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {activeAlerts.map((alert, i) => (
          <div key={i} className="bg-rose-900/20 border border-rose-500/30 p-4 rounded-lg flex gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-rose-500/20 p-2 rounded-full h-fit">
                <AlertTriangle className="text-rose-500" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-rose-400 font-bold text-xs uppercase tracking-wider">Clinical Escalation | Node {alert.node_id}</span>
                <button onClick={() => onDismissAlert(i)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <p className="text-slate-200 text-sm font-semibold mb-1">{alert.message}</p>
              <p className="text-slate-400 text-xs italic">Recommendation: {alert.recommended_action || "Specialist escalation"}</p>
            </div>
          </div>
        ))}
        {activeAlerts.length === 0 && (
          <div className="bg-slate-800/40 p-4 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
            <p className="text-slate-500 text-xs">All nodes within statistical baseline. No active alerts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriftMonitor;
