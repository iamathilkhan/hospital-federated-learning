import React from 'react';
import { Terminal, Clock, Activity, Loader2, ShieldCheck, Database, Zap } from 'lucide-react';

const LeaderElection = ({ currentLeader, term, lastElectionTime, electionEvents, roundInProgress, gradientsCollected }) => {
  return (
    <div className="flex flex-col h-full space-y-4 lg:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Active Orchestrator Card */}
          <div className="bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-premium border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Terminal size={60} />
              </div>
              <p className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest mb-3 lg:mb-4 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-medical-500" /> Active Orchestrator
              </p>
              <p className="text-medical-700 font-display font-extrabold text-lg lg:text-xl truncate tracking-tight">
                  {currentLeader ? currentLeader : "ELECTING..."}
              </p>
              <div className="mt-4 lg:mt-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] lg:text-[10px] text-slate-500 font-bold uppercase">Raft Term {term} • Verified</span>
              </div>
          </div>

          {/* Sync Age Card */}
          <div className="bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-premium border border-slate-200">
              <p className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest mb-3 lg:mb-4">Sync Age</p>
              <p className="text-slate-900 font-display font-extrabold text-2xl lg:text-4xl tabular-nums">
                  {lastElectionTime}<span className="text-sm lg:text-base text-slate-300 ml-1">ms</span>
              </p>
              <p className="text-[9px] lg:text-[10px] text-emerald-600 font-bold mt-2 uppercase">Optimal Latency</p>
          </div>

          {/* Aggregation Sync Card */}
          <div className="bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-premium border border-slate-200 sm:col-span-2 lg:col-span-1">
              <p className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest mb-3 lg:mb-4">Gradients Collected</p>
              <div className="flex items-end gap-3">
                  <p className="text-slate-900 font-display font-extrabold text-2xl lg:text-4xl tabular-nums">{gradientsCollected}/05</p>
                  <div className="flex-1 h-3 lg:h-4 bg-slate-100 rounded-full mb-1 overflow-hidden">
                      <div className="h-full bg-medical-500 rounded-full transition-all duration-1000" style={{ width: `${(gradientsCollected/5)*100}%` }} />
                  </div>
              </div>
          </div>
      </div>

      {/* Runtime Event Log */}
      <div className="flex-1 bg-slate-900 rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
          <div className="flex items-center justify-between gap-2 text-slate-400 text-[10px] mb-4 border-b border-slate-800 pb-3 font-bold uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                  <Terminal size={12} className="text-amber-500" /> Swarm Consensus Log
              </div>
              <span className="text-slate-600 hidden sm:inline">LATEST_HEARTBEATS: 0.1ms</span>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1 font-mono text-[10px] custom-scrollbar pr-2">
            {electionEvents.map((ev, i) => (
              <div key={i} className="flex gap-2 sm:gap-4 group hover:bg-slate-900/50 p-1.5 rounded transition-all duration-200">
                <span className="text-slate-700 font-bold shrink-0">[{ev.time}]</span>
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1 h-1 rounded-full shrink-0 ${ev.type === 'HEARTBEAT_TIMEOUT' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]'}`} />
                    <span className={`truncate ${ev.type === 'HEARTBEAT_TIMEOUT' ? 'text-rose-400/90 font-bold' : 'text-emerald-400/90 font-medium'}`}>
                      {ev.message}
                    </span>
                </div>
              </div>
            ))}
            {electionEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-2 opacity-50">
                  <ShieldCheck size={24} />
                  <p className="italic uppercase tracking-widest text-[9px] font-black text-center">No destabilization events recorded.</p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default LeaderElection;
