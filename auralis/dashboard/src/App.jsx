import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Globe, Activity, FileText, AlertCircle, Signal, Terminal, FlaskConical, ShieldAlert } from 'lucide-react';
import WorldMap from './components/WorldMap';
import LeaderElection from './components/LeaderElection';
import DriftMonitor from './components/DriftMonitor';
import TrainingGraph from './components/TrainingGraph';
import DiagnosticView from './components/DiagnosticView';

const API_BASE = import.meta.env.PROD ? "/api" : "http://localhost:8000";
const WS_URL = import.meta.env.PROD ? "" : "ws://localhost:8000/ws/events";

function App() {
  const [activeTab, setActiveTab] = useState('world-map');
  const [systemHealth, setSystemHealth] = useState('healthy');
  const [nodes, setNodes] = useState([]);
  const [leader, setLeader] = useState(null);
  const [round, setRound] = useState(0);
  const [accuracyHistory, setAccuracyHistory] = useState([]);
  const [driftHistory, setDriftHistory] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [electionEvents, setElectionEvents] = useState([]);
  const [diagnosticSample, setDiagnosticSample] = useState(null);
  const [recentElection, setRecentElection] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const ws = useRef(null);

  const fetchData = async () => {
    try {
      const responses = await Promise.all([
        fetch(`${API_BASE}/nodes`).catch(() => null),
        fetch(`${API_BASE}/status`).catch(() => null),
        fetch(`${API_BASE}/accuracy`).catch(() => null),
        fetch(`${API_BASE}/diagnosis/sample`).catch(() => null)
      ]);
      
      const [nodesData, statusData, accData, diagData] = await Promise.all(
          responses.map(r => (r && r.ok) ? r.json() : null)
      );

      if (Array.isArray(nodesData)) setNodes(nodesData);
      
      if (statusData) {
          if (statusData.raft_leader && statusData.raft_leader !== leader) {
              const time = new Date().toLocaleTimeString();
              // Synthesize a leadership transition event for the UI
              setElectionEvents(prev => [
                { time, type: 'new_leader', message: `Stateless Consensus reached: ${statusData.raft_leader} elected.` },
                ...prev.slice(0, 4)
              ]);
              setRecentElection(true);
              setTimeout(() => setRecentElection(false), 3000);
              setLeader(statusData.raft_leader);
          }
          if (statusData.current_round) setRound(statusData.current_round);
      }
      
      if (Array.isArray(accData)) {
          const history = accData.map(a => ({ ...a, baseline: 71 }));
          setAccuracyHistory(history);
      }
      
      if (diagData) setDiagnosticSample(diagData);
    } catch (err) {
      console.warn("API disconnect. Retrying sync...");
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchData();
  }, []);

  // WebSocket Connection & Polling Fallback for Serverless (Vercel)
  useEffect(() => {
    if (!WS_URL) {
        // In Production (Vercel), use polling as fallback for WebSockets
        const poll = setInterval(fetchData, 5000);
        setConnected(true);
        return () => clearInterval(poll);
    }

    const connect = () => {
        ws.current = new WebSocket(WS_URL);
        ws.current.onopen = () => {
            setConnected(true);
            console.log("WebSocket Connected");
        };
        ws.current.onclose = () => {
            setConnected(false);
            console.log("WebSocket Local Closed, using local polling...");
            setTimeout(connect, 5000);
        };
        ws.current.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            handleWsEvent(payload);
        };
    };
    connect();
    return () => ws.current?.close();
  }, []);

  const handleWsEvent = (payload) => {
    const { type, data } = payload;
    const time = new Date().toLocaleTimeString();

    switch (type) {
      case 'round_complete':
        setRound(r => r + 1);
        setAccuracyHistory(prev => [...prev, { round: data.round, accuracy: data.accuracy, baseline: 71 }]);
        break;
      case 'DRIFT_ALERT':
        setActiveAlerts(prev => [data, ...prev]);
        setSystemHealth('warning');
        break;
      case 'BYZANTINE_QUARANTINE':
        setElectionEvents(prev => [{ time, type, message: `Node ${data.node_id} QUARANTINED (norm: ${data.norm.toFixed(2)})` }, ...prev.slice(0, 4)]);
        break;
      case 'leader_failover':
        setRecentElection(true);
        setElectionEvents(prev => [{ time, type, message: `Leader failure detected. Triggering election term ${data.term}` }, ...prev.slice(0, 4)]);
        setTimeout(() => setRecentElection(false), 3000);
        break;
      case 'new_leader':
        setLeader(data.leader);
        setElectionEvents(prev => [{ time, type, message: `Consensus reached: ${data.leader} is new leader.` }, ...prev.slice(0, 4)]);
        break;
      default:
        console.log("Unhandled event:", type, data);
    }
  };

  const handleAuditAction = async (action) => {
    try {
        await fetch(`${API_BASE}/audit/log`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action, timestamp: new Date().toISOString() })
        });
    } catch (err) {
        console.error("Audit log failed:", err);
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'world-map', label: 'Swarm', icon: <Globe size={18} /> },
    { id: 'training', label: 'Learning', icon: <Activity size={18} /> },
    { id: 'drift', label: 'Drift', icon: <AlertCircle size={18} /> },
    { id: 'diagnosis', label: 'Audit', icon: <FileText size={18} /> },
    { id: 'election', label: 'Consensus', icon: <Terminal size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-medical-100 selection:text-medical-900 pb-20 lg:pb-0">
      {/* Top Status Bar */}
      <header className="h-16 lg:h-20 border-b border-slate-200 bg-white/70 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 sticky top-0 z-50">
        <div className="flex items-center gap-3 lg:gap-5">
            <div className="bg-medical-600 p-2 lg:p-2.5 rounded-xl lg:rounded-2xl shadow-lg shadow-medical-600/20">
                <FlaskConical className="text-white" size={20} />
            </div>
            <div>
                <h1 className="text-base lg:text-xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  GMIS <span className="hidden sm:inline text-slate-400 font-light">Global Intelligence</span>
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[8px] lg:text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {connected ? 'Active' : 'Syncing...'}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-10">
            <div className="hidden md:block text-right">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Network Status</p>
                <div className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase border transition-all ${systemHealth === 'healthy' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                    {systemHealth === 'healthy' ? 'Optimized' : 'Attention'}
                </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-slate-100" />
            <div className="text-right flex flex-col items-end">
                <p className="text-[8px] lg:text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5 lg:mb-1.5">Round</p>
                <p className="text-lg lg:text-2xl font-display font-extrabold text-medical-600 tabular-nums leading-none">#{round}</p>
            </div>
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-400 hover:text-medical-600 transition-colors"
            >
                <ShieldAlert size={20} />
            </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-white border-b border-slate-200 z-40 p-6 animate-in slide-in-from-top duration-300">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-medical-200 flex items-center justify-center text-medical-700 font-bold text-xs">AD</div>
                    <div>
                        <p className="text-xs font-bold text-slate-800 leading-none">Admin Terminal</p>
                        <p className="text-[10px] text-slate-500 mt-1">Clearance: LVL 4</p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${systemHealth === 'healthy' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                    {systemHealth === 'healthy' ? 'System OK' : 'Attention'}
                </div>
            </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Sidebar Nav - Desktop Only */}
        <nav className="hidden lg:flex w-72 border-r border-slate-200 bg-white p-6 flex-col space-y-3">
            <div className="px-4 py-2 border-b border-slate-50 mb-4">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Navigation Portfolio</span>
            </div>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id ? 'bg-medical-50 text-medical-700 shadow-sm border border-medical-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <div className={`${activeTab === tab.id ? 'text-medical-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{tab.icon}</div>
                    {tab.label}
                </button>
            ))}
            
            <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8 self-end">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Hospital Authority</p>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-medical-200 flex items-center justify-center text-medical-700 font-bold text-xs">AD</div>
                    <div>
                        <p className="text-xs font-bold text-slate-800 leading-none">Admin Terminal</p>
                        <p className="text-[10px] text-slate-500">Clearance: LVL 4</p>
                    </div>
                </div>
            </div>
        </nav>

        {/* Floating Bottom Nav - Mobile Only */}
        <nav className="lg:hidden fixed bottom-6 inset-x-4 h-16 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl z-50 flex items-center justify-around px-2 py-1 ring-1 ring-slate-900/5">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'text-medical-600 scale-110' : 'text-slate-400'}`}
                >
                    <div className={`${activeTab === tab.id ? 'bg-medical-50 p-2 rounded-xl' : 'p-2'}`}>{tab.icon}</div>
                    <span className="text-[9px] font-bold uppercase tracking-tight">{tab.label.split(' ')[0]}</span>
                </button>
            ))}
        </nav>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-10 overflow-y-auto bg-slate-25 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="max-w-7xl mx-auto h-full">
              {activeTab === 'world-map' && <WorldMap nodes={nodes} leader={leader} recentElection={recentElection} />}
              {activeTab === 'training' && <TrainingGraph trainingData={accuracyHistory} />}
              {activeTab === 'drift' && <DriftMonitor driftData={accuracyHistory} activeAlerts={activeAlerts} onDismissAlert={(i) => setActiveAlerts(a => a.filter((_, idx) => idx !== i))} />}
              {activeTab === 'diagnosis' && <DiagnosticView diagnosticData={diagnosticSample} onAuditAction={handleAuditAction} />}
              {activeTab === 'election' && <LeaderElection currentLeader={leader} term={12} lastElectionTime={45} electionEvents={electionEvents} roundInProgress={round} gradientsCollected={3} />}
            </div>
        </main>
      </div>

      <footer className="h-12 border-t border-slate-200 bg-white flex items-center justify-between px-8 text-[11px] text-slate-400 font-sans font-medium tracking-tight">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-pulse" />
            GLOBAL MEDICAL INTELLIGENCE SWARM (GMIS) INFRASTRUCTURE • v1.0.4-LOCKED
          </div>
          <div className="flex items-center gap-8">
              <span className="flex items-center gap-1.5"><Signal size={12} className="text-emerald-500" /> Latency: 18ms (Stabilized)</span>
              <span>Ref-Time: {new Date().toLocaleTimeString()} (UTC)</span>
          </div>
      </footer>
    </div>
  );
}

export default App;
