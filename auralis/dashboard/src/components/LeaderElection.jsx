import React from 'react';
import { Terminal, Clock, Activity, Loader2 } from 'lucide-react';

const LeaderElection = ({ currentLeader, term, lastElectionTime, electionEvents, roundInProgress, gradientsCollected }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <Activity className="text-amber-500" /> Raft Consensus Health
        </h2>
        <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20">
          Term: {term || 1}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Current Leader</p>
          <p className="text-amber-400 font-mono text-lg truncate">
            {currentLeader ? currentLeader : "ELECTION IN PROGRESS..."}
          </p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Last Election</p>
          <div className="flex items-center gap-2 text-slate-200">
            <Clock size={16} />
            <span className="font-mono">{lastElectionTime || 12}s ago</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
            <p className="text-slate-300 text-sm font-semibold">Federation Progress</p>
            <span className="text-slate-400 text-xs">Round {roundInProgress || 1}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-4 relative overflow-hidden">
          <div 
            className="bg-indigo-500 h-full transition-all duration-700"
            style={{ width: `${(gradientsCollected / 5) * 100}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs mt-2 italic flex items-center gap-1">
          {gradientsCollected < 5 ? <Loader2 size={12} className="animate-spin" /> : null}
          Gradients Collected: {gradientsCollected}/5 Nodes
        </p>
      </div>

      <div className="flex-1 overflow-hidden bg-black/40 rounded-lg p-3 border border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-3 border-b border-slate-800 pb-2">
            <Terminal size={14} /> Swarm Event Log
        </div>
        <div className="space-y-2 overflow-y-auto h-48 font-mono text-xs">
          {electionEvents.map((ev, i) => (
            <div key={i} className="flex gap-3 text-slate-500 border-l-2 border-slate-800 pl-3">
              <span className="text-slate-600">[{ev.time}]</span>
              <span className={ev.type === 'HEARTBEAT_TIMEOUT' ? 'text-rose-400' : 'text-emerald-400'}>
                {ev.message}
              </span>
            </div>
          ))}
          {electionEvents.length === 0 && <p className="text-slate-700 italic">No consensus events recorded.</p>}
        </div>
      </div>
    </div>
  );
};

export default LeaderElection;
