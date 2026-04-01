import React from 'react';
import { Terminal, Clock, Activity, Loader2, ShieldCheck, Database, Zap } from 'lucide-react';

const LeaderElection = ({ currentLeader, term, lastElectionTime, electionEvents, roundInProgress, gradientsCollected }) => {
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-premium h-full flex flex-col hover:shadow-premium-hover transition-all duration-500">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 shadow-sm">
                <Zap className="text-amber-600" size={24} />
            </div>
            <div>
                <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                    Consensus Protocol Health
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time Raft-based swarm leader and term synchronization</p>
            </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full border border-amber-100 text-[10px] font-black uppercase tracking-widest">
          Consensus Term: {term || 1}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Active Orchestrator</p>
            <ShieldCheck size={14} className="text-medical-500" />
          </div>
          <p className="text-medical-700 font-display font-extrabold text-xl truncate tracking-tight">
            {currentLeader ? currentLeader : "ELECTING NEW LEADER..."}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Verified Identity</span>
          </div>
        </div>
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Synchronization Age</p>
            <Clock size={14} className="text-slate-300" />
          </div>
          <div className="flex items-center gap-3 text-slate-900">
            <span className="font-display font-extrabold text-2xl tabular-nums">{lastElectionTime || 12}s</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Since Last Stability Check</span>
          </div>
        </div>
      </div>

      <div className="mb-10 p-6 bg-medical-50/30 rounded-3xl border border-medical-100/50">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Database size={16} className="text-medical-600" />
                <p className="text-slate-900 text-sm font-bold tracking-tight">Gradient Aggregation Pipeline</p>
            </div>
            <span className="text-medical-700 text-[10px] font-black uppercase tracking-widest bg-white border border-medical-100 px-2.5 py-1 rounded-lg">Round {roundInProgress || 1} • PHASE 1</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 relative overflow-hidden ring-4 ring-white shadow-inner">
          <div 
            className="bg-medical-500 h-full transition-all duration-[2000ms] ease-out shadow-[0_0_15px_rgba(14,165,233,0.3)]"
            style={{ width: `${(gradientsCollected / 5) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-4">
            <p className="text-slate-500 text-[11px] font-medium flex items-center gap-2">
              {gradientsCollected < 5 ? <Loader2 size={12} className="animate-spin text-medical-500" /> : <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
              Distributed Updates: {gradientsCollected}/5 Sites Synced
            </p>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Secure Aggregation Buffer: 80% Full</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-slate-950 rounded-3xl p-6 border-4 border-white shadow-premium">
        <div className="flex items-center justify-between gap-2 text-slate-400 text-[10px] mb-4 border-b border-slate-800 pb-3 font-bold uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
                <Terminal size={12} className="text-amber-500" /> Swarm Consensus Runtime Log
            </div>
            <span className="text-slate-600 font-medium">LATEST_HEARTBEATS: 0.1ms</span>
        </div>
        <div className="space-y-2 overflow-y-auto h-[250px] font-mono text-[10px] custom-scrollbar pr-2">
          {electionEvents.map((ev, i) => (
            <div key={i} className="flex gap-4 group hover:bg-slate-900 p-1.5 rounded transition-all duration-200">
              <span className="text-slate-700 font-bold">[{ev.time}]</span>
              <div className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${ev.type === 'HEARTBEAT_TIMEOUT' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]'}`} />
                  <span className={ev.type === 'HEARTBEAT_TIMEOUT' ? 'text-rose-400/90 font-bold' : 'text-emerald-400/90 font-medium'}>
                    {ev.message}
                  </span>
              </div>
            </div>
          ))}
          {electionEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-2 opacity-50">
                <ShieldCheck size={24} />
                <p className="italic uppercase tracking-widest text-[9px] font-black">No destabilization events recorded. Swarm is synchronized.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderElection;
